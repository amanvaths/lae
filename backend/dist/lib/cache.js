import { Redis } from "ioredis";
import { config } from "../config/index.js";
function parseRedisUrl(url) {
    const parsed = new URL(url);
    return {
        host: parsed.hostname || "localhost",
        port: parseInt(parsed.port || "6379", 10),
        password: parsed.password || undefined,
        maxRetriesPerRequest: null,
    };
}
export const bullmqConnection = parseRedisUrl(config.redisUrl);
let cacheClient = null;
function getCacheClient() {
    if (!cacheClient) {
        cacheClient = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
    }
    return cacheClient;
}
export const CACHE_KEYS = {
    dashboard: (userId) => `cache:dashboard:${userId}`,
    leaderboard: () => "cache:leaderboard:global",
    leaderboardUser: (userId) => `cache:leaderboard:user:${userId}`,
};
export const CACHE_TTL = {
    dashboard: 60,
    leaderboard: 300,
};
export async function getCached(key) {
    const raw = await getCacheClient().get(key);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function setCached(key, value, ttlSeconds) {
    await getCacheClient().setex(key, ttlSeconds, JSON.stringify(value));
}
export async function invalidateDashboardCache(userId) {
    await getCacheClient().del(CACHE_KEYS.dashboard(userId));
}
export async function invalidateLeaderboardCache() {
    const redis = getCacheClient();
    const keys = await redis.keys("cache:leaderboard:*");
    if (keys.length > 0)
        await redis.del(...keys);
}
export async function invalidateUserCaches(userId) {
    await invalidateDashboardCache(userId);
    await getCacheClient().del(CACHE_KEYS.leaderboardUser(userId));
}
//# sourceMappingURL=cache.js.map