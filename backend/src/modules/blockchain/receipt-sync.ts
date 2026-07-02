import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS } from "../../config/chains.js";
import { MATRIX_CORE_EVENTS } from "./matrix-core-abi.js";
import { parseEthersLog, processIndexedLog } from "./event-processor.js";
import { getIndexerProvider } from "./rpc-providers.js";

const SCAN_CONCURRENCY = Number(process.env.INDEXER_SCAN_CONCURRENCY ?? "32");
const matrixIface = new ethers.Interface([...MATRIX_CORE_EVENTS]);

function matrixAddress(): string {
  return CONTRACTS.matrixCore.toLowerCase();
}

function blockHex(n: number): string {
  return `0x${n.toString(16)}`;
}

async function processBlockReceipts(
  blockNum: number,
  provider: ethers.JsonRpcProvider
): Promise<number> {
  let rawReceipts: Array<{
    logs?: Array<{
      address: string;
      topics: string[];
      data: string;
      transactionHash: string;
      blockNumber: string;
      transactionIndex: string;
      logIndex: string;
    }>;
  }> | null;
  try {
    rawReceipts = await provider.send("eth_getBlockReceipts", [blockHex(blockNum)]);
  } catch {
    return 0;
  }
  if (!Array.isArray(rawReceipts) || rawReceipts.length === 0) return 0;

  let processed = 0;
  for (const receipt of rawReceipts) {
    for (const log of receipt.logs ?? []) {
      if (log.address.toLowerCase() !== matrixAddress()) continue;
      try {
        const parsed = matrixIface.parseLog({ topics: [...log.topics], data: log.data });
        if (!parsed) continue;
        const rawLog = {
          transactionHash: log.transactionHash,
          index: Number(log.logIndex),
          blockNumber: Number(log.blockNumber),
          topics: log.topics,
          data: log.data,
          address: log.address,
        } as unknown as ethers.Log;
        await processIndexedLog(parseEthersLog("matrixCore", parsed, rawLog));
        processed++;
      } catch (err) {
        // Don't swallow silently — an unparseable log is expected, but a DB/
        // processing error (e.g. a missing ON CONFLICT constraint) must surface.
        console.error(
          `[indexer] matrix log processing failed (tx=${log.transactionHash} logIndex=${log.logIndex}):`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }
  return processed;
}

/** Scan matrix events via eth_getBlockReceipts — no archive eth_getLogs required. */
export async function syncMatrixReceiptsInRange(
  fromBlock: number,
  toBlock: number,
  provider: ethers.JsonRpcProvider = getIndexerProvider()
): Promise<number> {
  const addr = CONTRACTS.matrixCore;
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return 0;
  if (fromBlock > toBlock) return 0;

  let processed = 0;
  let blocksWithTx = 0;

  for (let cursor = fromBlock; cursor <= toBlock; cursor += SCAN_CONCURRENCY) {
    const batch: number[] = [];
    for (let i = 0; i < SCAN_CONCURRENCY && cursor + i <= toBlock; i++) {
      batch.push(cursor + i);
    }

    const batchEvents = await Promise.all(
      batch.map((blockNum) => processBlockReceipts(blockNum, provider))
    );
    processed += batchEvents.reduce((a, b) => a + b, 0);
    blocksWithTx += batchEvents.filter((n) => n > 0).length;

    if (cursor === fromBlock || cursor % 1000 < SCAN_CONCURRENCY) {
      console.log(`[indexer] Receipt scan progress: block ${cursor}/${toBlock}…`);
    }
  }

  console.log(
    `[indexer] Receipt scan ${fromBlock}-${toBlock}: ${processed} events (${blocksWithTx} blocks with matrix logs)`
  );
  return processed;
}

/** Full deploy→head receipt backfill. */
export async function backfillLaeUserEventsFromChain(): Promise<number> {
  const fromBlock = Number(
    process.env.LAE_MATRIX_DEPLOY_BLOCK ??
      process.env.MATRIX_CORE_DEPLOY_BLOCK ??
      process.env.INDEXER_START_BLOCK ??
      "0"
  );
  const provider = getIndexerProvider();
  const toBlock = await provider.getBlockNumber();
  if (fromBlock > toBlock) return 0;

  const processed = await syncMatrixReceiptsInRange(fromBlock, toBlock, provider);

  const headBlock = await provider.getBlock(toBlock);
  await prisma.indexerState.upsert({
    where: { id: "main" },
    create: {
      chainId: CHAIN.chainId,
      lastBlock: BigInt(toBlock),
      lastBlockHash: headBlock?.hash ?? null,
    },
    update: {
      lastBlock: BigInt(toBlock),
      lastBlockHash: headBlock?.hash ?? null,
      chainId: CHAIN.chainId,
    },
  });

  return processed;
}
