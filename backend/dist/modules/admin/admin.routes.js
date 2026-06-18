import { prisma } from "../../lib/prisma.js";
import { spinSchema, womSubmitSchema, stakeSchema, womReviewSchema } from "../../validators/schemas.js";
import { executeSpin } from "../../engines/spin.engine.js";
import { createStake } from "../../engines/staking.engine.js";
import { creditWallet, creditTokens } from "../../engines/income.engine.js";
import { AppError } from "../../utils/helpers.js";
export async function spinRoutes(app) {
    app.get("/coupons", {
        preHandler: [app.authenticate],
        schema: { tags: ["Spin & Win"] },
    }, async (request) => {
        return prisma.spinCoupon.findMany({
            where: { userId: request.userId, used: false },
            orderBy: { createdAt: "desc" },
        });
    });
    app.post("/spin", {
        preHandler: [app.authenticate],
        schema: { tags: ["Spin & Win"] },
    }, async (request) => {
        const body = spinSchema.parse(request.body);
        const result = await prisma.$transaction(async (tx) => {
            return executeSpin(tx, request.userId, body.couponId);
        });
        return result;
    });
    app.get("/history", {
        preHandler: [app.authenticate],
        schema: { tags: ["Spin & Win"] },
    }, async (request) => {
        return prisma.spinHistory.findMany({
            where: { userId: request.userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
    });
}
export async function womRoutes(app) {
    app.post("/submit", {
        preHandler: [app.authenticate],
        schema: { tags: ["Word of Mouth"] },
    }, async (request, reply) => {
        const body = womSubmitSchema.parse(request.body);
        const existing = await prisma.womSubmission.findFirst({
            where: {
                userId: request.userId,
                createdAt: { gte: new Date(new Date().setDate(1)) },
            },
        });
        if (existing) {
            throw new AppError(409, "Already submitted this month", "WOM_LIMIT");
        }
        const submission = await prisma.womSubmission.create({
            data: {
                userId: request.userId,
                socialLink: body.socialLink,
                contentLink: body.contentLink,
                screenshot: body.screenshot,
            },
        });
        return reply.status(201).send(submission);
    });
    app.get("/submissions", {
        preHandler: [app.authenticate],
        schema: { tags: ["Word of Mouth"] },
    }, async (request) => {
        return prisma.womSubmission.findMany({
            where: { userId: request.userId },
            include: { rewards: true },
            orderBy: { createdAt: "desc" },
        });
    });
}
export async function stakingRoutes(app) {
    app.post("/stake", {
        preHandler: [app.authenticate],
        schema: { tags: ["StackMint"] },
    }, async (request, reply) => {
        const body = stakeSchema.parse(request.body);
        const stakeId = await prisma.$transaction(async (tx) => {
            return createStake(tx, request.userId, body.amount, body.round);
        });
        return reply.status(201).send({ stakeId });
    });
    app.get("/stakes", {
        preHandler: [app.authenticate],
        schema: { tags: ["StackMint"] },
    }, async (request) => {
        return prisma.stake.findMany({
            where: { userId: request.userId },
            orderBy: { createdAt: "desc" },
        });
    });
}
export async function adminRoutes(app) {
    app.get("/dashboard", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async () => {
        const [users, deposits, withdrawals, clubMatrices, pilotMatrices] = await Promise.all([
            prisma.user.count(),
            prisma.blockchainTransaction.count({ where: { type: "DEPOSIT", status: "CONFIRMED" } }),
            prisma.withdrawalRequest.count({ where: { status: "CONFIRMED" } }),
            prisma.clubMatrix.count(),
            prisma.pilotMatrix.count(),
        ]);
        return { users, deposits, withdrawals, clubMatrices, pilotMatrices };
    });
    app.get("/users", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async (request) => {
        const page = Number(request.query.page ?? 1);
        const limit = 20;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { wallet: true },
            }),
            prisma.user.count(),
        ]);
        return { users, total, page, limit };
    });
    app.get("/income-report", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async () => {
        const byType = await prisma.incomeLedger.groupBy({
            by: ["type"],
            _sum: { amount: true, tokenAmount: true },
            _count: true,
        });
        return { byType };
    });
    app.get("/incentive-report", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"], description: "Pilot 1 DAI incentive ledger report" },
    }, async (request) => {
        const page = Number(request.query.page ?? 1);
        const limit = 50;
        const [entries, total] = await Promise.all([
            prisma.incomeLedger.findMany({
                where: { type: "PILOT_INCENTIVE" },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { user: { select: { walletAddress: true } } },
            }),
            prisma.incomeLedger.count({ where: { type: "PILOT_INCENTIVE" } }),
        ]);
        return { entries, total, page, limit };
    });
    app.get("/config", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async () => {
        const { getSponsorPaymentConfig, getTokenRewardConfig, getPilotIncentiveConfig } = await import("../../services/admin-config.service.js");
        const [sponsorPayment, tokenReward, pilotIncentive] = await Promise.all([
            getSponsorPaymentConfig(),
            getTokenRewardConfig(),
            getPilotIncentiveConfig(),
        ]);
        return { sponsorPayment, tokenReward, pilotIncentive };
    });
    app.patch("/config/sponsor-payment", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async (request) => {
        const body = request.body;
        const { setAdminConfig } = await import("../../services/admin-config.service.js");
        return setAdminConfig("sponsor_payment", body);
    });
    app.patch("/config/token-reward", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async (request) => {
        const body = request.body;
        const { setAdminConfig, getTokenRewardConfig } = await import("../../services/admin-config.service.js");
        const current = await getTokenRewardConfig();
        return setAdminConfig("token_reward", { ...current, ...body });
    });
    app.patch("/config/pilot-incentive", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async (request) => {
        const body = request.body;
        const { setAdminConfig } = await import("../../services/admin-config.service.js");
        return setAdminConfig("pilot_incentive", body);
    });
    app.get("/sponsor-payments", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async (request) => {
        const page = Number(request.query.page ?? 1);
        const limit = 50;
        const [entries, total] = await Promise.all([
            prisma.incomeLedger.findMany({
                where: { type: "SPONSOR_PAYMENT" },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.incomeLedger.count({ where: { type: "SPONSOR_PAYMENT" } }),
        ]);
        return { entries, total, page, limit };
    });
    app.get("/wom/pending", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async () => {
        return prisma.womSubmission.findMany({
            where: { status: "PENDING" },
            include: { user: { select: { id: true, walletAddress: true } } },
            orderBy: { createdAt: "asc" },
        });
    });
    app.patch("/wom/:id/review", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async (request) => {
        const { id } = request.params;
        const body = womReviewSchema.parse(request.body);
        return prisma.$transaction(async (tx) => {
            const submission = await tx.womSubmission.update({
                where: { id },
                data: {
                    status: body.status,
                    reviewedBy: request.userId,
                    reviewedAt: new Date(),
                },
            });
            if (body.status === "APPROVED" && (body.daiAmount || body.tokenAmount)) {
                if (body.daiAmount) {
                    await creditWallet(tx, {
                        userId: submission.userId,
                        amount: body.daiAmount,
                        type: "WOM_REWARD",
                        idempotencyKey: `wom-reward-dai-${id}`,
                    });
                }
                if (body.tokenAmount) {
                    await creditTokens(tx, submission.userId, body.tokenAmount);
                }
                await tx.womReward.create({
                    data: {
                        submissionId: id,
                        daiAmount: body.daiAmount ?? 0,
                        tokenAmount: body.tokenAmount ?? 0,
                    },
                });
            }
            return submission;
        });
    });
    app.get("/deposits", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async () => {
        return prisma.blockchainTransaction.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { user: { select: { walletAddress: true } } },
        });
    });
    app.get("/withdrawals", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async () => {
        return prisma.withdrawalRequest.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { user: { select: { walletAddress: true } } },
        });
    });
    app.patch("/users/:id/status", {
        preHandler: [app.requireAdmin],
        schema: { tags: ["Admin"] },
    }, async (request) => {
        const { id } = request.params;
        const { status } = request.body;
        return prisma.user.update({ where: { id }, data: { status } });
    });
}
//# sourceMappingURL=admin.routes.js.map