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
//# sourceMappingURL=redis.js.map