import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS } from "../../config/chains.js";
import { LAE_MATRIX_EVENTS } from "./abis.js";
import { parseEthersLog, processIndexedLog } from "./event-processor.js";
const laeMatrixIface = new ethers.Interface([...LAE_MATRIX_EVENTS]);
const CONTRACT_TARGETS = [{ key: "laeMatrix", address: CONTRACTS.laeMatrix, iface: laeMatrixIface }];
let provider = null;
let syncing = false;
let pollTimer = null;
export function getIndexerProvider() {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(CHAIN.rpcUrl, CHAIN.chainId);
    }
    return provider;
}
async function getIndexerState() {
    return prisma.indexerState.upsert({
        where: { id: "main" },
        create: { chainId: CHAIN.chainId, lastBlock: CHAIN.startBlock },
        update: {},
    });
}
async function rewindForReorg(fromBlock) {
    console.warn(`[indexer] Reorg detected — rewinding from block ${fromBlock}`);
    await prisma.indexerState.update({
        where: { id: "main" },
        data: { lastBlock: fromBlock > 0n ? fromBlock - 1n : 0n },
    });
}
/** Scan block range and project events — idempotent via txHash+logIndex keys */
export async function syncBlockRange(fromBlock, toBlock) {
    const p = getIndexerProvider();
    let processed = 0;
    for (const target of CONTRACT_TARGETS) {
        if (!target.address || target.address === "0x0000000000000000000000000000000000000000") {
            continue;
        }
        const logs = await p.getLogs({
            address: target.address,
            fromBlock: Number(fromBlock),
            toBlock: Number(toBlock),
        });
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
export async function runIndexerSync() {
    if (syncing)
        return;
    syncing = true;
    try {
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
            const n = await syncBlockRange(cursor, end);
            if (n > 0) {
                console.log(`[indexer] blocks ${cursor}-${end}: ${n} events`);
            }
            cursor = end + 1n;
        }
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
    void runIndexerSync();
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
export async function replayFromBlock(fromBlock) {
    await prisma.indexerState.update({
        where: { id: "main" },
        data: { lastBlock: fromBlock > 0n ? fromBlock - 1n : 0n },
    });
    await runIndexerSync();
}
//# sourceMappingURL=sync-engine.js.map