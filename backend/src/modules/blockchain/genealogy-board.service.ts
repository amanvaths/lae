import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CONTRACTS } from "../../config/chains.js";
import { getIndexerProvider } from "./rpc-providers.js";
import { LAE_MATRIX_READ_ABI } from "./matrix-core-abi.js";
import type { MatrixSlotDTO } from "./matrix-tree.service.js";

export const GENEALOGY_MATRIX_SIZE = 14;

const matrixIface = new ethers.Interface([...LAE_MATRIX_READ_ABI]);

function matrixContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.matrixCore, matrixIface, getIndexerProvider());
}

export async function walletForUserId(userId: number): Promise<string | null> {
  const row = await prisma.matrixCoreUser.findUnique({
    where: { userId },
    select: { walletAddress: true },
  });
  if (row?.walletAddress) return row.walletAddress.toLowerCase();
  try {
    const m = matrixContract();
    const wallet = String(await m.idToAddress(userId)).toLowerCase();
    return wallet && wallet !== ethers.ZeroAddress ? wallet : null;
  } catch {
    return null;
  }
}

async function idForAddress(address: string): Promise<number | null> {
  try {
    const m = matrixContract();
    const id = Number(await m.addressToId(address));
    return id > 0 ? id : null;
  } catch {
    return null;
  }
}

function addrAt(rawRefs: ethers.Result | string[], i: number): string {
  const raw =
    typeof (rawRefs as ethers.Result)?.getItem === "function"
      ? (rawRefs as ethers.Result).getItem(i)
      : (rawRefs as string[])?.[i] ?? ethers.ZeroAddress;
  return String(raw).toLowerCase();
}

/** Read the on-chain genealogy board (usersXMatrixReferrals) for a wallet. */
export async function readGenealogyBoard(
  wallet: string,
  level: number
): Promise<{ filled: number; completed: boolean; slots: MatrixSlotDTO[] }> {
  const m = matrixContract();
  const rawRefs = await m.usersXMatrixReferrals(wallet, level);

  let filled = 0;
  let firstEmpty = 0;
  const slots: MatrixSlotDTO[] = [];

  for (let p = 1; p <= GENEALOGY_MATRIX_SIZE; p++) {
    const addr = addrAt(rawRefs, p - 1);
    const occupied = Boolean(addr) && addr !== ethers.ZeroAddress.toLowerCase();
    if (occupied) {
      filled += 1;
      const occId = await idForAddress(addr);
      slots.push({
        position: p,
        state: "filled",
        userId: occId,
        address: addr,
      });
    } else {
      if (firstEmpty === 0) firstEmpty = p;
      slots.push({
        position: p,
        state: "waiting",
        userId: null,
        address: null,
      });
    }
  }

  const completed = filled >= GENEALOGY_MATRIX_SIZE;
  if (!completed && firstEmpty > 0) {
    slots[firstEmpty - 1]!.state = "open";
  }

  return { filled, completed, slots };
}

export async function chainCycleInfo(
  userId: number,
  level: number
): Promise<{ reinvestCount: number; currentCycle: number; wallet: string } | null> {
  const wallet = await walletForUserId(userId);
  if (!wallet) return null;
  const m = matrixContract();
  const matrixRow = await m.usersXMatrix(wallet, level);
  const reinvestCount = Number(matrixRow.reinvestCount ?? 0);
  return { reinvestCount, currentCycle: reinvestCount + 1, wallet };
}

/** Snapshot the live genealogy board into DB when a cycle completes (Reinvest event). */
export async function snapshotGenealogyBoard(
  matrixOwnerId: number,
  level: number,
  blockNumber: number,
  txHash: string,
  logIndex: number
): Promise<void> {
  const wallet = await walletForUserId(matrixOwnerId);
  if (!wallet) return;

  const m = matrixContract();
  const matrixRow = await m.usersXMatrix(wallet, level);
  const reinvestCount = Number(matrixRow.reinvestCount ?? 0);
  const completedCycleId = reinvestCount;
  if (completedCycleId < 1) return;

  const { slots } = await readGenealogyBoard(wallet, level);

  for (const slot of slots) {
    if (slot.state !== "filled" || !slot.userId) continue;
    await prisma.matrixCorePosition.upsert({
      where: {
        matrixOwnerId_level_cycleId_position: {
          matrixOwnerId,
          level,
          cycleId: completedCycleId,
          position: slot.position,
        },
      },
      create: {
        matrixOwnerId,
        level,
        cycleId: completedCycleId,
        position: slot.position,
        occupantId: slot.userId,
        blockNumber: BigInt(blockNumber),
        txHash,
        logIndex,
      },
      update: { occupantId: slot.userId },
    });
  }

  await prisma.matrixCoreCycle.upsert({
    where: {
      matrixOwnerId_level_cycleId: { matrixOwnerId, level, cycleId: completedCycleId },
    },
    create: { matrixOwnerId, level, cycleId: completedCycleId, filled: 14, completed: true },
    update: { filled: 14, completed: true },
  });

  const nextCycle = completedCycleId + 1;
  await prisma.matrixCoreCycle.upsert({
    where: {
      matrixOwnerId_level_cycleId: { matrixOwnerId, level, cycleId: nextCycle },
    },
    create: { matrixOwnerId, level, cycleId: nextCycle, filled: 0, completed: false },
    update: {},
  });
}

/** After Registration, index the entrant on every ancestor genealogy board they appear on. */
export async function syncEntrantOnGenealogyBoards(
  entrantId: number,
  entrantWallet: string,
  level: number,
  blockNumber: number,
  txHash: string,
  logIndex: number,
  sponsorId: number | null
): Promise<void> {
  if (!sponsorId) return;

  const m = matrixContract();
  const entrantAddr = entrantWallet.toLowerCase();
  let currentId = sponsorId;
  let hops = 0;

  while (currentId > 0 && hops < 64) {
    const ownerWallet = await walletForUserId(currentId);
    if (!ownerWallet) break;

    const matrixRow = await m.usersXMatrix(ownerWallet, level);
    const cycleId = Number(matrixRow.reinvestCount ?? 0) + 1;
    const { slots } = await readGenealogyBoard(ownerWallet, level);

    for (const slot of slots) {
      if (slot.address?.toLowerCase() !== entrantAddr) continue;

      await prisma.matrixCorePosition.upsert({
        where: {
          matrixOwnerId_level_cycleId_position: {
            matrixOwnerId: currentId,
            level,
            cycleId,
            position: slot.position,
          },
        },
        create: {
          matrixOwnerId: currentId,
          level,
          cycleId,
          position: slot.position,
          occupantId: entrantId,
          blockNumber: BigInt(blockNumber),
          txHash,
          logIndex,
        },
        update: { occupantId: entrantId },
      });

      const filledCount = await prisma.matrixCorePosition.count({
        where: { matrixOwnerId: currentId, level, cycleId },
      });

      await prisma.matrixCoreCycle.upsert({
        where: {
          matrixOwnerId_level_cycleId: { matrixOwnerId: currentId, level, cycleId },
        },
        create: {
          matrixOwnerId: currentId,
          level,
          cycleId,
          filled: filledCount,
          completed: filledCount >= GENEALOGY_MATRIX_SIZE,
        },
        update: {
          filled: filledCount,
          completed: filledCount >= GENEALOGY_MATRIX_SIZE,
        },
      });
      break;
    }

    try {
      const details = await m.getUserDetails(currentId);
      currentId = Number(details.referrerId ?? 0);
    } catch {
      break;
    }
    hops++;
  }
}
