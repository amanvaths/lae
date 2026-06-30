import { Decimal } from "@prisma/client/runtime/library";
type IncomeOutRow = {
    id: string;
    kind: string;
    fromUserId: number | null;
    toUserId: number | null;
    matrixOwnerId: number | null;
    boardLevel: number | null;
    level: number | null;
    cycleId: number | null;
    position: number | null;
    amount: Decimal;
    blockNumber: bigint;
    txHash: string;
    logIndex: number;
    createdAt: Date;
};
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
        amount: Decimal;
        blockNumber: bigint;
        position: number | null;
        logIndex: number;
        matrixOwnerId: number | null;
        cycleId: number | null;
        fromUserId: number | null;
        kind: string;
        toUserId: number | null;
        boardLevel: number | null;
    }[];
} | null>;
export declare function getLaeUserIncome(wallet: string, kind?: "matrix" | "treasury" | "lapse", limit?: number): Promise<IncomeOutRow[] | {
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
export {};
//# sourceMappingURL=lae-user.service.d.ts.map