export declare function getLaeUserByWallet(wallet: string): Promise<{
    userId: number;
    wallet: string;
    sponsorId: number | null;
    currentCycle: number;
    directReferrals: number;
    totalEarned: string;
    totalCycles: number;
    placements: {
        matrixOwnerId: number;
        level: number;
        cycleId: number;
        position: number;
    }[];
    income: {
        level: number | null;
        id: string;
        createdAt: Date;
        txHash: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        blockNumber: bigint;
        position: number | null;
        logIndex: number;
        matrixOwnerId: number | null;
        kind: string;
        fromUserId: number | null;
        toUserId: number | null;
    }[];
} | null>;
export declare function getLaeUserIncome(wallet: string, kind?: "matrix" | "treasury" | "lapse", limit?: number): Promise<{
    level: number | null;
    id: string;
    createdAt: Date;
    txHash: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    blockNumber: bigint;
    position: number | null;
    logIndex: number;
    matrixOwnerId: number | null;
    kind: string;
    fromUserId: number | null;
    toUserId: number | null;
}[] | {
    kind: string;
    fromUserId: number | null;
    toUserId: number;
    level: number | null;
    amount: string;
    blockNumber: bigint | null;
    txHash: string;
    logIndex: number;
}[]>;
export declare function getLaeUserEvents(wallet: string, limit?: number): Promise<{
    id: string;
    walletAddress: string | null;
    createdAt: Date;
    txHash: string;
    blockNumber: bigint | null;
    payload: import("@prisma/client/runtime/library").JsonValue;
    logIndex: number;
    eventName: string;
}[]>;
//# sourceMappingURL=lae-user.service.d.ts.map