import type { FastifyInstance } from "fastify";
import {
  getDashboard,
  getWalletAnalytics,
  getReferrals,
  getTeamStats,
  getMatrices,
  getIncomeHistory,
  getRewardHistory,
  getTransactions,
  getSpins,
  getStakes,
  getLeaderboard,
  getIndexerStatus,
} from "./analytics.service.js";
import { replayFromBlock, getMatrixDeployBlock } from "../blockchain/sync-engine.js";
import { getMatrixTree, getMatrixOverview } from "../blockchain/matrix-tree.service.js";
import { requireIndexerAdmin } from "../../middleware/indexer-admin.js";

function walletFromQuery(query: Record<string, unknown>): string | null {
  const w = query.wallet ?? query.address;
  if (typeof w === "string" && w.startsWith("0x") && w.length === 42) {
    return w.toLowerCase();
  }
  return null;
}

/** Read-only analytics APIs — data from indexed blockchain events only */
export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/dashboard", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required (0x…)" });
    return getDashboard(wallet);
  });

  app.get("/wallet", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    return getWalletAnalytics(wallet);
  });

  app.get("/referrals", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    return getReferrals(wallet);
  });

  app.get("/team", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    return getTeamStats(wallet);
  });

  app.get("/matrices", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    return getMatrices(wallet);
  });

  app.get("/income", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    const limit = Number((request.query as { limit?: string }).limit ?? 100);
    return getIncomeHistory(wallet, limit);
  });

  app.get("/rewards", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    return getRewardHistory(wallet);
  });

  app.get("/transactions", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    return getTransactions(wallet);
  });

  app.get("/spins", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    return getSpins(wallet);
  });

  app.get("/stakes", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required" });
    return getStakes(wallet);
  });

  app.get("/leaderboard", async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? 50);
    return getLeaderboard(limit);
  });

  /** Authoritative 14-position matrix tree — LAEClubMatrix usersXMatrixReferrals via backend. */
  app.get("/matrix/tree/:userId/:level/:cycle", async (request, reply) => {
    const params = request.params as { userId?: string; level?: string; cycle?: string };
    const userId = Number(params.userId);
    const level = Number(params.level);
    const cycle = Number(params.cycle);
    const tree = await getMatrixTree(userId, level, cycle);
    if ("error" in tree) return reply.code(400).send(tree);
    return tree;
  });

  /** Backward compat — level 1 */
  app.get("/matrix/tree/:userId/:cycle", async (request, reply) => {
    const params = request.params as { userId?: string; cycle?: string };
    const userId = Number(params.userId);
    const cycle = Number(params.cycle);
    const tree = await getMatrixTree(userId, 1, cycle);
    if ("error" in tree) return reply.code(400).send(tree);
    return tree;
  });

  /** Level/cycle overview for matrix owner. Optional ?level=N */
  app.get("/matrix/overview/:userId", async (request, reply) => {
    const params = request.params as { userId?: string };
    const query = request.query as { level?: string };
    const userId = Number(params.userId);
    const level = query.level != null ? Number(query.level) : undefined;
    const overview = await getMatrixOverview(userId, level);
    if ("error" in overview) return reply.code(400).send(overview);
    return overview;
  });

  /** Where a user is placed in the global matrix. */
  app.get("/matrix/placement/:userId", async (request, reply) => {
    const userId = Number((request.params as { userId?: string }).userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return reply.code(400).send({ error: "invalid userId" });
    }
    const { getUserPlacement } = await import("../blockchain/matrix-tree.service.js");
    const row = await getUserPlacement(userId);
    return row ?? null;
  });

  app.get("/indexer/status", async () => getIndexerStatus());

  app.post("/indexer/replay", { preHandler: requireIndexerAdmin }, async (request) => {
    const body = request.body as { fromBlock?: string | number };
    const from = BigInt(body?.fromBlock ?? getMatrixDeployBlock());
    const indexedUsers = await replayFromBlock(from);
    return { ok: true, fromBlock: from.toString(), indexedUsers };
  });
}
