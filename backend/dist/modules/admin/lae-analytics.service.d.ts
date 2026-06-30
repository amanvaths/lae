export declare function getLaeAdminDashboardStats(): Promise<{
    totalUsers: number;
    todayRegistrations: number;
    positionSales: {
        position: number | null;
        count: number;
        volume: string;
    }[];
    treasuryPool: {
        totalPaid: string;
        eventCount: number;
    };
    matrixIncome: {
        totalPaid: string;
        eventCount: number;
    };
    positions: number;
    recycles: number;
    staking: {
        totalStaked: string;
        stakeEvents: number;
        activeStakes: number;
    };
    indexer: {
        lastBlock: string;
        chainId: number | null;
    };
    chainEvents: number;
}>;
export declare function listLaeUsers(limit?: number, offset?: number): Promise<{
    users: {
        registeredBlock: string;
        totalEarned: string;
        walletAddress: string;
        sponsorId: number | null;
        createdAt: Date;
        userId: number;
        directReferrals: number;
        registeredAt: Date;
        currentCycle: number;
        highestSlot: number;
        totalCycles: number;
    }[];
    total: number;
}>;
export declare function listLaeIncome(limit?: number, kind?: string): Promise<{
    level: number | null;
    id: string;
    createdAt: Date;
    txHash: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    blockNumber: bigint;
    position: number | null;
    logIndex: number;
    matrixOwnerId: number | null;
    cycleId: number | null;
    fromUserId: number | null;
    kind: string;
    toUserId: number | null;
    boardLevel: number | null;
}[]>;
export declare function listLaePlacements(limit?: number): Promise<{
    level: number;
    id: string;
    createdAt: Date;
    txHash: string;
    blockNumber: bigint;
    position: number;
    logIndex: number;
    matrixOwnerId: number;
    cycleId: number;
    occupantId: number;
}[]>;
export declare function getLaeRewardsAnalytics(limit?: number): Promise<{
    allocatedCount: number;
    claimedCount: number;
    recentAllocated: {
        txHash: string;
        blockNumber: string;
        walletAddress: string | null;
        payload: import("@prisma/client/runtime/library").JsonValue;
    }[];
    recentClaimed: {
        txHash: string;
        blockNumber: string;
        walletAddress: string | null;
        payload: import("@prisma/client/runtime/library").JsonValue;
    }[];
    sampleAllocatedTotal: string;
    sampleClaimedTotal: string;
}>;
export declare function getLaeAnalyticsSummary(): Promise<{
    registrationsByDay: {
        day: Date;
        count: number;
    }[];
    incomeByKind: {
        kind: string;
        total: string;
        count: number;
    }[];
    topEarners: {
        userId: number;
        walletAddress: string;
        totalEarned: string;
        directReferrals: number;
    }[];
}>;
//# sourceMappingURL=lae-analytics.service.d.ts.map