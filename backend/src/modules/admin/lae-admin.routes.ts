import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { config } from "../../config/index.js";
import {
  getLaeAdminDashboardStats,
  getLaeAnalyticsSummary,
  getLaeRewardsAnalytics,
  listLaeIncome,
  listLaePlacements,
  listLaeUsers,
} from "./lae-analytics.service.js";
import { CONTRACTS } from "../../config/chains.js";
import { replayFromBlock, getMatrixDeployBlock } from "../blockchain/sync-engine.js";
import { resetIndexedAnalytics } from "../blockchain/reset-indexed-data.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Aman@9616";

function signAdminToken(email: string) {
  return jwt.sign({ sub: email, role: "admin" }, config.jwt.secret, {
    expiresIn: "8h",
  });
}

function verifyAdmin(request: { headers: { authorization?: string } }) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), config.jwt.secret) as { role?: string };
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

export async function adminRoutes(app: FastifyInstance) {
  app.post("/admin/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      return reply.status(401).send({ message: "Invalid credentials" });
    }
    const token = signAdminToken(body.email!);
    return { token, email: body.email };
  });

  app.get("/admin/stats", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const stats = await getLaeAdminDashboardStats();
    return stats;
  });

  app.get("/admin/users", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const q = request.query as { limit?: string; offset?: string };
    const limit = Math.min(Number(q.limit ?? 100), 500);
    const offset = Number(q.offset ?? 0);
    return listLaeUsers(limit, offset);
  });

  app.get("/admin/income", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const q = request.query as { kind?: string; limit?: string };
    const incomes = await listLaeIncome(Number(q.limit ?? 100), q.kind);
    return { incomes };
  });

  app.get("/admin/rewards", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const q = request.query as { limit?: string };
    return getLaeRewardsAnalytics(Number(q.limit ?? 100));
  });

  app.get("/admin/matrix", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const q = request.query as { limit?: string };
    const placements = await listLaePlacements(Number(q.limit ?? 100));
    return { placements };
  });

  app.get("/admin/analytics", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    return getLaeAnalyticsSummary();
  });

  app.get("/admin/staking", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const [agg, active, recent] = await Promise.all([
      prisma.indexedStake.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.indexedStake.count({ where: { released: false } }),
      prisma.indexedStake.findMany({ take: 50, orderBy: { blockNumber: "desc" } }),
    ]);
    return {
      totalStaked: agg._sum.amount?.toString() ?? "0",
      stakeEvents: agg._count,
      activeStakes: active,
      recent,
    };
  });

  app.get("/admin/settings", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const state = await prisma.indexerState.findUnique({ where: { id: "main" } });
    const indexedUsers = await prisma.matrixCoreUser.count();
    return {
      contracts: CONTRACTS,
      indexer: {
        lastBlock: state?.lastBlock?.toString() ?? "0",
        chainId: state?.chainId ?? null,
        lastBlockHash: state?.lastBlockHash ?? null,
        matrixDeployBlock: getMatrixDeployBlock().toString(),
        indexedUsers,
      },
      adminEmail: ADMIN_EMAIL,
    };
  });

  /** Wipe indexed admin data and rewind indexer — use before fresh launch */
  app.post("/admin/indexer/reset", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const deleted = await resetIndexedAnalytics();
    const state = await prisma.indexerState.findUnique({ where: { id: "main" } });
    return {
      ok: true,
      deleted,
      lastBlock: state?.lastBlock?.toString() ?? "0",
      matrixDeployBlock: getMatrixDeployBlock().toString(),
    };
  });

  /** Re-scan blockchain from matrix deploy block — fixes empty admin when indexer lagged */
  app.post("/admin/indexer/sync", async (request, reply) => {
    if (!verifyAdmin(request)) return reply.status(401).send({ message: "Unauthorized" });
    const body = (request.body ?? {}) as { fromBlock?: string | number };
    const fromBlock = body.fromBlock != null ? BigInt(body.fromBlock) : getMatrixDeployBlock();
    const indexedUsers = await replayFromBlock(fromBlock);
    const state = await prisma.indexerState.findUnique({ where: { id: "main" } });
    return {
      ok: true,
      fromBlock: fromBlock.toString(),
      lastBlock: state?.lastBlock?.toString() ?? "0",
      indexedUsers,
      chainEvents: await prisma.chainEvent.count(),
      indexedIncome: await prisma.matrixCoreIncome.count(),
    };
  });
}
