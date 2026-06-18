import type { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";

export interface ParsedLog {
  contract: "senso" | "spin" | "staking";
  eventName: string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  args: Record<string, unknown>;
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
    lower(args.user) ??
    lower(args.owner) ??
    lower(args.recipient) ??
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
          sltAmount: dec(args.sltAmount),
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
          sltAmount: dec(args.sltAmount),
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
