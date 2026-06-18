import { Redis } from "ioredis";
import { config } from "../config/index.js";

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

export const bullmqConnection = parseRedisUrl(config.redisUrl);

let cacheClient: Redis | null = null;

function getCacheClient(): Redis {
  if (!cacheClient) {
    cacheClient = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
  }
  return cacheClient;
}

export const CACHE_KEYS = {
  dashboard: (userId: string) => `cache:dashboard:${userId}`,
  leaderboard: () => "cache:leaderboard:global",
  leaderboardUser: (userId: string) => `cache:leaderboard:user:${userId}`,
} as const;

export const CACHE_TTL = {
  dashboard: 60,
  leaderboard: 300,
} as const;

export async function getCached<T>(key: string): Promise<T | null> {
  const raw = await getCacheClient().get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await getCacheClient().setex(key, ttlSeconds, JSON.stringify(value));
}

export async function invalidateDashboardCache(userId: string): Promise<void> {
  await getCacheClient().del(CACHE_KEYS.dashboard(userId));
}

export async function invalidateLeaderboardCache(): Promise<void> {
  const redis = getCacheClient();
  const keys = await redis.keys("cache:leaderboard:*");
  if (keys.length > 0) await redis.del(...keys);
}

export async function invalidateUserCaches(userId: string): Promise<void> {
  await invalidateDashboardCache(userId);
  await getCacheClient().del(CACHE_KEYS.leaderboardUser(userId));
}
