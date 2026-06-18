export declare const bullmqConnection: {
    host: string;
    port: number;
    password: string | undefined;
    maxRetriesPerRequest: null;
};
export declare const CACHE_KEYS: {
    readonly dashboard: (userId: string) => string;
    readonly leaderboard: () => string;
    readonly leaderboardUser: (userId: string) => string;
};
export declare const CACHE_TTL: {
    readonly dashboard: 60;
    readonly leaderboard: 300;
};
export declare function getCached<T>(key: string): Promise<T | null>;
export declare function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void>;
export declare function invalidateDashboardCache(userId: string): Promise<void>;
export declare function invalidateLeaderboardCache(): Promise<void>;
export declare function invalidateUserCaches(userId: string): Promise<void>;
//# sourceMappingURL=cache.d.ts.map