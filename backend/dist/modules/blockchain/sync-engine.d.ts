import { ethers } from "ethers";
export declare function getIndexerProvider(): ethers.JsonRpcProvider;
/** Scan block range and project events — idempotent via txHash+logIndex keys */
export declare function syncBlockRange(fromBlock: bigint, toBlock: bigint): Promise<number>;
export declare function runIndexerSync(): Promise<void>;
/** Start polling sync + live listeners for new blocks */
export declare function startBlockchainSyncEngine(): void;
export declare function stopBlockchainSyncEngine(): void;
/** Manual replay from block (admin/recovery) */
export declare function replayFromBlock(fromBlock: bigint): Promise<void>;
//# sourceMappingURL=sync-engine.d.ts.map