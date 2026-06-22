import { prisma } from "../../lib/prisma.js";

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getLaeAdminDashboardStats() {
  const start = todayStart();
  const [
    totalUsers,
    todayRegistrations,
    matrixIncomeAgg,
    royalIncomeAgg,
    placements,
    reinvests,
    indexerState,
    stakeAgg,
    activeStakes,
    chainEvents,
  ] = await Promise.all([
    prisma.indexedLaeUser.count(),
    prisma.indexedLaeUser.count({ where: { registeredAt: { gte: start } } }),
    prisma.indexedLaeIncome.aggregate({
      where: { incomeKind: "matrix" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.indexedLaeIncome.aggregate({
      where: { incomeKind: "royal" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.indexedLaePlacement.count(),
    prisma.chainEvent.count({ where: { eventName: "Reinvest" } }),
    prisma.indexerState.findUnique({ where: { id: "main" } }),
    prisma.indexedStake.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.indexedStake.count({ where: { released: false } }),
    prisma.chainEvent.count(),
  ]);

  const levelSales = await prisma.indexedLaeIncome.groupBy({
    by: ["level"],
    where: { incomeKind: "matrix" },
    _count: true,
    _sum: { amount: true },
  });

  return {
    totalUsers,
    todayRegistrations,
    levelSales: levelSales.map((r) => ({
      level: r.level,
      count: r._count,
      volume: r._sum.amount?.toString() ?? "0",
    })),
    royalPool: {
      totalPaid: royalIncomeAgg._sum.amount?.toString() ?? "0",
      eventCount: royalIncomeAgg._count,
    },
    matrixIncome: {
      totalPaid: matrixIncomeAgg._sum.amount?.toString() ?? "0",
      eventCount: matrixIncomeAgg._count,
    },
    placements,
    reinvests,
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
    prisma.indexedLaeUser.findMany({
      take: limit,
      skip: offset,
      orderBy: { userId: "desc" },
    }),
    prisma.indexedLaeUser.count(),
  ]);
  return {
    users: users.map((u) => ({
      ...u,
      registeredBlock: u.registeredBlock.toString(),
      totalIncome: u.totalIncome.toString(),
    })),
    total,
  };
}

export async function listLaeIncome(limit = 100, kind?: string) {
  return prisma.indexedLaeIncome.findMany({
    take: limit,
    where: kind ? { incomeKind: kind } : undefined,
    orderBy: { blockNumber: "desc" },
  });
}

export async function listLaePlacements(limit = 100) {
  return prisma.indexedLaePlacement.findMany({
    take: limit,
    orderBy: { blockNumber: "desc" },
  });
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

  function sumLaeAmount(events: typeof allocated, field: string): string {
    let total = 0n;
    for (const e of events) {
      const payload = e.payload as Record<string, unknown>;
      const v = payload[field];
      try {
        total += BigInt(String(v ?? 0));
      } catch {
        /* skip malformed */
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
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', registered_at) AS day, COUNT(*)::bigint AS count
      FROM idx_lae_users
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 30
    `.catch(() => []),
    prisma.indexedLaeIncome.groupBy({
      by: ["incomeKind"],
      _sum: { amount: true },
      _count: true,
    }),
    prisma.indexedLaeUser.findMany({
      take: 10,
      orderBy: { totalIncome: "desc" },
    }),
  ]);

  return {
    registrationsByDay: registrationsByDay.map((r) => ({
      day: r.day,
      count: Number(r.count),
    })),
    incomeByKind: incomeByKind.map((r) => ({
      kind: r.incomeKind,
      total: r._sum.amount?.toString() ?? "0",
      count: r._count,
    })),
    topEarners: topEarners.map((u) => ({
      userId: u.userId,
      walletAddress: u.walletAddress,
      totalIncome: u.totalIncome.toString(),
      teamSize: u.teamSize,
    })),
  };
}
