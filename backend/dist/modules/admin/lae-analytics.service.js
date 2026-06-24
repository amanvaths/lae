import { prisma } from "../../lib/prisma.js";
import { serializeForJson } from "../../lib/serialize.js";
function todayStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
export async function getLaeAdminDashboardStats() {
    const start = todayStart();
    const [totalUsers, todayRegistrations, matrixIncomeAgg, treasuryIncomeAgg, positions, recycles, indexerState, stakeAgg, activeStakes, chainEvents,] = await Promise.all([
        prisma.matrixCoreUser.count(),
        prisma.matrixCoreUser.count({ where: { registeredAt: { gte: start } } }),
        prisma.matrixCoreIncome.aggregate({
            where: { kind: "matrix" },
            _sum: { amount: true },
            _count: true,
        }),
        prisma.matrixCoreIncome.aggregate({
            where: { kind: "treasury" },
            _sum: { amount: true },
            _count: true,
        }),
        prisma.matrixCorePosition.count(),
        prisma.matrixCoreRecycle.count(),
        prisma.indexerState.findUnique({ where: { id: "main" } }),
        prisma.indexedStake.aggregate({ _sum: { amount: true }, _count: true }),
        prisma.indexedStake.count({ where: { released: false } }),
        prisma.chainEvent.count(),
    ]);
    const positionSales = await prisma.matrixCoreIncome.groupBy({
        by: ["position"],
        where: { kind: "matrix" },
        _count: true,
        _sum: { amount: true },
    });
    return {
        totalUsers,
        todayRegistrations,
        positionSales: positionSales.map((r) => ({
            position: r.position,
            count: r._count,
            volume: r._sum.amount?.toString() ?? "0",
        })),
        treasuryPool: {
            totalPaid: treasuryIncomeAgg._sum.amount?.toString() ?? "0",
            eventCount: treasuryIncomeAgg._count,
        },
        matrixIncome: {
            totalPaid: matrixIncomeAgg._sum.amount?.toString() ?? "0",
            eventCount: matrixIncomeAgg._count,
        },
        positions,
        recycles,
        staking: {
            totalStaked: stakeAgg._sum.amount?.toString() ?? "0",
            stakeEvents: stakeAgg._count,
            activeStakes,
        },
        indexer: {
            lastBlock: indexerState?.lastBlock?.toString() ?? "0",
            chainId: indexerState?.chainId ?? null,
        },
        chainEvents,
    };
}
export async function listLaeUsers(limit = 100, offset = 0) {
    const [users, total] = await Promise.all([
        prisma.matrixCoreUser.findMany({
            take: limit,
            skip: offset,
            orderBy: { userId: "desc" },
        }),
        prisma.matrixCoreUser.count(),
    ]);
    return {
        users: users.map((u) => ({
            ...u,
            registeredBlock: u.registeredBlock.toString(),
            totalEarned: u.totalEarned.toString(),
        })),
        total,
    };
}
export async function listLaeIncome(limit = 100, kind) {
    const rows = await prisma.matrixCoreIncome.findMany({
        take: limit,
        where: kind ? { kind } : undefined,
        orderBy: { blockNumber: "desc" },
    });
    return serializeForJson(rows);
}
export async function listLaePlacements(limit = 100) {
    const rows = await prisma.matrixCorePosition.findMany({
        take: limit,
        orderBy: { blockNumber: "desc" },
    });
    return serializeForJson(rows);
}
export async function getLaeRewardsAnalytics(limit = 100) {
    const [allocated, claimed, allocatedAgg, claimedAgg] = await Promise.all([
        prisma.chainEvent.findMany({
            where: { eventName: "LaeRewardAllocated" },
            orderBy: { blockNumber: "desc" },
            take: limit,
        }),
        prisma.chainEvent.findMany({
            where: { eventName: "LaeRewardClaimed" },
            orderBy: { blockNumber: "desc" },
            take: limit,
        }),
        prisma.chainEvent.aggregate({
            where: { eventName: "LaeRewardAllocated" },
            _count: true,
        }),
        prisma.chainEvent.aggregate({
            where: { eventName: "LaeRewardClaimed" },
            _count: true,
        }),
    ]);
    function sumLaeAmount(events, field) {
        let total = 0n;
        for (const e of events) {
            const payload = e.payload;
            const v = payload[field];
            try {
                total += BigInt(String(v ?? 0));
            }
            catch {
                /* skip */
            }
        }
        return total.toString();
    }
    return {
        allocatedCount: allocatedAgg._count,
        claimedCount: claimedAgg._count,
        recentAllocated: allocated.map((e) => ({
            txHash: e.txHash,
            blockNumber: e.blockNumber?.toString() ?? "0",
            walletAddress: e.walletAddress,
            payload: e.payload,
        })),
        recentClaimed: claimed.map((e) => ({
            txHash: e.txHash,
            blockNumber: e.blockNumber?.toString() ?? "0",
            walletAddress: e.walletAddress,
            payload: e.payload,
        })),
        sampleAllocatedTotal: sumLaeAmount(allocated, "laeAmount"),
        sampleClaimedTotal: sumLaeAmount(claimed, "amount"),
    };
}
export async function getLaeAnalyticsSummary() {
    const [registrationsByDay, incomeByKind, topEarners] = await Promise.all([
        prisma.$queryRaw `
      SELECT date_trunc('day', registered_at) AS day, COUNT(*)::bigint AS count
      FROM mc_users
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 30
    `.catch(() => []),
        prisma.matrixCoreIncome.groupBy({
            by: ["kind"],
            _sum: { amount: true },
            _count: true,
        }),
        prisma.matrixCoreUser.findMany({
            take: 10,
            orderBy: { totalEarned: "desc" },
        }),
    ]);
    return {
        registrationsByDay: registrationsByDay.map((r) => ({
            day: r.day,
            count: Number(r.count),
        })),
        incomeByKind: incomeByKind.map((r) => ({
            kind: r.kind,
            total: r._sum.amount?.toString() ?? "0",
            count: r._count,
        })),
        topEarners: topEarners.map((u) => ({
            userId: u.userId,
            walletAddress: u.walletAddress,
            totalEarned: u.totalEarned.toString(),
            directReferrals: u.directReferrals,
        })),
    };
}
//# sourceMappingURL=lae-analytics.service.js.map