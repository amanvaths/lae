export declare function getLaeAdminDashboardStats(): Promise<{
    totalUsers: number;
    todayRegistrations: number;
    levelSales: {
        level: number;
        count: number;
        volume: string;
    }[];
    royalPool: {
        totalPaid: string;
        eventCount: number;
    };
    matrixIncome: {
        totalPaid: string;
        eventCount: number;
    };
    placements: number;
    reinvests: number;
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
        totalIncome: string;
        walletAddress: string;
        sponsorId: number | null;
        createdAt: Date;
        userId: number;
        registeredAt: Date;
        teamSize: number;
    }[];
    total: number;
}>;
export declare function listLaeIncome(limit?: number, kind?: string): Promise<{
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
export declare function listLaePlacements(limit?: number): Promise<{
    level: number;
    id: string;
    createdAt: Date;
    userId: number;
    txHash: string;
    blockNumber: bigint;
    logIndex: number;
    referrerId: number;
    cycle: number;
    spot: number;
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
        totalIncome: string;
        teamSize: number;
    }[];
}>;
//# sourceMappingURL=lae-analytics.service.d.ts.map