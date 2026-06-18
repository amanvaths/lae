import { Queue, Worker } from "bullmq";
/** All background job queues backed by Redis + BullMQ */
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
export declare function startWorkers(): Worker[];
export declare const rewardQueue: Queue<any, any, string, any, any, string>;
//# sourceMappingURL=index.d.ts.map