import type { ethers } from "ethers";
export interface ParsedLog {
    contract: "senso" | "spin" | "staking";
    eventName: string;
    txHash: string;
    logIndex: number;
    blockNumber: number;
    args: Record<string, unknown>;
}
/** Idempotent projection from parsed log into analytics tables + event_logs */
export declare function processIndexedLog(log: ParsedLog): Promise<void>;
export declare function parseEthersLog(contract: ParsedLog["contract"], parsed: ethers.LogDescription, raw: ethers.Log): ParsedLog;
//# sourceMappingURL=event-processor.d.ts.map