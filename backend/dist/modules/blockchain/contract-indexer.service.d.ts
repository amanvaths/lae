import { ethers } from "ethers";
export interface ChainEventRecord {
    txHash: string;
    blockNumber: number;
    logIndex: number;
    eventName: string;
    args: Record<string, unknown>;
    walletAddress?: string;
}
/**
 * Persist raw on-chain event. Contract owns all business logic — backend indexes only.
 */
export declare function saveChainEvent(record: ChainEventRecord): Promise<void>;
export declare function startContractEventIndexer(contractAddress: string, provider: ethers.Provider): void;
//# sourceMappingURL=contract-indexer.service.d.ts.map