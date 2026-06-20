export declare function getDashboard(wallet: string): Promise<{
    wallet: string;
    registered: boolean;
    sponsor: string | null;
    registeredAt: Date | null;
    totalIncome: string;
    totalTokenRewards: string;
    totalWithdrawals: string;
    directReferrals: number;
    clubEvents: number;
    pilotEvents: number;
}>;
export declare function getWalletAnalytics(wallet: string): Promise<{
    wallet: string;
    incomes: {
        level: number;
        id: string;
        createdAt: Date;
        txHash: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        matrixType: number;
        blockNumber: bigint;
        recipientAddress: string;
        incomeType: number;
        logIndex: number;
        payerAddress: string | null;
    }[];
    withdrawals: {
        id: string;
        walletAddress: string;
        createdAt: Date;
        txHash: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        blockNumber: bigint;
        logIndex: number;
        withdrawRef: string;
    }[];
    tokenRewards: {
        level: number;
        id: string;
        createdAt: Date;
        txHash: string;
        matrixType: number;
        rewardType: number;
        blockNumber: bigint;
        recipientAddress: string;
        sltAmount: import("@prisma/client/runtime/library").Decimal;
        logIndex: number;
        sourceAddress: string | null;
    }[];
}>;
export declare function getReferrals(wallet: string): Promise<{
    id: string;
    createdAt: Date;
    txHash: string;
    blockNumber: bigint;
    sponsorAddress: string;
    logIndex: number;
    referralAddress: string;
}[]>;
export declare function getTeamStats(wallet: string): Promise<{
    wallet: string;
    directCount: number;
    registeredDirect: number;
    registeredLaeDirect: number;
    direct: {
        id: string;
        createdAt: Date;
        txHash: string;
        blockNumber: bigint;
        sponsorAddress: string;
        logIndex: number;
        referralAddress: string;
    }[];
}>;
export declare function getMatrices(wallet: string): Promise<{
    club: {
        level: number;
        id: string;
        createdAt: Date;
        txHash: string;
        matrixId: bigint;
        blockNumber: bigint;
        payload: import("@prisma/client/runtime/library").JsonValue;
        ownerAddress: string;
        logIndex: number;
        eventName: string;
    }[];
    pilot: {
        level: number;
        id: string;
        createdAt: Date;
        txHash: string;
        matrixId: bigint;
        blockNumber: bigint;
        payload: import("@prisma/client/runtime/library").JsonValue;
        ownerAddress: string;
        logIndex: number;
        eventName: string;
    }[];
}>;
export declare function getIncomeHistory(wallet: string, limit?: number): Promise<{
    level: number;
    id: string;
    createdAt: Date;
    txHash: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    matrixType: number;
    blockNumber: bigint;
    recipientAddress: string;
    incomeType: number;
    logIndex: number;
    payerAddress: string | null;
}[]>;
export declare function getRewardHistory(wallet: string, limit?: number): Promise<{
    level: number;
    id: string;
    createdAt: Date;
    txHash: string;
    matrixType: number;
    rewardType: number;
    blockNumber: bigint;
    recipientAddress: string;
    sltAmount: import("@prisma/client/runtime/library").Decimal;
    logIndex: number;
    sourceAddress: string | null;
}[]>;
export declare function getTransactions(wallet: string, limit?: number): Promise<{
    id: string;
    walletAddress: string;
    createdAt: Date;
    txHash: string;
    blockNumber: bigint;
    payload: import("@prisma/client/runtime/library").JsonValue;
    logIndex: number;
    eventName: string;
}[]>;
export declare function getSpins(wallet: string, limit?: number): Promise<{
    id: string;
    walletAddress: string;
    createdAt: Date;
    txHash: string;
    blockNumber: bigint;
    sltAmount: import("@prisma/client/runtime/library").Decimal;
    logIndex: number;
    tier: number;
    nonce: bigint;
}[]>;
export declare function getStakes(wallet: string): Promise<{
    id: string;
    walletAddress: string;
    createdAt: Date;
    txHash: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    lockEnd: bigint;
    blockNumber: bigint;
    logIndex: number;
    eventName: string;
    stakeIndex: bigint;
    released: boolean;
}[]>;
export declare function getLeaderboard(limit?: number): Promise<{
    rank: number;
    wallet: string;
    totalIncome: string;
}[]>;
export declare function getIndexerStatus(): Promise<{
    state: {
        id: string;
        chainId: number;
        lastBlock: string;
        lastBlockHash: string | null;
        updatedAt: string;
    } | null;
    eventCount: number;
    mode: string;
}>;
//# sourceMappingURL=analytics.service.d.ts.map