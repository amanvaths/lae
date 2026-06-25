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

/** Members in genealogy tree but NOT in the fixed 14-box (cycle 2 candidates). */
async function findOffBoardMembers(
  matrixOwnerId: number,
  level: number
): Promise<Array<{ userId: number; address: string | null }>> {
  const m = matrixContract();
  const wallet = await walletForUserId(matrixOwnerId);
  if (!wallet) return [];

  const board = await readGenealogyBoard(wallet, level);
  const onBoard = new Set(board.slots.filter((s) => s.userId).map((s) => s.userId!));
  const offBoard: Array<{ userId: number; address: string | null }> = [];

  async function visit(nodeId: number): Promise<void> {
    if (nodeId <= 0) return;
    try {
      const gen = await m.genealogyOf(nodeId, level);
      const leftId = Number(gen.leftChildId ?? gen[1] ?? 0);
      const rightId = Number(gen.rightChildId ?? gen[2] ?? 0);
      for (const childId of [leftId, rightId]) {
        if (childId <= 0) continue;
        if (!onBoard.has(childId)) {
          offBoard.push({
            userId: childId,
            address: await walletForUserId(childId),
          });
        }
        await visit(childId);
      }
    } catch {
      /* skip */
    }
  }

  try {
    const rootGen = await m.genealogyOf(matrixOwnerId, level);
    const leftId = Number(rootGen.leftChildId ?? rootGen[1] ?? 0);
    const rightId = Number(rootGen.rightChildId ?? rootGen[2] ?? 0);
    if (leftId > 0) await visit(leftId);
    if (rightId > 0) await visit(rightId);
  } catch {
    return offBoard;
  }

  // Registration order (16th ID = first in cycle 2 display).
  const rows = await prisma.matrixCoreUser.findMany({
    where: { userId: { in: offBoard.map((o) => o.userId) } },
    select: { userId: true, registeredBlock: true },
    orderBy: { registeredBlock: "asc" },
  });
  const order = new Map(rows.map((r, i) => [r.userId, i]));
  offBoard.sort((a, b) => (order.get(a.userId) ?? a.userId) - (order.get(b.userId) ?? b.userId));

  return offBoard;
}

/** Map cycle-2 members sequentially into positions 1, 2, 3… */
function mapSequentialBoard(
  members: Array<{ userId: number; address: string | null }>
): { slots: MatrixSlotDTO[]; filled: number } {
  const filled = Math.min(members.length, MATRIX_SIZE);
  const completed = filled >= MATRIX_SIZE;
  const nextOpen = completed ? 0 : filled + 1;
  const slots: MatrixSlotDTO[] = [];

  for (let p = 1; p <= MATRIX_SIZE; p++) {
    const m = members[p - 1];
    if (m) {
      slots.push({
        position: p,
        state: "filled",
        userId: m.userId,
        address: m.address,
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

  return { slots, filled };
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

/** Resolve matrix tree per cycle: cycle 1 = 14-box snapshot; cycle 2+ = new members at pos 1,2,3… */
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
    const totalEarned = String(details.totalIncome ?? "0");

    // Completed cycle (e.g. Cycle 1 when now on Cycle 2) → frozen 14-box board.
    if (cycleId < currentCycle) {
      const board = await readGenealogyBoard(wallet, level);
      return treePayload(
        userId,
        wallet,
        level,
        cycleId,
        board.filled,
        true,
        slot2Opened,
        totalEarned,
        reinvestCount,
        board.slots
      );
    }

    // Active cycle 2+ → members beyond the 14-box, shown at spot 1, 2, 3…
    if (reinvestCount > 0 && cycleId === currentCycle) {
      const offBoard = await findOffBoardMembers(userId, level);
      const { slots, filled } = mapSequentialBoard(offBoard);
      return treePayload(
        userId,
        wallet,
        level,
        cycleId,
        filled,
        filled >= MATRIX_SIZE,
        slot2Opened,
        totalEarned,
        reinvestCount,
        slots
      );
    }

    // Cycle 1 (no recycle yet) → live genealogy 14-box from chain.
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
        return level === 1;
      }
    })
  );

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
