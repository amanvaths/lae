export { getIndexerProvider } from "./rpc-providers.js";
export declare function syncBlockRange(fromBlock: bigint, toBlock: bigint): Promise<number>;
export declare function runIndexerSync(): Promise<void>;
export declare function startBlockchainSyncEngine(): void;
export declare function stopBlockchainSyncEngine(): void;
export declare function replayFromBlock(fromBlock: bigint): Promise<number>;
export declare function getMatrixDeployBlock(): bigint;
//# sourceMappingURL=sync-engine.d.ts.map