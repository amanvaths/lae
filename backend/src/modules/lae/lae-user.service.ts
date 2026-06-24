import { prisma } from "../../lib/prisma.js";
import { serializeForJson } from "../../lib/serialize.js";

export async function getLaeUserByWallet(wallet: string) {
  const w = wallet.toLowerCase();
  const user = await prisma.matrixCoreUser.findUnique({ where: { walletAddress: w } });
  if (!user) return null;

  const placements = await prisma.matrixCorePosition.findMany({
    where: { occupantId: user.userId },
    orderBy: [{ level: "asc" }, { cycleId: "asc" }],
  });

  const income = await prisma.matrixCoreIncome.findMany({
    where: { OR: [{ toUserId: user.userId }, { fromUserId: user.userId }] },
    orderBy: { blockNumber: "desc" },
    take: 100,
  });

  return serializeForJson({
    userId: user.userId,
    wallet: user.walletAddress,
    sponsorId: user.sponsorId,
    currentCycle: user.currentCycle,
    directReferrals: user.directReferrals,
    totalEarned: user.totalEarned.toString(),
    totalCycles: user.totalCycles,
    placements: placements.map((p) => ({
      matrixOwnerId: p.matrixOwnerId,
      level: p.level,
      cycleId: p.cycleId,
      position: p.position,
    })),
    income,
  });
}

export async function getLaeUserIncome(
  wallet: string,
  kind?: "matrix" | "treasury",
  limit = 100
) {
  const w = wallet.toLowerCase();
  const user = await prisma.matrixCoreUser.findUnique({ where: { walletAddress: w } });
  if (!user) return [];
  const kindFilter =
    kind === "matrix" ? { kind: "matrix" } : kind === "treasury" ? { kind: "treasury" } : {};
  return serializeForJson(
    await prisma.matrixCoreIncome.findMany({
      where: { toUserId: user.userId, ...kindFilter },
      orderBy: { blockNumber: "desc" },
      take: limit,
    })
  );
}

const MATRIX_EVENT_NAMES = [
  "Registration",
  "NewUserPlace",
  "TokenReceived",
  "ClubPoolPayment",
  "Reinvest",
  "Upgrade",
  "MissedIncome",
  "LaeRewardAllocated",
  "LaeRewardClaimed",
] as const;

export async function getLaeUserEvents(wallet: string, limit = 150) {
  const w = wallet.toLowerCase();
  const user = await prisma.matrixCoreUser.findUnique({ where: { walletAddress: w } });
  if (!user) return [];

  const uid = String(user.userId);
  const events = await prisma.chainEvent.findMany({
    where: {
      eventName: { in: [...MATRIX_EVENT_NAMES] },
      OR: [
        { walletAddress: w },
        { payload: { path: ["userId"], equals: uid } },
        { payload: { path: ["user"], equals: uid } },
        { payload: { path: ["referrerId"], equals: uid } },
        { payload: { path: ["referrer"], equals: uid } },
        { payload: { path: ["receiverId"], equals: uid } },
        { payload: { path: ["fromId"], equals: uid } },
        { payload: { path: ["toUserId"], equals: uid } },
        { payload: { path: ["fromUserId"], equals: uid } },
      ],
    },
    orderBy: { blockNumber: "desc" },
    take: limit,
  });

  return serializeForJson(events);
}
