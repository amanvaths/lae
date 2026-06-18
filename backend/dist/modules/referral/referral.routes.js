import { getDownlineRecursive, getUplineRecursive, buildNestedTree, computeLeaderboard, getTeamSize, } from "../../repositories/referral-tree.repository.js";
import { getCached, setCached, CACHE_KEYS, CACHE_TTL, } from "../../lib/cache.js";
import { prisma } from "../../lib/prisma.js";
import { userRepository, walletRepository, clubRepository, pilotRepository } from "../../repositories/index.js";
import { paginationSchema } from "../../validators/schemas.js";
export async function referralRoutes(app) {
    app.get("/tree", {
        preHandler: [app.authenticate],
        schema: { tags: ["Referral"] },
    }, async (request) => {
        const depth = Number(request.query.depth ?? 5);
        const flat = await getDownlineRecursive(request.userId, depth);
        return buildNestedTree(flat, request.userId);
    });
    app.get("/tree/recursive", {
        preHandler: [app.authenticate],
        schema: { tags: ["Referral"], description: "PostgreSQL recursive CTE downline query" },
    }, async (request) => {
        const depth = Number(request.query.depth ?? 10);
        return getDownlineRecursive(request.userId, depth);
    });
    app.get("/direct", {
        preHandler: [app.authenticate],
        schema: { tags: ["Referral"] },
    }, async (request) => {
        const { page, limit } = paginationSchema.parse(request.query);
        const skip = (page - 1) * limit;
        const [referrals, total] = await Promise.all([
            userRepository.getDirectReferrals(request.userId, skip, limit),
            userRepository.countDirectReferrals(request.userId),
        ]);
        return { referrals, total, page, limit };
    });
    app.get("/sponsor-chain", {
        preHandler: [app.authenticate],
        schema: { tags: ["Referral"], description: "PostgreSQL recursive CTE upline query" },
    }, async (request) => {
        return getUplineRecursive(request.userId);
    });
    app.get("/team-size", {
        preHandler: [app.authenticate],
        schema: { tags: ["Referral"] },
    }, async (request) => {
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: request.userId },
            select: { treePath: true },
        });
        const size = await getTeamSize(request.userId, user.treePath);
        return { teamSize: size };
    });
}
export async function walletRoutes(app) {
    app.get("/balance", {
        preHandler: [app.authenticate],
        schema: { tags: ["Wallet"] },
    }, async (request) => {
        const wallet = await walletRepository.findByUserId(request.userId);
        return wallet ?? {
            availableBalance: 0,
            lockedBalance: 0,
            withdrawableBalance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
            tokenBalance: 0,
        };
    });
    app.get("/ledger", {
        preHandler: [app.authenticate],
        schema: { tags: ["Wallet"], description: "Append-only immutable financial ledger" },
    }, async (request) => {
        const { page, limit } = paginationSchema.parse(request.query);
        const skip = (page - 1) * limit;
        const entries = await walletRepository.getLedger(request.userId, skip, limit);
        return { entries, page, limit, immutable: true };
    });
}
export async function clubRoutes(app) {
    app.get("/matrices", {
        preHandler: [app.authenticate],
        schema: { tags: ["Club Matrix"] },
    }, async (request) => {
        return clubRepository.getUserMatrices(request.userId);
    });
    app.get("/packages", {
        preHandler: [app.authenticate],
        schema: { tags: ["Club Matrix"] },
    }, async (request) => {
        return clubRepository.getUserPackages(request.userId);
    });
    app.get("/matrix/:id", {
        preHandler: [app.authenticate],
        schema: { tags: ["Club Matrix"] },
    }, async (request) => {
        const { id } = request.params;
        return clubRepository.getMatrixById(id);
    });
}
export async function pilotRoutes(app) {
    app.get("/matrices", {
        preHandler: [app.authenticate],
        schema: { tags: ["Pilot Matrix"] },
    }, async (request) => {
        return pilotRepository.getUserMatrices(request.userId);
    });
    app.get("/packages", {
        preHandler: [app.authenticate],
        schema: { tags: ["Pilot Matrix"] },
    }, async (request) => {
        return pilotRepository.getUserPackages(request.userId);
    });
}
export async function cacheRoutes(app) {
    app.get("/dashboard", {
        preHandler: [app.authenticate],
        schema: { tags: ["Cache"], description: "Redis-cached dashboard summary" },
    }, async (request) => {
        const userId = request.userId;
        const cacheKey = CACHE_KEYS.dashboard(userId);
        const cached = await getCached(cacheKey);
        if (cached)
            return { ...cached, cached: true };
        const [wallet, clubPackages, pilotPackages, directCount] = await Promise.all([
            walletRepository.findByUserId(userId),
            clubRepository.getUserPackages(userId),
            pilotRepository.getUserPackages(userId),
            userRepository.countDirectReferrals(userId),
        ]);
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { treePath: true },
        });
        const teamSize = await getTeamSize(userId, user.treePath);
        const dashboard = {
            wallet,
            clubPackages,
            pilotPackages,
            directCount,
            teamSize,
            cached: false,
        };
        await setCached(cacheKey, dashboard, CACHE_TTL.dashboard);
        return dashboard;
    });
    app.get("/leaderboard", {
        schema: { tags: ["Cache"], description: "Redis-cached global leaderboard" },
    }, async (request) => {
        const limit = Number(request.query.limit ?? 100);
        const cacheKey = CACHE_KEYS.leaderboard();
        const cached = await getCached(cacheKey);
        if (cached)
            return cached;
        const entries = await computeLeaderboard(limit);
        const result = { entries, cached: false };
        await setCached(cacheKey, result, CACHE_TTL.leaderboard);
        return result;
    });
}
//# sourceMappingURL=referral.routes.js.map