import type { Queue } from "bullmq";
/**
 * Legacy MLM job queues — disabled. Matrix logic runs on-chain only.
 * Queues are kept as no-op stubs so imports do not break.
 */
export declare const placementQueue: Queue<any, any, string, any, any, string>;
export declare const rebirthQueue: Queue<any, any, string, any, any, string>;
export declare const autoUpgradeQueue: Queue<any, any, string, any, any, string>;
export declare const incomeQueue: Queue<any, any, string, any, any, string>;
export declare const withdrawQueue: Queue<any, any, string, any, any, string>;
export declare const notificationQueue: Queue<any, any, string, any, any, string>;
export declare const purchaseQueue: Queue<any, any, string, any, any, string>;
export interface PlacementJob {
    userId: string;
    sponsorId: string;
    packageLevel: number;
    matrixType: "CLUB" | "PILOT";
    idempotencyKey?: string;
}
export interface PurchaseJob {
    userId: string;
    sponsorId: string;
    packageLevel: number;
    matrixType: "CLUB" | "PILOT";
    txHash?: string;
    isManual?: boolean;
}
export interface WithdrawJob {
    withdrawalId: string;
    userId: string;
    amount: number;
    walletAddress: string;
}
export interface NotificationJob {
    userId: string;
    event: string;
    payload: Record<string, unknown>;
}
/** Legacy MLM workers disabled — backend is indexer + analytics only. */
export declare function startWorkers(): never[];
export declare const rewardQueue: Queue;
//# sourceMappingURL=index.d.ts.map