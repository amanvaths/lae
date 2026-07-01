import { prisma } from "../../lib/prisma.js";
import { serializeForJson } from "../../lib/serialize.js";
import { laeUserIdForWallet } from "../blockchain/lae-user-lookup.js";
import { Decimal } from "@prisma/client/runtime/library";

type IncomeOutRow = {
  id: string;
  kind: string;
  fromUserId: number | null;
  toUserId: number | null;
  matrixOwnerId: number | null;
  boardLevel: number | null;
  level: number | null;
  cycleId: number | null;
  position: number | null;
  amount: Decimal;
  blockNumber: bigint;
  txHash: string;
  logIndex: number;
  createdAt: Date;
};

function incomeRowKey(txHash: string, logIndex: number): string {
  return `${txHash}:${logIndex}`;
}

function toIncomeOutRow(row: {
  id: string;
  kind: string;
  fromUserId: number | null;
  toUserId: number | null;
  matrixOwnerId: number | null;
  boardLevel: number | null;
  level: number | null;
  cycleId: number | null;
  position: number | null;
  amount: Decimal;
  blockNumber: bigint;
  txHash: string;
  logIndex: number;
  createdAt: Date;
}): IncomeOutRow {
  return { ...row };
}

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

  const wantMatrix = kind === "matrix" || kind === undefined;
  const merged: IncomeOutRow[] = rows.map(toIncomeOutRow);

  if (wantMatrix) {
    const uid = String(userId);
    const chainEvents = await prisma.chainEvent.findMany({
      where: {
        eventName: "TokenReceived",
        payload: { path: ["receiverId"], equals: uid },
      },
      orderBy: { blockNumber: "desc" },
      take: Math.max(limit, 500),
    });

    const seen = new Set(merged.filter((r) => r.kind === "matrix").map((r) => incomeRowKey(r.txHash, r.logIndex)));

    for (const e of chainEvents) {
      if (seen.has(incomeRowKey(e.txHash, e.logIndex))) continue;
      const p = (e.payload ?? {}) as Record<string, string>;
      merged.push({
        id: `chain-${e.txHash}-${e.logIndex}`,
        kind: "matrix",
        fromUserId: p.fromId ? Number(p.fromId) : null,
        toUserId: userId,
        matrixOwnerId: null,
        boardLevel: p.level ? Number(p.level) : null,
        level: p.level ? Number(p.level) : null,
        cycleId: null,
        position: null,
        amount: new Decimal(p.amount ?? "0"),
        blockNumber: e.blockNumber ?? 0n,
        txHash: e.txHash,
        logIndex: e.logIndex,
        createdAt: e.createdAt,
      });
      seen.add(incomeRowKey(e.txHash, e.logIndex));
    }
  }

  if (merged.length > 0) {
    merged.sort((a, b) => {
      const diff = Number(b.blockNumber - a.blockNumber);
      return diff !== 0 ? diff : b.logIndex - a.logIndex;
    });
    return serializeForJson(merged.slice(0, limit));
  }

  // Fallback when mc_income is empty: derive from chain events only
  const eventNames =
    kind === "treasury"
      ? ["TreasuryPool", "ClubPoolPayment"]
      : kind === "lapse"
        ? ["LapseIncome"]
        : kind === "matrix"
          ? ["TokenReceived"]
          : ["TokenReceived", "TreasuryPool", "ClubPoolPayment", "LapseIncome"];

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
