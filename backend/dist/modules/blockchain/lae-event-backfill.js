import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS, LAE_MATRIX_DEPLOY_BLOCK } from "../../config/chains.js";
import { LAE_MATRIX_EVENTS } from "./abis.js";
import { parseEthersLog, processIndexedLog } from "./event-processor.js";
import { repairLaeIncomeReceiverAddresses } from "./lae-user-lookup.js";
const BLOCK_DELAY_MS = 25;
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function matrixAddress() {
    return CONTRACTS.laeMatrix.toLowerCase();
}
async function processReceiptLogs(receipt, iface) {
    let n = 0;
    for (const raw of receipt.logs) {
        if (raw.address.toLowerCase() !== matrixAddress())
            continue;
        try {
            const parsed = iface.parseLog({ topics: [...raw.topics], data: raw.data });
            if (!parsed)
                continue;
            const log = parseEthersLog("laeMatrix", parsed, raw);
            await processIndexedLog(log);
            n++;
        }
        catch {
            /* skip */
        }
    }
    return n;
}
/** Skip full receipt scan when indexer already caught up (unless force). */
async function shouldSkipReceiptScan(toBlock) {
    if (process.env.FORCE_EVENT_BACKFILL === "1")
        return false;
    const [incomeCount, state] = await Promise.all([
        prisma.indexedLaeIncome.count(),
        prisma.indexerState.findUnique({ where: { id: "main" } }),
    ]);
    if (incomeCount === 0)
        return false;
    if (!state?.lastBlock)
        return false;
    const lag = toBlock - Number(state.lastBlock);
    return lag <= 50;
}
/**
 * Scan deploy→head blocks for txs to the matrix contract; parse receipt logs.
 * Works on free BSC RPCs that block historical eth_getLogs.
 */
export async function backfillLaeUserEventsFromChain() {
    const addr = CONTRACTS.laeMatrix;
    if (!addr || addr === "0x0000000000000000000000000000000000000000")
        return 0;
    const provider = new ethers.JsonRpcProvider(CHAIN.rpcUrl, CHAIN.chainId);
    const iface = new ethers.Interface([...LAE_MATRIX_EVENTS]);
    const fromBlock = Number(LAE_MATRIX_DEPLOY_BLOCK);
    const toBlock = await provider.getBlockNumber();
    if (fromBlock > toBlock)
        return 0;
    if (await shouldSkipReceiptScan(toBlock)) {
        console.log("[backfill] Event scan skipped — indexer already has income data");
        return 0;
    }
    let processed = 0;
    let txCount = 0;
    const totalBlocks = toBlock - fromBlock + 1;
    for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
        const done = blockNum - fromBlock;
        if (done > 0 && done % 500 === 0) {
            console.log(`[backfill] Receipt scan ${done}/${totalBlocks} blocks…`);
            await sleep(BLOCK_DELAY_MS);
        }
        let block;
        try {
            block = await provider.getBlock(blockNum, true);
        }
        catch {
            continue;
        }
        const txs = block?.prefetchedTransactions ?? [];
        if (!txs.length)
            continue;
        for (const tx of txs) {
            if (tx.to?.toLowerCase() !== matrixAddress())
                continue;
            txCount++;
            try {
                const receipt = await provider.getTransactionReceipt(tx.hash);
                if (receipt)
                    processed += await processReceiptLogs(receipt, iface);
            }
            catch (err) {
                console.warn(`[backfill] receipt ${tx.hash}:`, err instanceof Error ? err.message : err);
            }
        }
    }
    await repairLaeIncomeReceiverAddresses();
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
    const incomeCount = await prisma.indexedLaeIncome.count();
    console.log(`[backfill] Receipt scan: ${processed} events from ${txCount} matrix txs (blocks ${fromBlock}-${toBlock}, incomeRows=${incomeCount})`);
    return processed;
}
//# sourceMappingURL=lae-event-backfill.js.map