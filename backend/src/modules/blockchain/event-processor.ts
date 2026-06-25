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
      break;
    }

    case "TokenReceived": {
      await prisma.matrixCoreIncome.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          kind: "matrix",
          fromUserId: num(args.fromId),
          toUserId: num(args.receiverId),
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
