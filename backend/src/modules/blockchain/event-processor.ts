import type { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";

export interface ParsedLog {
  contract: "matrixCore" | "senso" | "spin" | "staking";
  eventName: string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  args: Record<string, unknown>;
}

function num(v: unknown): number {
  return Number(v ?? 0);
}

function dec(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return String(v);
  return String(v ?? "0");
}

/** Pick the board placement that triggered the single registration payout. */
type PlacementRow = {
  matrixOwnerId: number;
  level: number;
  cycleId: number;
  position: number;
};

async function loadPlacementsForTx(txHash: string, fromUserId: number): Promise<PlacementRow[]> {
  const positions = await prisma.matrixCorePosition.findMany({
    where: { txHash, occupantId: fromUserId },
  });
  if (positions.length) {
    return positions.map((p) => ({
      matrixOwnerId: p.matrixOwnerId,
      level: p.level,
      cycleId: p.cycleId,
      position: p.position,
    }));
  }

  const events = await prisma.chainEvent.findMany({
    where: { txHash, eventName: "NewUserPlace" },
    orderBy: { logIndex: "asc" },
  });
  const rows: PlacementRow[] = [];
  for (const e of events) {
    const p = (e.payload ?? {}) as Record<string, unknown>;
    if (num(p.user) !== fromUserId) continue;
    rows.push({
      matrixOwnerId: num(p.referrer),
      level: num(p.level) || 1,
      cycleId: num(p.cycle),
      position: num(p.spot),
    });
  }
  return rows;
}

async function resolvePayingPlacement(txHash: string, fromUserId: number) {
  const placements = await loadPlacementsForTx(txHash, fromUserId);
  if (!placements.length) return null;

  const slot14 = placements.find((p) => p.position === 14);
  if (slot14) return slot14;

  const user = await prisma.matrixCoreUser.findUnique({
    where: { userId: fromUserId },
    select: { sponsorId: true },
  });
  if (user?.sponsorId) {
    const direct = placements.find(
      (p) => p.cycleId > 1 && p.matrixOwnerId === user.sponsorId
    );
    if (direct) return direct;
  }

  const l1 = placements.filter((p) => p.level === 1);
  if (l1.length) {
    return l1.reduce((best, p) => (p.cycleId < best.cycleId ? p : best));
  }

  return placements[0];
}

async function backfillIncomeBoardContext(txHash: string, fromUserId: number) {
  const placement = await resolvePayingPlacement(txHash, fromUserId);
  if (!placement) return;
  await prisma.matrixCoreIncome.updateMany({
    where: {
      txHash,
      fromUserId,
      OR: [{ matrixOwnerId: null }, { position: null }],
    },
    data: {
      matrixOwnerId: placement.matrixOwnerId,
      boardLevel: placement.level,
      cycleId: placement.cycleId,
      position: placement.position,
    },
  });
}

function lower(v: unknown): string | undefined {
  return typeof v === "string" ? v.toLowerCase() : undefined;
}

/** Idempotent projection from LAEClubMatrix logs into mc_* tables */
export async function processIndexedLog(log: ParsedLog): Promise<void> {
  const { txHash, logIndex, blockNumber, eventName, args, contract } = log;
  const wallet =
    contract === "matrixCore"
      ? lower(args.userAddress) ??
        lower(args.user) ??
        lower(args.from) ??
        lower(args.wallet)
      : lower(args.userAddress) ?? lower(args.user);

  await prisma.chainEvent.upsert({
    where: { txHash_logIndex: { txHash, logIndex } },
    create: {
      txHash,
      logIndex,
      blockNumber: BigInt(blockNumber),
      eventName,
      walletAddress: wallet,
      payload: args as object,
    },
    update: {},
  });

  if (contract !== "matrixCore") {
    return;
  }

  switch (eventName) {
    case "Registration": {
      const id = num(args.userId);
      const walletAddr = lower(args.userAddress)!;
      const sponsorId = num(args.referrerId) || null;
      await prisma.matrixCoreUser.upsert({
        where: { userId: id },
        create: {
          userId: id,
          walletAddress: walletAddr,
          sponsorId,
          registeredBlock: BigInt(blockNumber),
        },
        update: { walletAddress: walletAddr, sponsorId },
      });
      if (sponsorId) {
        await prisma.matrixCoreUser.updateMany({
          where: { userId: sponsorId },
          data: { directReferrals: { increment: 1 } },
        });
      }
      break;
    }

    case "NewUserPlace": {
      const matrixOwnerId = num(args.referrer);
      const occupantId = num(args.user);
      const level = num(args.level) || 1;
      const cycleId = num(args.cycle);
      const position = num(args.spot);

      await prisma.matrixCoreCycle.upsert({
        where: {
          matrixOwnerId_level_cycleId: { matrixOwnerId, level, cycleId },
        },
        create: { matrixOwnerId, level, cycleId, filled: position },
        update: { filled: position },
      });

      if (position >= 14) {
        await prisma.matrixCoreCycle.updateMany({
          where: { matrixOwnerId, level, cycleId },
          data: { filled: 14, completed: true },
        });
      }

      await prisma.matrixCorePosition.upsert({
        where: {
          matrixOwnerId_level_cycleId_position: {
            matrixOwnerId,
            level,
            cycleId,
            position,
          },
        },
        create: {
          matrixOwnerId,
          level,
          cycleId,
          position,
          occupantId,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: { occupantId },
      });

      await backfillIncomeBoardContext(txHash, occupantId);
      break;
    }

    case "TokenReceived": {
      const fromUserId = num(args.fromId);
      const placement = await resolvePayingPlacement(txHash, fromUserId);
      await prisma.matrixCoreIncome.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          kind: "matrix",
          fromUserId,
          toUserId: num(args.receiverId),
          matrixOwnerId: placement?.matrixOwnerId ?? null,
          boardLevel: placement?.level ?? null,
          level: num(args.level) || null,
          cycleId: placement?.cycleId ?? null,
          position: placement?.position ?? null,
          amount: dec(args.amount),
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {
          matrixOwnerId: placement?.matrixOwnerId ?? null,
          boardLevel: placement?.level ?? null,
          cycleId: placement?.cycleId ?? null,
          position: placement?.position ?? null,
        },
      });
      break;
    }

    case "ClubPoolPayment": {
      await prisma.matrixCoreIncome.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          kind: "club",
          toUserId: num(args.userId),
          matrixOwnerId: num(args.refId) || null,
          level: num(args.level) || null,
          amount: dec(args.amount),
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      break;
    }

    case "MissedIncome": {
      await prisma.matrixCoreIncome.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          kind: "missed",
          toUserId: num(args.receiverId),
          fromUserId: num(args.userId),
          level: num(args.level) || null,
          amount: "0",
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      break;
    }

    case "LapseIncome": {
      const fromUserId = num(args.fromId);
      const placement = await resolvePayingPlacement(txHash, fromUserId);
      await prisma.matrixCoreIncome.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          kind: "lapse",
          fromUserId,
          toUserId: num(args.receiverId),
          matrixOwnerId: placement?.matrixOwnerId ?? null,
          boardLevel: placement?.level ?? null,
          level: num(args.level) || null,
          cycleId: placement?.cycleId ?? null,
          position: placement?.position ?? null,
          amount: dec(args.amount),
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {
          matrixOwnerId: placement?.matrixOwnerId ?? null,
          boardLevel: placement?.level ?? null,
          cycleId: placement?.cycleId ?? null,
          position: placement?.position ?? null,
        },
      });
      break;
    }

    case "Upgrade": {
      const userId = num(args.userId);
      const slotId = num(args.level);
      await prisma.matrixCoreSlotOpening.upsert({
        where: { userId_slotId: { userId, slotId } },
        create: {
          userId,
          slotId,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      await prisma.matrixCoreUser.updateMany({
        where: { userId },
        data: { highestSlot: { set: Math.max(slotId, 1) } },
      });
      if (slotId === 2) {
        await prisma.matrixCoreCycle.updateMany({
          where: { matrixOwnerId: userId, level: 1, cycleId: 1 },
          data: { slot2Opened: true },
        });
      }
      break;
    }

    case "Reinvest": {
      const userId = num(args.userId);
      const level = num(args.level) || 1;
      const completedCycle = await prisma.matrixCoreCycle.findFirst({
        where: { matrixOwnerId: userId, level, completed: false },
        orderBy: { cycleId: "desc" },
        select: { cycleId: true },
      });
      const prevCycle = completedCycle?.cycleId ?? 1;
      const newCycle = prevCycle + 1;

      await prisma.matrixCoreCycle.updateMany({
        where: { matrixOwnerId: userId, level, cycleId: prevCycle },
        data: { filled: 14, completed: true },
      });

      await prisma.matrixCoreRecycle.upsert({
        where: {
          userId_level_completedCycle: {
            userId,
            level,
            completedCycle: prevCycle,
          },
        },
        create: {
          userId,
          level,
          completedCycle: prevCycle,
          newCycle,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });

      if (level === 1) {
        await prisma.matrixCoreUser.updateMany({
          where: { userId },
          data: { currentCycle: newCycle, totalCycles: { increment: 1 } },
        });
      }
      break;
    }

    default:
      break;
  }
}

export function parseEthersLog(
  contract: ParsedLog["contract"],
  parsed: ethers.LogDescription,
  raw: ethers.Log
): ParsedLog {
  const args: Record<string, unknown> = {};
  parsed.fragment.inputs.forEach((input, i) => {
    const v = parsed.args[i];
    args[input.name || String(i)] = typeof v === "bigint" ? v.toString() : v;
  });
  return {
    contract,
    eventName: parsed.name,
    txHash: raw.transactionHash,
    logIndex: raw.index,
    blockNumber: raw.blockNumber,
    args,
  };
}
