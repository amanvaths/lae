import { prisma } from "../../lib/prisma.js";
import { serializeForJson } from "../../lib/serialize.js";
import { laeUserIdForWallet } from "../blockchain/lae-user-lookup.js";

export async function getLaeUserByWallet(wallet: string) {
  const userId = await laeUserIdForWallet(wallet);
  if (!userId) return null;

  const user = await prisma.matrixCoreUser.findUnique({ where: { userId } });
  if (!user) return null;

  const placements = await prisma.matrixCorePosition.findMany({
    where: { occupantId: userId },
    orderBy: [{ level: "asc" }, { cycleId: "asc" }],
  });

  const income = await prisma.matrixCoreIncome.findMany({
    where: { OR: [{ toUserId: userId }, { fromUserId: userId }] },
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
  kind?: "matrix" | "treasury" | "lapse",
  limit = 100
) {
  const userId = await laeUserIdForWallet(wallet);
  if (!userId) return [];

  const kindFilter =
    kind === "matrix"
      ? { kind: "matrix" }
      : kind === "lapse"
        ? { kind: "lapse" }
        : kind === "treasury"
          ? { kind: { in: ["club", "treasury"] } }
          : {};

  const rows = await prisma.matrixCoreIncome.findMany({
    where: { toUserId: userId, ...kindFilter },
    orderBy: { blockNumber: "desc" },
    take: limit,
  });

  if (rows.length > 0) {
    let lapseTx = new Set<string>();
    if (kind === "matrix" || !kind) {
      const lapseRows = await prisma.matrixCoreIncome.findMany({
        where: { toUserId: userId, kind: "lapse" },
        select: { txHash: true, toUserId: true, fromUserId: true },
      });
      lapseTx = new Set(
        lapseRows.map((r) => `${r.txHash}:${r.toUserId}:${r.fromUserId ?? ""}`)
      );
    }
    const filtered = rows.filter(
      (r) =>
        r.kind !== "matrix" ||
        !lapseTx.has(`${r.txHash}:${r.toUserId}:${r.fromUserId ?? ""}`)
    );
    const seenMatrixTx = new Set<string>();
    const deduped = filtered.filter((r) => {
      if (r.kind !== "matrix") return true;
      const key = `${r.txHash}:${r.toUserId}`;
      if (seenMatrixTx.has(key)) return false;
      seenMatrixTx.add(key);
      return true;
    });
    return serializeForJson(deduped);
  }

  // Fallback: derive income rows from indexed chain events when mc_income projection missed
  const eventNames =
    kind === "treasury"
      ? ["ClubPoolPayment"]
      : kind === "lapse"
        ? ["LapseIncome"]
        : kind === "matrix"
          ? ["TokenReceived"]
          : ["TokenReceived", "ClubPoolPayment", "LapseIncome"];

  const uid = String(userId);
  const events = await prisma.chainEvent.findMany({
    where: {
      eventName: { in: eventNames },
      OR: [
        { payload: { path: ["receiverId"], equals: uid } },
        { payload: { path: ["userId"], equals: uid } },
        { payload: { path: ["toUserId"], equals: uid } },
      ],
    },
    orderBy: { blockNumber: "desc" },
    take: limit,
  });

  return serializeForJson(
    events.map((e) => {
      const p = (e.payload ?? {}) as Record<string, string>;
      return {
        kind: e.eventName === "TokenReceived" ? "matrix" : e.eventName === "LapseIncome" ? "lapse" : "club",
        fromUserId: p.fromId ? Number(p.fromId) : null,
        toUserId: userId,
        level: p.level ? Number(p.level) : null,
        amount: p.amount ?? "0",
        blockNumber: e.blockNumber,
        txHash: e.txHash,
        logIndex: e.logIndex,
      };
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
  "LapseIncome",
  "Spillover",
  "LaeRewardAllocated",
  "LaeRewardClaimed",
] as const;

function userEventFilters(userId: number) {
  const uid = String(userId);
  return [
    { payload: { path: ["userId"], equals: uid } },
    { payload: { path: ["user"], equals: uid } },
    { payload: { path: ["referrerId"], equals: uid } },
    { payload: { path: ["referrer"], equals: uid } },
    { payload: { path: ["receiverId"], equals: uid } },
    { payload: { path: ["toUserId"], equals: uid } },
    { payload: { path: ["refId"], equals: uid } },
  ];
}

export async function getLaeUserEvents(wallet: string, limit = 150) {
  const w = wallet.toLowerCase();
  const userId = await laeUserIdForWallet(w);
  if (!userId) return [];

  const events = await prisma.chainEvent.findMany({
    where: {
      eventName: { in: [...MATRIX_EVENT_NAMES] },
      OR: [{ walletAddress: w }, ...userEventFilters(userId)],
    },
    orderBy: { blockNumber: "desc" },
    take: limit,
  });

  return serializeForJson(events);
}
