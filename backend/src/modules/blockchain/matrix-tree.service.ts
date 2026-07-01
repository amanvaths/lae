import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CONTRACTS } from "../../config/chains.js";
import { getIndexerProvider } from "./rpc-providers.js";
import { LAE_MATRIX_READ_ABI } from "./matrix-core-abi.js";

export const MATRIX_SIZE = 14;
export const LAST_LEVEL = 12;

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

function addrAt(rawRefs: ethers.Result | string[], i: number): string {
  const raw =
    typeof (rawRefs as ethers.Result)?.getItem === "function"
      ? (rawRefs as ethers.Result).getItem(i)
      : (rawRefs as string[])?.[i] ?? ethers.ZeroAddress;
  return String(raw).toLowerCase();
}

/** On-chain 14-slot genealogy board (usersXMatrixReferrals). */
async function readGenealogyBoard(
  wallet: string,
  level: number
): Promise<{ filled: number; completed: boolean; slots: MatrixSlotDTO[] }> {
  const m = matrixContract();
  const rawRefs = await m.usersXMatrixReferrals(wallet, level);

  let filled = 0;
  let firstEmpty = 0;
  const slots: MatrixSlotDTO[] = [];

  for (let p = 1; p <= MATRIX_SIZE; p++) {
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

  const completed = filled >= MATRIX_SIZE;
  if (!completed && firstEmpty > 0) {
    slots[firstEmpty - 1]!.state = "open";
  }

  return { filled, completed, slots };
}

function treePayload(
  userId: number,
  address: string,
  level: number,
  cycleId: number,
  filled: number,
  completed: boolean,
  slot2Opened: boolean,
  totalEarned: string,
  totalCycles: number,
  slots: MatrixSlotDTO[]
): MatrixTreeDTO {
  return {
    userId,
    address,
    level,
    cycle: cycleId,
    active: true,
    filledSpots: filled,
    completed,
    slot2Opened,
    totalEarned,
    totalCycles,
    slots,
  };
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

/**
 * Resolve matrix tree per cycle.
 *
 * New contract model: each board is a sequential 14-slot list (the owner's whole
 * downline in arrival order) that resets on recycle. So `usersXMatrixReferrals`
 * always returns the LIVE current-cycle board. Historical (completed) cycles are
 * no longer on-chain — they come from the indexed DB positions instead.
 */
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
    // Per-level earnings from usersXMatrix; fall back to global totalIncome.
    const levelEarning = matrixRow.totalEarning ?? matrixRow[5];
    const totalEarned =
      levelEarning != null && levelEarning !== 0n && String(levelEarning) !== "0"
        ? String(levelEarning)
        : String(details.totalIncome ?? "0");

    // Completed (historical) cycle → on-chain board has been reset, so rebuild
    // from indexed DB positions. Fall back to a full 14-box if DB lags.
    if (cycleId < currentCycle) {
      const dbTree = await treeFromDb(userId, level, cycleId);
      if (dbTree) return dbTree;

      const filledSlots: MatrixSlotDTO[] = Array.from({ length: MATRIX_SIZE }, (_, i) => ({
        position: i + 1,
        state: "filled" as SlotState,
        userId: null,
        address: null,
      }));
      return treePayload(
        userId,
        wallet,
        level,
        cycleId,
        MATRIX_SIZE,
        true,
        slot2Opened,
        totalEarned,
        reinvestCount,
        filledSlots
      );
    }

    // Current cycle → live sequential board straight from chain.
    const board = await readGenealogyBoard(wallet, level);
    return treePayload(
      userId,
      wallet,
      level,
      cycleId,
      board.filled,
      board.completed,
      slot2Opened,
      totalEarned,
      reinvestCount,
      board.slots
    );
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
  const levelStart = levelFilter ?? 1;
  const levelEnd = levelFilter ?? LAST_LEVEL;
  const levelCount = levelEnd - levelStart + 1;

  const activeFlags = await Promise.all(
    Array.from({ length: levelCount }, async (_, i) => {
      const level = levelStart + i;
      try {
        return Boolean(await m.isUserSlotActive(userId, level));
      } catch {
        return false;
      }
    })
  );

  const flagCount = activeFlags.filter(Boolean).length;
  if (flagCount === 0 || flagCount < levelCount) {
    try {
      const details = await m.getUserDetails(userId);
      const chainActiveCount = Number(details.activeSlotsCount ?? details[4]) || 0;
      if (chainActiveCount > flagCount) {
        for (let i = 0; i < levelCount; i++) {
          const level = levelStart + i;
          if (level <= chainActiveCount) {
            activeFlags[i] = true;
          }
        }
      }
    } catch {
      // keep per-level flags from successful reads
    }
  }

  const reinvestByLevel = await Promise.all(
    Array.from({ length: levelCount }, async (_, i) => {
      const level = levelStart + i;
      if (!activeFlags[i]) return 0;
      try {
        const matrixRow = await m.usersXMatrix(address, level);
        return Number(matrixRow.reinvestCount ?? 0);
      } catch {
        return 0;
      }
    })
  );

  const cycleRows = await prisma.matrixCoreCycle.findMany({
    where: {
      matrixOwnerId: userId,
      level: { gte: levelStart, lte: levelEnd },
    },
  });
  const cycleStatus = new Map(
    cycleRows.map((r) => [`${r.level}-${r.cycleId}`, r])
  );

  const levels: MatrixOverviewLevel[] = [];

  for (let i = 0; i < levelCount; i++) {
    const level = levelStart + i;
    const active = activeFlags[i]!;
    const reinvestCount = reinvestByLevel[i] ?? 0;
    const currentCycle = active ? reinvestCount + 1 : 1;

    const cycles: MatrixOverviewCycle[] = [];
    for (let c = 1; c <= currentCycle; c++) {
      const status = cycleStatus.get(`${level}-${c}`);
      let filled = status?.filled ?? 0;
      let completed = status?.completed ?? false;
      let slot2Opened = status?.slot2Opened ?? false;

      if (c < currentCycle) {
        filled = MATRIX_SIZE;
        completed = true;
      }

      cycles.push({ cycle: c, filled, completed, slot2Opened });
    }

    levels.push({
      level,
      active,
      currentCycle,
      cycles,
    });
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
