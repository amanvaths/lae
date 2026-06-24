import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CONTRACTS } from "../../config/chains.js";
import { getIndexerProvider } from "./rpc-providers.js";
import { LAE_MATRIX_READ_ABI } from "./matrix-core-abi.js";

export const MATRIX_SIZE = 14;
export const LAST_LEVEL = 15;

const matrixIface = new ethers.Interface([...LAE_MATRIX_READ_ABI]);

export type SlotState = "locked" | "waiting" | "open" | "filled";

export interface MatrixSlotDTO {
  position: number;
  state: SlotState;
  userId: number | null;
  address: string | null;
}

export interface MatrixTreeDTO {
  userId: number;
  address: string;
  level: number;
  cycle: number;
  active: boolean;
  filledSpots: number;
  completed: boolean;
  slot2Opened: boolean;
  totalEarned: string;
  totalCycles: number;
  slots: MatrixSlotDTO[];
}

function matrixContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.matrixCore, matrixIface, getIndexerProvider());
}

async function walletForUserId(userId: number): Promise<string | null> {
  const row = await prisma.matrixCoreUser.findUnique({
    where: { userId },
    select: { walletAddress: true },
  });
  if (row?.walletAddress) return row.walletAddress.toLowerCase();
  try {
    const m = matrixContract();
    const wallet = String(await m.idToAddress(userId)).toLowerCase();
    return wallet && wallet !== "0x0000000000000000000000000000000000000000" ? wallet : null;
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

/** Build tree from indexed DB positions */
async function treeFromDb(
  userId: number,
  level: number,
  cycleId: number
): Promise<MatrixTreeDTO | null> {
  const user = await prisma.matrixCoreUser.findUnique({ where: { userId } });
  if (!user) return null;

  const cycle = await prisma.matrixCoreCycle.findUnique({
    where: { matrixOwnerId_level_cycleId: { matrixOwnerId: userId, level, cycleId } },
  });

  const positions = await prisma.matrixCorePosition.findMany({
    where: { matrixOwnerId: userId, level, cycleId },
    orderBy: { position: "asc" },
  });

  const posMap = new Map(positions.map((p) => [p.position, p]));
  const filled = cycle?.filled ?? positions.length;
  const completed = cycle?.completed ?? false;
  const nextOpen = filled + 1;
  const slots: MatrixSlotDTO[] = [];

  for (let p = 1; p <= MATRIX_SIZE; p++) {
    const row = posMap.get(p);
    if (row) {
      const occWallet = await walletForUserId(row.occupantId);
      slots.push({
        position: p,
        state: "filled",
        userId: row.occupantId,
        address: occWallet,
      });
    } else {
      slots.push({
        position: p,
        state: !completed && p === nextOpen ? "open" : "waiting",
        userId: null,
        address: null,
      });
    }
  }

  return {
    userId,
    address: user.walletAddress,
    level,
    cycle: cycleId,
    active: true,
    filledSpots: filled,
    completed,
    slot2Opened: cycle?.slot2Opened ?? false,
    totalEarned: user.totalEarned.toString(),
    totalCycles: user.totalCycles,
    slots,
  };
}

/** Read usersXMatrixReferrals from chain for the current cycle */
async function treeFromChain(
  userId: number,
  level: number,
  cycleId: number
): Promise<MatrixTreeDTO | null> {
  const m = matrixContract();
  try {
    const wallet = (await walletForUserId(userId))?.toLowerCase();
    if (!wallet) return null;

    const [details, matrixRow, slot2Active] = await Promise.all([
      m.getUserDetails(userId),
      m.usersXMatrix(wallet, level),
      m.isUserSlotActive(userId, 2),
    ]);

    const reinvestCount = Number(matrixRow.reinvestCount ?? 0);
    const currentCycle = reinvestCount + 1;
    const slot2Opened = Boolean(slot2Active);

    let filled = 0;
    let completed = false;
    const slots: MatrixSlotDTO[] = [];

    if (cycleId === currentCycle) {
      const rawRefs = await m.usersXMatrixReferrals(wallet, level);
      const referralCount = Number(rawRefs?.length ?? 0);
      filled = referralCount;
      completed = filled >= MATRIX_SIZE;

      for (let p = 1; p <= MATRIX_SIZE; p++) {
        const addr =
          p <= referralCount
            ? String(typeof rawRefs.getItem === "function" ? rawRefs.getItem(p - 1) : rawRefs[p - 1])
            : undefined;
        if (addr && addr !== ethers.ZeroAddress) {
          const occId = await idForAddress(addr);
          slots.push({
            position: p,
            state: "filled",
            userId: occId,
            address: addr.toLowerCase(),
          });
        } else {
          slots.push({
            position: p,
            state: !completed && p === filled + 1 ? "open" : "waiting",
            userId: null,
            address: null,
          });
        }
      }
    } else {
      const dbTree = await treeFromDb(userId, level, cycleId);
      if (dbTree) return dbTree;
      for (let p = 1; p <= MATRIX_SIZE; p++) {
        slots.push({ position: p, state: "waiting", userId: null, address: null });
      }
    }

    return {
      userId,
      address: String(details.userAddress).toLowerCase(),
      level,
      cycle: cycleId,
      active: true,
      filledSpots: filled,
      completed,
      slot2Opened,
      totalEarned: String(details.totalIncome ?? "0"),
      totalCycles: reinvestCount,
      slots,
    };
  } catch {
    return null;
  }
}

/** Authoritative matrix tree — chain for current cycle, DB for history */
export async function getMatrixTree(
  userId: number,
  level: number,
  cycleId: number
): Promise<MatrixTreeDTO | { error: string }> {
  if (!Number.isInteger(userId) || userId < 1) return { error: "invalid userId" };
  if (!Number.isInteger(level) || level < 1 || level > LAST_LEVEL) return { error: "invalid level" };
  if (!Number.isInteger(cycleId) || cycleId < 1) return { error: "invalid cycle" };

  const chainTree = await treeFromChain(userId, level, cycleId);
  if (!chainTree) return { error: "user not found or chain read failed" };

  const dbTree = await treeFromDb(userId, level, cycleId);
  if (dbTree) {
    for (let p = 1; p <= chainTree.filledSpots; p++) {
      const c = chainTree.slots[p - 1];
      const d = dbTree.slots[p - 1];
      if (c?.userId !== d?.userId) {
        console.warn(
          `[matrix-tree] DB/chain mismatch user=${userId} level=${level} cycle=${cycleId} pos=${p}`
        );
      }
    }
  }

  return chainTree;
}

export interface MatrixOverviewCycle {
  cycle: number;
  filled: number;
  completed: boolean;
  slot2Opened: boolean;
}

export interface MatrixOverviewLevel {
  level: number;
  active: boolean;
  currentCycle: number;
  cycles: MatrixOverviewCycle[];
}

export async function getMatrixOverview(
  userId: number,
  levelFilter?: number
): Promise<
  | {
      userId: number;
      address: string;
      levels: MatrixOverviewLevel[];
    }
  | { error: string }
> {
  if (!Number.isInteger(userId) || userId < 1) return { error: "invalid userId" };

  const user = await prisma.matrixCoreUser.findUnique({ where: { userId } });
  let address = user?.walletAddress;

  if (!address) {
    address = (await walletForUserId(userId)) ?? undefined;
    if (!address) return { error: "user not found" };
  }

  const m = matrixContract();
  const levels: MatrixOverviewLevel[] = [];
  const levelStart = levelFilter ?? 1;
  const levelEnd = levelFilter ?? LAST_LEVEL;

  for (let level = levelStart; level <= levelEnd; level++) {
    let active = false;
    let currentCycle = 1;
    try {
      active = Boolean(await m.isUserSlotActive(userId, level));
      if (active) {
        const matrixRow = await m.usersXMatrix(address, level);
        currentCycle = Number(matrixRow.reinvestCount ?? 0) + 1;
      }
    } catch {
      active = level === 1;
    }

    if (!active && levelFilter == null) continue;

    const cycles: MatrixOverviewCycle[] = [];
    for (let c = 1; c <= currentCycle; c++) {
      const status = await prisma.matrixCoreCycle.findUnique({
        where: { matrixOwnerId_level_cycleId: { matrixOwnerId: userId, level, cycleId: c } },
      });
      cycles.push({
        cycle: c,
        filled: status?.filled ?? 0,
        completed: status?.completed ?? false,
        slot2Opened: status?.slot2Opened ?? false,
      });
    }

    levels.push({ level, active, currentCycle, cycles });
  }

  return { userId, address, levels };
}

/** All placements for a user across levels/cycles */
export async function getUserPlacement(userId: number) {
  return prisma.matrixCorePosition.findMany({
    where: { occupantId: userId },
    orderBy: [{ level: "asc" }, { cycleId: "asc" }, { position: "asc" }],
  });
}
