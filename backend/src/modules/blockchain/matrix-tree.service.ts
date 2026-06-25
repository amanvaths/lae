import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CONTRACTS } from "../../config/chains.js";
import { getIndexerProvider } from "./rpc-providers.js";
import { LAE_MATRIX_READ_ABI } from "./matrix-core-abi.js";
import {
  chainCycleInfo,
  readGenealogyBoard,
  walletForUserId,
  overflowMembersForCycle,
  mapMembersToBoardSlots,
} from "./genealogy-board.service.js";

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
  boardFilled: number;
  overflowCount: number;
  completed: boolean;
  slot2Opened: boolean;
  totalEarned: string;
  totalCycles: number;
  slots: MatrixSlotDTO[];
  overflowMembers: Array<{ userId: number; address: string | null; depth: number }>;
}

function packTree(
  base: {
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
): MatrixTreeDTO {
  const boardFilled = base.slots.filter((s) => s.state === "filled").length;
  return {
    ...base,
    boardFilled,
    overflowCount: 0,
    filledSpots: boardFilled,
    overflowMembers: [],
  };
}

function matrixContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.matrixCore, matrixIface, getIndexerProvider());
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

  const boardPositions = await prisma.matrixCorePosition.findMany({
    where: { matrixOwnerId: userId, level, cycleId, position: { lte: MATRIX_SIZE } },
    orderBy: { position: "asc" },
  });

  const overflowRows = await prisma.matrixCorePosition.findMany({
    where: { matrixOwnerId: userId, level, cycleId, position: { gt: MATRIX_SIZE } },
    orderBy: { position: "asc" },
  });

  let slots: MatrixSlotDTO[];
  let filled: number;

  // Cycle 2+: map overflow / off-board rows into positions 1–14 sequentially.
  if (boardPositions.length === 0 && overflowRows.length > 0) {
    const members = overflowRows.map((row) => ({
      userId: row.occupantId,
      address: null as string | null,
      depth: 4,
    }));
    for (const m of members) {
      m.address = await walletForUserId(m.userId);
    }
    const mapped = mapMembersToBoardSlots(members);
    slots = mapped.slots;
    filled = mapped.filled;
  } else {
    const posMap = new Map(boardPositions.map((p) => [p.position, p]));
    filled = boardPositions.length;
    const completed = cycle?.completed ?? filled >= MATRIX_SIZE;
    const nextOpen = completed ? 0 : filled + 1;
    slots = [];

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
  }

  const completed = cycle?.completed ?? filled >= MATRIX_SIZE;

  return packTree({
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
  });
}

/** Cycle 2+ tree: cycle-1 overflow members mapped into the 14-slot board. */
async function treeFromCycleOverflow(
  userId: number,
  level: number,
  cycleId: number,
  reinvestCount: number,
  currentCycle: number,
  wallet: string,
  slot2Opened: boolean,
  totalEarned: string
): Promise<MatrixTreeDTO> {
  const members = await overflowMembersForCycle(
    userId,
    level,
    cycleId,
    reinvestCount,
    currentCycle
  );
  const { slots, filled } = mapMembersToBoardSlots(members);
  return packTree({
    userId,
    address: wallet,
    level,
    cycle: cycleId,
    active: true,
    filledSpots: filled,
    completed: filled >= MATRIX_SIZE,
    slot2Opened,
    totalEarned,
    totalCycles: reinvestCount,
    slots,
  });
}

/** Resolve matrix tree: genealogy board on chain for cycle 1; DB snapshots for history / post-recycle cycles. */
async function treeFromChain(
  userId: number,
  level: number,
  cycleId: number
): Promise<MatrixTreeDTO | null> {
  const m = matrixContract();
  try {
    const wallet = (await walletForUserId(userId))?.toLowerCase();
    if (!wallet) return null;

    const [details, slot2Active, cycleInfo] = await Promise.all([
      m.getUserDetails(userId),
      m.isUserSlotActive(userId, 2),
      chainCycleInfo(userId, level),
    ]);

    if (!cycleInfo) return null;

    const { reinvestCount, currentCycle } = cycleInfo;
    const slot2Opened = Boolean(slot2Active);
    const totalEarned = String(details.totalIncome ?? "0");

    // Completed past cycle → DB snapshot, or live genealogy if snapshot missing.
    if (cycleId < currentCycle) {
      const dbTree = await treeFromDb(userId, level, cycleId);
      if (dbTree && dbTree.boardFilled > 0) {
        return { ...dbTree, totalEarned, totalCycles: reinvestCount, slot2Opened };
      }

      const board = await readGenealogyBoard(wallet, level);
      return packTree({
        userId,
        address: wallet,
        level,
        cycle: cycleId,
        active: true,
        filledSpots: board.filled,
        completed: true,
        slot2Opened,
        totalEarned,
        totalCycles: reinvestCount,
        slots: board.slots,
      });
    }

    // Post-recycle cycles → cycle-1 overflow members in the 14-slot tree.
    if (reinvestCount > 0 && cycleId === currentCycle) {
      const dbTree = await treeFromDb(userId, level, cycleId);
      if (dbTree && dbTree.boardFilled > 0) {
        return { ...dbTree, totalEarned, totalCycles: reinvestCount, slot2Opened };
      }
      return treeFromCycleOverflow(
        userId,
        level,
        cycleId,
        reinvestCount,
        currentCycle,
        wallet,
        slot2Opened,
        totalEarned
      );
    }

    // Cycle 1 (no recycle yet) → live genealogy board from chain.
    const board = await readGenealogyBoard(wallet, level);
    return packTree({
      userId,
      address: wallet,
      level,
      cycle: cycleId,
      active: true,
      filledSpots: board.filled,
      completed: board.completed,
      slot2Opened,
      totalEarned,
      totalCycles: reinvestCount,
      slots: board.slots,
    });
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
    const cycleInfo = active ? await chainCycleInfo(userId, level) : null;
    const reinvestCount = cycleInfo?.reinvestCount ?? 0;
    if (cycleInfo) currentCycle = cycleInfo.currentCycle;

    for (let c = 1; c <= currentCycle; c++) {
      let filled = 0;
      let completed = false;
      let slot2Opened = false;

      const status = await prisma.matrixCoreCycle.findUnique({
        where: { matrixOwnerId_level_cycleId: { matrixOwnerId: userId, level, cycleId: c } },
      });
      slot2Opened = status?.slot2Opened ?? false;

      if (c < currentCycle) {
        filled = 14;
        completed = true;
      } else if (reinvestCount === 0 && cycleInfo) {
        const board = await readGenealogyBoard(cycleInfo.wallet, level);
        filled = board.filled;
        completed = board.completed;
      } else if (c === currentCycle && reinvestCount > 0) {
        const overflow = await overflowMembersForCycle(
          userId,
          level,
          c,
          reinvestCount,
          currentCycle
        );
        filled = overflow.length;
        completed = filled >= MATRIX_SIZE;
      } else {
        filled = await prisma.matrixCorePosition.count({
          where: {
            matrixOwnerId: userId,
            level,
            cycleId: c,
            position: { lte: MATRIX_SIZE },
          },
        });
        completed = filled >= MATRIX_SIZE;
      }

      if (!slot2Opened && c === 1 && level === 1) {
        try {
          slot2Opened = Boolean(await m.isUserSlotActive(userId, 2));
        } catch {
          /* ignore */
        }
      }

      cycles.push({ cycle: c, filled, completed, slot2Opened });
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
