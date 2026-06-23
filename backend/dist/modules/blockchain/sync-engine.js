import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS, LAE_MATRIX_DEPLOY_BLOCK } from "../../config/chains.js";
import { LAE_MATRIX_EVENTS } from "./abis.js";
import { parseEthersLog, processIndexedLog } from "./event-processor.js";
import { backfillLaeUsersFromChain } from "./chain-backfill.js";
import { backfillLaeUserEventsFromChain } from "./lae-event-backfill.js";
const laeMatrixIface = new ethers.Interface([...LAE_MATRIX_EVENTS]);
const CONTRACT_TARGETS = [{ key: "laeMatrix", address: CONTRACTS.laeMatrix, iface: laeMatrixIface }];
let provider = null;
let syncing = false;
let pollTimer = null;
let lastSelfHealAt = 0;
const SELF_HEAL_INTERVAL_MS = 60_000;
const matrixReadIface = ["function lastUserId() view returns (uint256)"];
export function getIndexerProvider() {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(CHAIN.rpcUrl, CHAIN.chainId);
    }
    return provider;
}
async function getIndexerState() {
    return prisma.indexerState.upsert({
        where: { id: "main" },
        create: { chainId: CHAIN.chainId, lastBlock: CHAIN.startBlock > 0n ? CHAIN.startBlock - 1n : 0n },
        update: {},
    });
}
/** Skip empty history — jump to LAE Matrix deploy block if cursor is still before it. */
async function alignIndexerToMatrixDeploy() {
    const deploy = LAE_MATRIX_DEPLOY_BLOCK;
    if (deploy <= 0n)
        return;
    const state = await getIndexerState();
    if (state.lastBlock >= deploy - 1n)
        return;
    console.warn(`[indexer] Fast-forward ${state.lastBlock.toString()} → ${(deploy - 1n).toString()} (matrix deploy block)`);
    await prisma.indexerState.update({
        where: { id: "main" },
        data: { lastBlock: deploy > 0n ? deploy - 1n : 0n, lastBlockHash: null },
    });
}
async function rewindForReorg(fromBlock) {
    console.warn(`[indexer] Reorg detected — rewinding from block ${fromBlock}`);
    await prisma.indexerState.update({
        where: { id: "main" },
        data: { lastBlock: fromBlock > 0n ? fromBlock - 1n : 0n },
    });
}
async function fetchLogsWithRetry(p, address, fromBlock, toBlock) {
    let span = toBlock - fromBlock + 1n;
    while (span >= 1n) {
        const end = fromBlock + span - 1n > toBlock ? toBlock : fromBlock + span - 1n;
        try {
            return await p.getLogs({
                address,
                fromBlock: Number(fromBlock),
                toBlock: Number(end),
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (span <= 10n)
                throw err;
            span = span / 2n;
            console.warn(`[indexer] getLogs ${fromBlock}-${end} failed (${msg.slice(0, 80)}), retry smaller span ${span}`);
        }
    }
    return [];
}
/** Scan block range and project events — idempotent via txHash+logIndex keys */
export async function syncBlockRange(fromBlock, toBlock) {
    const p = getIndexerProvider();
    let processed = 0;
    for (const target of CONTRACT_TARGETS) {
        if (!target.address || target.address === "0x0000000000000000000000000000000000000000") {
            continue;
        }
        let chunkStart = fromBlock;
        while (chunkStart <= toBlock) {
            const chunkEnd = chunkStart + BigInt(CHAIN.batchSize) - 1n > toBlock
                ? toBlock
                : chunkStart + BigInt(CHAIN.batchSize) - 1n;
            const logs = await fetchLogsWithRetry(p, target.address, chunkStart, chunkEnd);
            for (const raw of logs) {
                try {
                    const parsed = target.iface.parseLog({
                        topics: [...raw.topics],
                        data: raw.data,
                    });
                    if (!parsed)
                        continue;
                    const log = parseEthersLog(target.key, parsed, raw);
                    await processIndexedLog(log);
                    processed++;
                }
                catch (err) {
                    console.error("[indexer] log parse error:", err);
                }
            }
            chunkStart = chunkEnd + 1n;
        }
    }
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
/**
 * Recover indexed data from direct contract reads when the cursor has moved
 * past the deploy block but the DB is empty (e.g. after an admin reset, or
 * when the public RPC blocks historical eth_getLogs). Throttled so it does not
 * run on every poll.
 */
async function selfHealFromChainIfBehind() {
    const now = Date.now();
    if (now - lastSelfHealAt < SELF_HEAL_INTERVAL_MS)
        return;
    lastSelfHealAt = now;
    try {
        const p = getIndexerProvider();
        const matrix = new ethers.Contract(CONTRACTS.laeMatrix, matrixReadIface, p);
        const onchainUsers = Number(await matrix.lastUserId());
        if (onchainUsers < 1)
            return;
        const indexedUsers = await prisma.indexedLaeUser.count();
        if (indexedUsers >= onchainUsers)
            return;
        console.warn(`[indexer] Self-heal: on-chain users ${onchainUsers} > indexed ${indexedUsers} — backfilling from chain`);
        await backfillLaeUsersFromChain();
        await backfillLaeUserEventsFromChain().catch((err) => {
            console.error("[indexer] self-heal event backfill failed:", err);
        });
    }
    catch (err) {
        console.error("[indexer] self-heal check failed:", err);
    }
}
export async function runIndexerSync() {
    if (syncing)
        return;
    syncing = true;
    try {
        await selfHealFromChainIfBehind();
        const state = await getIndexerState();
        const p = getIndexerProvider();
        const latest = BigInt(await p.getBlockNumber());
        if (state.lastBlockHash && state.lastBlock > 0n) {
            try {
                const stored = await p.getBlock(Number(state.lastBlock));
                if (stored && stored.hash !== state.lastBlockHash) {
                    const rewind = state.lastBlock > BigInt(CHAIN.reorgDepth)
                        ? state.lastBlock - BigInt(CHAIN.reorgDepth)
                        : CHAIN.startBlock;
                    await rewindForReorg(rewind);
                }
            }
            catch {
                /* block not found — continue from last */
            }
        }
        const refreshed = await getIndexerState();
        let cursor = refreshed.lastBlock + 1n;
        if (cursor < CHAIN.startBlock)
            cursor = CHAIN.startBlock;
        while (cursor <= latest) {
            const end = cursor + BigInt(CHAIN.batchSize) > latest
                ? latest
                : cursor + BigInt(CHAIN.batchSize) - 1n;
            try {
                const n = await syncBlockRange(cursor, end);
                if (n > 0) {
                    console.log(`[indexer] blocks ${cursor}-${end}: ${n} events`);
                }
            }
            catch (err) {
                console.error(`[indexer] sync failed at ${cursor}-${end}:`, err);
                break;
            }
            cursor = end + 1n;
        }
    }
    catch (err) {
        console.error("[indexer] runIndexerSync error:", err);
    }
    finally {
        syncing = false;
    }
}
/** Start polling sync + live listeners for new blocks */
export function startBlockchainSyncEngine() {
    const hasLae = CONTRACTS.laeMatrix &&
        CONTRACTS.laeMatrix !== "0x0000000000000000000000000000000000000000";
    if (!hasLae) {
        console.warn("[indexer] Disabled — set LAE_MATRIX_CONTRACT_ADDRESS");
        return;
    }
    console.log(`[indexer] LAE Matrix sync on ${CONTRACTS.laeMatrix}`);
    void (async () => {
        await alignIndexerToMatrixDeploy();
        try {
            await backfillLaeUsersFromChain();
        }
        catch (err) {
            console.error("[indexer] chain user backfill failed:", err);
        }
        void backfillLaeUserEventsFromChain().catch((err) => {
            console.error("[indexer] chain event backfill failed:", err);
        });
        await runIndexerSync();
    })();
    pollTimer = setInterval(() => {
        void runIndexerSync();
    }, CHAIN.pollMs);
    const p = getIndexerProvider();
    p.on("block", () => {
        void runIndexerSync();
    });
}
export function stopBlockchainSyncEngine() {
    if (pollTimer)
        clearInterval(pollTimer);
    provider?.removeAllListeners();
}
/** Manual replay from block (admin/recovery) */
export async function replayFromBlock(fromBlock, options) {
    if (options?.forceEventBackfill) {
        process.env.FORCE_EVENT_BACKFILL = "1";
    }
    await backfillLaeUsersFromChain();
    try {
        await backfillLaeUserEventsFromChain();
    }
    catch (err) {
        console.error("[indexer] event backfill during replay failed:", err);
    }
    const cursor = fromBlock > 0n ? fromBlock - 1n : 0n;
    await prisma.indexerState.update({
        where: { id: "main" },
        data: { lastBlock: cursor, lastBlockHash: null },
    });
    try {
        await runIndexerSync();
    }
    catch (err) {
        console.error("[indexer] replay log sync failed (users backfilled from chain):", err);
    }
    const state = await prisma.indexerState.findUnique({ where: { id: "main" } });
    const users = await prisma.indexedLaeUser.count();
    console.log(`[indexer] Replay done — block ${state?.lastBlock?.toString() ?? "?"}, users ${users}`);
    return users;
}
export function getMatrixDeployBlock() {
    return LAE_MATRIX_DEPLOY_BLOCK;
}
//# sourceMappingURL=sync-engine.js.map