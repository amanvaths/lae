import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CONTRACTS, MATRIX_CORE_DEPLOY_BLOCK, CHAIN } from "../../config/chains.js";
import { MATRIX_CORE_EVENTS } from "./matrix-core-abi.js";
import { parseEthersLog, processIndexedLog } from "./event-processor.js";
import { syncMatrixReceiptsInRange } from "./receipt-sync.js";
import { backfillLaeUsersFromChain } from "./chain-backfill.js";
import {
  getIndexerProvider,
  providerForUrl,
  rpcUrls,
  clearRpcProviders,
} from "./rpc-providers.js";

export { getIndexerProvider } from "./rpc-providers.js";

const matrixCoreIface = new ethers.Interface([...MATRIX_CORE_EVENTS]);

const CONTRACT_TARGETS: Array<{
  key: "matrixCore";
  address: string;
  iface: ethers.Interface;
}> = [{ key: "matrixCore", address: CONTRACTS.matrixCore, iface: matrixCoreIface }];

let syncing = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function isLogRpcError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /rate limit|limit exceeded|archive requests|too many requests|429|32005|32602/i.test(
      msg
    ) || /BAD_DATA|UNKNOWN_ERROR/i.test(msg)
  );
}

function syncMode(): "auto" | "logs" | "receipt" {
  const m = (process.env.INDEXER_SYNC_MODE ?? "auto").toLowerCase();
  if (m === "logs" || m === "receipt") return m;
  return "auto";
}

async function getIndexerState() {
  return prisma.indexerState.upsert({
    where: { id: "main" },
    create: {
      chainId: CHAIN.chainId,
      lastBlock: MATRIX_CORE_DEPLOY_BLOCK > 0n ? MATRIX_CORE_DEPLOY_BLOCK - 1n : 0n,
    },
    update: {},
  });
}

async function alignIndexerToDeploy(): Promise<void> {
  const deploy = MATRIX_CORE_DEPLOY_BLOCK;
  if (deploy <= 0n) return;
  const state = await getIndexerState();
  if (state.lastBlock >= deploy - 1n) return;
  await prisma.indexerState.update({
    where: { id: "main" },
    data: { lastBlock: deploy > 0n ? deploy - 1n : 0n, lastBlockHash: null },
  });
}

async function rewindForReorg(fromBlock: bigint): Promise<void> {
  await prisma.indexerState.update({
    where: { id: "main" },
    data: { lastBlock: fromBlock > 0n ? fromBlock - 1n : 0n },
  });
}

async function fetchLogsWithRetry(
  address: string,
  fromBlock: bigint,
  toBlock: bigint
): Promise<ethers.Log[]> {
  let span = toBlock - fromBlock + 1n;
  const minSpan = BigInt(process.env.INDEXER_MIN_LOG_SPAN ?? "1");
  const urls = rpcUrls();
  let lastErr: unknown;

  while (span >= minSpan) {
    const end = fromBlock + span - 1n > toBlock ? toBlock : fromBlock + span - 1n;
    for (const url of urls) {
      try {
        const p = providerForUrl(url);
        const logs = await p.getLogs({
          address,
          fromBlock: Number(fromBlock),
          toBlock: Number(end),
        });
        return logs;
      } catch (err) {
        lastErr = err;
        if (!isLogRpcError(err)) throw err;
      }
    }
    if (span <= minSpan) break;
    span = span / 2n;
    await new Promise((r) => setTimeout(r, Number(process.env.INDEXER_RPC_RETRY_MS ?? "500")));
  }

  throw lastErr ?? new Error("eth_getLogs failed on all RPC endpoints");
}

async function syncViaGetLogs(fromBlock: bigint, toBlock: bigint): Promise<number> {
  let processed = 0;
  const batchSize = BigInt(process.env.INDEXER_BATCH_SIZE ?? "50");

  for (const target of CONTRACT_TARGETS) {
    if (!target.address || target.address === "0x0000000000000000000000000000000000000000") {
      continue;
    }
    let chunkStart = fromBlock;
    while (chunkStart <= toBlock) {
      const chunkEnd =
        chunkStart + batchSize - 1n > toBlock ? toBlock : chunkStart + batchSize - 1n;
      const logs = await fetchLogsWithRetry(target.address, chunkStart, chunkEnd);
      for (const raw of logs) {
        try {
          const parsed = target.iface.parseLog({ topics: [...raw.topics], data: raw.data });
          if (!parsed) continue;
          await processIndexedLog(parseEthersLog(target.key, parsed, raw));
          processed++;
        } catch (err) {
          console.error("[indexer] log parse error:", err);
        }
      }
      chunkStart = chunkEnd + 1n;
    }
  }
  return processed;
}

