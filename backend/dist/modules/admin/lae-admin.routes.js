import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { config } from "../../config/index.js";
import { getLaeAdminDashboardStats, getLaeAnalyticsSummary, getLaeRewardsAnalytics, listLaeIncome, listLaePlacements, listLaeUsers, } from "./lae-analytics.service.js";
import { CONTRACTS } from "../../config/chains.js";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Aman@9616";
function signAdminToken(email) {
    return jwt.sign({ sub: email, role: "admin" }, config.jwt.secret, {
        expiresIn: "8h",
    });
}
function verifyAdmin(request) {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return null;
    try {
        const payload = jwt.verify(header.slice(7), config.jwt.secret);
        return payload.role === "admin" ? payload : null;
    }
    catch {
        return null;
    }
}
export async function adminRoutes(app) {
    app.post("/admin/login", async (request, reply) => {
        const body = request.body;
        if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
            return reply.status(401).send({ message: "Invalid credentials" });
        }
        const token = signAdminToken(body.email);
        return { token, email: body.email };
    });
    app.get("/admin/stats", async (request, reply) => {
        if (!verifyAdmin(request))
            return reply.status(401).send({ message: "Unauthorized" });
        const stats = await getLaeAdminDashboardStats();
        return stats;
    });
    app.get("/admin/users", async (request, reply) => {
        if (!verifyAdmin(request))
            return reply.status(401).send({ message: "Unauthorized" });
        const q = request.query;
        const limit = Math.min(Number(q.limit ?? 100), 500);
        const offset = Number(q.offset ?? 0);
        return listLaeUsers(limit, offset);
    });
    app.get("/admin/income", async (request, reply) => {
        if (!verifyAdmin(request))
            return reply.status(401).send({ message: "Unauthorized" });
        const q = request.query;
        const incomes = await listLaeIncome(Number(q.limit ?? 100), q.kind);
        return { incomes };
    });
    app.get("/admin/rewards", async (request, reply) => {
        if (!verifyAdmin(request))
            return reply.status(401).send({ message: "Unauthorized" });
        const q = request.query;
        return getLaeRewardsAnalytics(Number(q.limit ?? 100));
    });
    app.get("/admin/matrix", async (request, reply) => {
        if (!verifyAdmin(request))
            return reply.status(401).send({ message: "Unauthorized" });
        const q = request.query;
        const placements = await listLaePlacements(Number(q.limit ?? 100));
        return { placements };
    });
    app.get("/admin/analytics", async (request, reply) => {
        if (!verifyAdmin(request))
            return reply.status(401).send({ message: "Unauthorized" });
        return getLaeAnalyticsSummary();
    });
    app.get("/admin/staking", async (request, reply) => {
        if (!verifyAdmin(request))
            return reply.status(401).send({ message: "Unauthorized" });
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
        if (!verifyAdmin(request))
            return reply.status(401).send({ message: "Unauthorized" });
        const state = await prisma.indexerState.findUnique({ where: { id: "main" } });
        return {
            contracts: CONTRACTS,
            indexer: {
                lastBlock: state?.lastBlock?.toString() ?? "0",
                chainId: state?.chainId ?? null,
                lastBlockHash: state?.lastBlockHash ?? null,
            },
            adminEmail: ADMIN_EMAIL,
        };
    });
}
//# sourceMappingURL=lae-admin.routes.js.map