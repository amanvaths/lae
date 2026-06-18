import { getDashboard, getWalletAnalytics, getReferrals, getTeamStats, getMatrices, getIncomeHistory, getRewardHistory, getTransactions, getSpins, getStakes, getLeaderboard, getIndexerStatus, } from "./analytics.service.js";
import { replayFromBlock } from "../blockchain/sync-engine.js";
import { requireIndexerAdmin } from "../../middleware/indexer-admin.js";
function walletFromQuery(query) {
    const w = query.wallet ?? query.address;
    if (typeof w === "string" && w.startsWith("0x") && w.length === 42) {
        return w.toLowerCase();
    }
    return null;
}
/** Read-only analytics APIs — data from indexed blockchain events only */
export async function analyticsRoutes(app) {
    app.get("/dashboard", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required (0x…)" });
        return getDashboard(wallet);
    });
    app.get("/wallet", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        return getWalletAnalytics(wallet);
    });
    app.get("/referrals", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        return getReferrals(wallet);
    });
    app.get("/team", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        return getTeamStats(wallet);
    });
    app.get("/matrices", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        return getMatrices(wallet);
    });
    app.get("/income", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        const limit = Number(request.query.limit ?? 100);
        return getIncomeHistory(wallet, limit);
    });
    app.get("/rewards", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        return getRewardHistory(wallet);
    });
    app.get("/transactions", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        return getTransactions(wallet);
    });
    app.get("/spins", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        return getSpins(wallet);
    });
    app.get("/stakes", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required" });
        return getStakes(wallet);
    });
    app.get("/leaderboard", async (request) => {
        const limit = Number(request.query.limit ?? 50);
        return getLeaderboard(limit);
    });
    app.get("/indexer/status", async () => getIndexerStatus());
    app.post("/indexer/replay", { preHandler: requireIndexerAdmin }, async (request) => {
        const body = request.body;
        const from = BigInt(body?.fromBlock ?? 0);
        await replayFromBlock(from);
        return { ok: true, fromBlock: from.toString() };
    });
}
//# sourceMappingURL=analytics.routes.js.map