export async function syncBlockRange(fromBlock: bigint, toBlock: bigint): Promise<number> {
  const mode = syncMode();
  let processed = 0;

  if (mode !== "receipt") {
    try {
      processed = await syncViaGetLogs(fromBlock, toBlock);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (mode === "logs") throw err;
      console.warn(`[indexer] eth_getLogs unavailable (${msg.slice(0, 80)}…) — receipt scan`);
      processed = await syncMatrixReceiptsInRange(
        Number(fromBlock),
        Number(toBlock),
        getIndexerProvider()
      );
    }
  } else {
    processed = await syncMatrixReceiptsInRange(
      Number(fromBlock),
      Number(toBlock),
      getIndexerProvider()
    );
  }

  const p = getIndexerProvider();
  const block = await p.getBlock(Number(toBlock));
  await prisma.indexerState.update({
    where: { id: "main" },
    data: {
      lastBlock: toBlock,
      lastBlockHash: block?.hash ?? null,
      chainId: CHAIN.chainId,
    },
  });
  return processed;
}

export async function runIndexerSync(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    const state = await getIndexerState();
    const p = getIndexerProvider();
    const latest = BigInt(await p.getBlockNumber());
    const reorgDepth = BigInt(process.env.INDEXER_REORG_DEPTH ?? "12");
    const startBlock = MATRIX_CORE_DEPLOY_BLOCK;

    if (state.lastBlockHash && state.lastBlock > 0n) {
      try {
        const stored = await p.getBlock(Number(state.lastBlock));
        if (stored && stored.hash !== state.lastBlockHash) {
          const rewind =
            state.lastBlock > reorgDepth ? state.lastBlock - reorgDepth : startBlock;
          await rewindForReorg(rewind);
        }
      } catch {
        /* continue */
      }
    }

    const refreshed = await getIndexerState();
    let cursor = refreshed.lastBlock + 1n;
    if (cursor < startBlock) cursor = startBlock;
    const batchSize = BigInt(process.env.INDEXER_BATCH_SIZE ?? "50");

    while (cursor <= latest) {
      const end = cursor + batchSize - 1n > latest ? latest : cursor + batchSize - 1n;
      try {
        await syncBlockRange(cursor, end);
      } catch (err) {
        console.error(`[indexer] sync failed at ${cursor}-${end}:`, err);
        break;
      }
      cursor = end + 1n;
    }
  } finally {
    syncing = false;
  }
}

export function startBlockchainSyncEngine(): void {
  const addr = CONTRACTS.matrixCore;
  if (!addr || addr === "0x0000000000000000000000000000000000000000") {
    console.warn("[indexer] Disabled — set LAE_MATRIX_CONTRACT_ADDRESS");
    return;
  }
  console.log(
    `[indexer] LAEClubMatrix sync on ${addr} (mode=${syncMode()}, rpc=${process.env.BSC_RPC_URL ?? CHAIN.rpcUrl})`
  );
  void (async () => {
    await alignIndexerToDeploy();
    try {
      await backfillLaeUsersFromChain();
    } catch (err) {
      console.warn("[indexer] user backfill:", err instanceof Error ? err.message : err);
    }
    await runIndexerSync();
  })();
  pollTimer = setInterval(() => void runIndexerSync(), Number(process.env.INDEXER_POLL_MS ?? "8000"));
  getIndexerProvider().on("block", () => void runIndexerSync());
}

export function stopBlockchainSyncEngine(): void {
  if (pollTimer) clearInterval(pollTimer);
  clearRpcProviders();
}

export async function replayFromBlock(fromBlock: bigint): Promise<number> {
  await prisma.indexerState.update({
    where: { id: "main" },
    data: { lastBlock: fromBlock > 0n ? fromBlock - 1n : 0n, lastBlockHash: null },
  });
  // Owner #1 is created in the constructor (no Registration event), so replay
  // must re-pull users from chain state or a post-reset DB stays empty.
  try {
    await backfillLaeUsersFromChain();
  } catch (err) {
    console.warn("[indexer] replay user backfill:", err instanceof Error ? err.message : err);
  }
  await runIndexerSync();
  return prisma.matrixCoreUser.count();
}

export function getMatrixDeployBlock(): bigint {
  return MATRIX_CORE_DEPLOY_BLOCK;
}
