import type { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";

export interface ParsedLog {
  contract: "laeMatrix" | "senso" | "spin" | "staking";
  eventName: string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  args: Record<string, unknown>;
}

function num(v: unknown): number {
  return Number(v ?? 0);
}

function lower(v: unknown): string | undefined {
  return typeof v === "string" ? v.toLowerCase() : undefined;
}

function dec(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return String(v);
  return String(v ?? "0");
}

function tsFromBlock(_blockNumber: number): Date {
  return new Date(Date.now());
}

/** Idempotent projection from parsed log into analytics tables + event_logs */
export async function processIndexedLog(log: ParsedLog): Promise<void> {
  const { txHash, logIndex, blockNumber, eventName, args } = log;
  const wallet =
    lower(args.userAddress) ??
    lower(args.user) ??
    lower(args.owner) ??
    lower(args.recipient) ??
    lower(args.from) ??
    undefined;

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

  switch (eventName) {
    case "UserRegistered": {
      const user = lower(args.user)!;
      const sponsor = lower(args.sponsor);
      const ts = args.timestamp ? new Date(Number(args.timestamp) * 1000) : tsFromBlock(blockNumber);
      await prisma.indexedUser.upsert({
        where: { walletAddress: user },
        create: {
          walletAddress: user,
          sponsorAddress: sponsor,
          registeredAt: ts,
          registeredBlock: BigInt(blockNumber),
        },
        update: { sponsorAddress: sponsor, registeredAt: ts },
      });
      if (sponsor) {
        await prisma.indexedReferral.upsert({
          where: { txHash_logIndex: { txHash, logIndex } },
          create: {
            sponsorAddress: sponsor,
            referralAddress: user,
            blockNumber: BigInt(blockNumber),
            txHash,
            logIndex,
          },
          update: {},
        });
      }
      await prisma.indexedTransaction.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          walletAddress: user,
          eventName,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
          payload: args as object,
        },
        update: {},
      });
      break;
    }

    case "ClubPurchased":
    case "PilotPurchased":
    case "ClubPlacement":
    case "PilotPlacement":
    case "ClubCycleCompleted":
    case "PilotCycleCompleted":
    case "ClubRebirthCreated":
    case "PilotRebirthCreated":
    case "AutoUpgrade": {
      const owner = lower(args.user) ?? lower(args.owner) ?? wallet!;
      const isClub = eventName.startsWith("Club") || (eventName === "AutoUpgrade" && Number(args.matrixType) === 0);
      const isPilot = eventName.startsWith("Pilot") || (eventName === "AutoUpgrade" && Number(args.matrixType) === 1);
      const matrixId = args.matrixId ?? args.parentMatrixId ?? 0n;
      const row = {
        matrixId: BigInt(String(matrixId)),
        ownerAddress: owner,
        level: Number(args.level ?? 0),
        eventName,
        blockNumber: BigInt(blockNumber),
        txHash,
        logIndex,
        payload: args as object,
      };
      if (isClub) {
        await prisma.indexedClubMatrix.upsert({
          where: { txHash_logIndex: { txHash, logIndex } },
          create: row,
          update: {},
        });
      }
      if (isPilot) {
        await prisma.indexedPilotMatrix.upsert({
          where: { txHash_logIndex: { txHash, logIndex } },
          create: row,
          update: {},
        });
      }
      await prisma.indexedTransaction.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          walletAddress: owner,
          eventName,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
          payload: args as object,
        },
        update: {},
      });
      break;
    }

    case "IncomePaid": {
      const recipient = lower(args.recipient)!;
      await prisma.indexedIncome.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          recipientAddress: recipient,
          payerAddress: lower(args.payer),
          incomeType: Number(args.incomeType),
          matrixType: Number(args.matrixType),
          level: Number(args.level),
          amount: dec(args.amount),
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      break;
    }

    case "TokenReward": {
      const recipient = lower(args.recipient)!;
      await prisma.indexedTokenReward.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          recipientAddress: recipient,
          sourceAddress: lower(args.source),
          rewardType: Number(args.rewardType),
          matrixType: Number(args.matrixType),
          level: Number(args.level),
          sltAmount: dec(args.laeAmount ?? args.sltAmount),
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      break;
    }

    case "Withdraw": {
      const user = lower(args.user)!;
      await prisma.indexedWithdrawal.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          walletAddress: user,
          amount: dec(args.amount),
          withdrawRef: String(args.withdrawRef),
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      await prisma.indexedTransaction.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          walletAddress: user,
          eventName,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
          payload: args as object,
        },
        update: {},
      });
      break;
    }

    case "SpinExecuted": {
      const user = lower(args.user)!;
      await prisma.indexedSpin.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          walletAddress: user,
          tier: Number(args.tier),
          sltAmount: dec(args.laeAmount ?? args.sltAmount),
          nonce: BigInt(String(args.nonce ?? 0)),
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      break;
    }

    case "Staked": {
      const user = lower(args.user)!;
      await prisma.indexedStake.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          walletAddress: user,
          stakeIndex: BigInt(String(args.stakeIndex ?? 0)),
          amount: dec(args.amount),
          lockEnd: BigInt(String(args.lockEnd ?? 0)),
          released: false,
          eventName,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      break;
    }

    case "Released": {
      const user = lower(args.user)!;
      const stakeIndex = BigInt(String(args.stakeIndex ?? 0));
      await prisma.indexedStake.create({
        data: {
          walletAddress: user,
          stakeIndex,
          amount: dec(args.amount),
          lockEnd: 0n,
          released: true,
          eventName,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
      }).catch(() => {
        /* idempotent duplicate */
      });
      break;
    }

    // ─── LAE Club / BTitan Matrix ───────────────────────────────────────────
    case "Registration": {
      const userAddr = lower(args.userAddress)!;
      const sponsorId = num(args.referrerId);
      await prisma.indexedLaeUser.upsert({
        where: { walletAddress: userAddr },
        create: {
          walletAddress: userAddr,
          userId: num(args.userId),
          sponsorId,
          registeredAt: tsFromBlock(blockNumber),
          registeredBlock: BigInt(blockNumber),
        },
        update: {
          userId: num(args.userId),
          sponsorId,
        },
      });
      if (sponsorId > 0) {
        const sponsor = await prisma.indexedLaeUser.findFirst({ where: { userId: sponsorId } });
        if (sponsor) {
          await prisma.indexedReferral.upsert({
            where: { txHash_logIndex: { txHash, logIndex } },
            create: {
              sponsorAddress: sponsor.walletAddress,
              referralAddress: userAddr,
              blockNumber: BigInt(blockNumber),
              txHash,
              logIndex,
            },
            update: {},
          });
        }
      }
      break;
    }

    case "TokenReceived": {
      const receiverId = num(args.receiverId);
      const receiver = await prisma.indexedLaeUser.findFirst({ where: { userId: receiverId } });
      await prisma.indexedLaeIncome.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          receiverUserId: receiverId,
          receiverAddress: receiver?.walletAddress ?? null,
          fromUserId: num(args.fromId) || null,
          level: num(args.level),
          amount: dec(args.amount),
          incomeKind: "matrix",
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      if (receiver) {
        await prisma.indexedLaeUser.update({
          where: { walletAddress: receiver.walletAddress },
          data: { totalIncome: { increment: dec(args.amount) } },
        });
      }
      break;
    }

    case "TreasuryPool": {
      const refId = num(args.refId);
      const ref = await prisma.indexedLaeUser.findFirst({ where: { userId: refId } });
      await prisma.indexedLaeIncome.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          receiverUserId: refId,
          receiverAddress: ref?.walletAddress ?? null,
          fromUserId: num(args.userId) || null,
          level: num(args.level),
          amount: dec(args.amount),
          incomeKind: "royal",
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      break;
    }

    case "NewUserPlace": {
      await prisma.indexedLaePlacement.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          userId: num(args.user),
          referrerId: num(args.referrer),
          level: num(args.level),
          cycle: num(args.cycle),
          spot: num(args.spot),
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: {},
      });
      break;
    }

    case "Spillover":
    case "Reinvest":
    case "Upgrade":
    case "MissedIncome":
      await prisma.indexedTransaction.upsert({
        where: { txHash_logIndex: { txHash, logIndex } },
        create: {
          walletAddress: wallet ?? "0x0000000000000000000000000000000000000000",
          eventName,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
          payload: args as object,
        },
        update: {},
      });
      break;

    default:
      if (wallet) {
        await prisma.indexedTransaction.upsert({
          where: { txHash_logIndex: { txHash, logIndex } },
          create: {
            walletAddress: wallet,
            eventName,
            blockNumber: BigInt(blockNumber),
            txHash,
            logIndex,
            payload: args as object,
          },
          update: {},
        });
      }
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
