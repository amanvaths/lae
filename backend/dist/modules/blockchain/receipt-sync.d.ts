import { ethers } from "ethers";
/** Scan matrix events via eth_getBlockReceipts — no archive eth_getLogs required. */
export declare function syncMatrixReceiptsInRange(fromBlock: number, toBlock: number, provider?: ethers.JsonRpcProvider): Promise<number>;
/** Full deploy→head receipt backfill. */
export declare function backfillLaeUserEventsFromChain(): Promise<number>;
//# sourceMappingURL=receipt-sync.d.ts.map