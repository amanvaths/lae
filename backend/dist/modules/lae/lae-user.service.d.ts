export type LaeUserEventRow = {
    transactionHash: string;
    logIndex: number;
    eventName: string;
    args: Record<string, unknown>;
    blockNumber: string;
};
/** Fast indexed user events — avoids slow eth_getLogs on the frontend. */
export declare function getLaeUserEvents(wallet: string, limit?: number): Promise<LaeUserEventRow[]>;
export declare function getLaeUserIncome(wallet: string, kind?: "matrix" | "royal", limit?: number): Promise<{
    level: number;
    id: string;
    createdAt: Date;
    txHash: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    blockNumber: bigint;
    logIndex: number;
    receiverUserId: number;
    receiverAddress: string | null;
    fromUserId: number | null;
    incomeKind: string;
}[]>;
//# sourceMappingURL=lae-user.service.d.ts.map