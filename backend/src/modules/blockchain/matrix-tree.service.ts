import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CONTRACTS } from "../../config/chains.js";
import { getIndexerProvider } from "./sync-engine.js";

export const MATRIX_SIZE = 14;
export const LAST_LEVEL = 15;
const ZERO = "0x0000000000000000000000000000000000000000";

const MATRIX_TREE_ABI = [
  "function lastUserId() view returns (uint256)",
  "function idToAddress(uint256) view returns (address)",
  "function addressToId(address) view returns (uint256)",
  "function isUserSlotActive(uint256 userId, uint8 slot) view returns (bool)",
  "function usersXMatrix(address userAddress, uint8 level) view returns (address currentReferrer, uint256 reinvestCount, uint256 heldTokenForUpgrade, uint256 lastSpillUnderReceiverIndex, uint256 totalTeamSize, uint256 totalEarning)",
  "function usersXMatrixReferrals(address userAddress, uint8 level) view returns (address[])",
] as const;

let contract: ethers.Contract | null = null;
function matrix(): ethers.Contract {
  if (!contract) {
    contract = new ethers.Contract(
      CONTRACTS.laeMatrix,
      MATRIX_TREE_ABI,
      getIndexerProvider()
    );
  }
  return contract;
}

export type SlotState = "locked" | "waiting" | "open" | "filled";

export interface MatrixSlotDTO {
  position: number; // 1..14
  state: SlotState;
  userId: number | null;
  address: string | null;
}

export interface MatrixTreeDTO {
  userId: number;
  address: string;
  level: number;
  cycle: number; // human cycle number (reinvestCount + 1)
  active: boolean;
  filledSpots: number;
  totalEarning: string;
  totalTeamSize: number;
  slots: MatrixSlotDTO[];
}

/** Resolve owner wallet for a userId — DB first, then contract. */
async function resolveOwnerAddress(userId: number): Promise<string | null> {
  const row = await prisma.indexedLaeUser.findUnique({
    where: { userId },
    select: { walletAddress: true },
  });
  if (row?.walletAddress) return row.walletAddress;

  try {
    const addr = String(await matrix().idToAddress(userId));
    return addr && addr !== ZERO ? addr.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Map occupant addresses → userId (DB first, contract fallback). */
async function resolveUserIds(
  addresses: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const want = addresses
    .filter((a) => a && a !== ZERO)
    .map((a) => a.toLowerCase());
  if (want.length === 0) return out;

  const rows = await prisma.indexedLaeUser.findMany({
    where: { walletAddress: { in: want } },
    select: { walletAddress: true, userId: true },
  });
  for (const r of rows) out.set(r.walletAddress.toLowerCase(), r.userId);

  for (const a of want) {
    if (out.has(a)) continue;
    try {
      const id = Number(await matrix().addressToId(a));
      if (id > 0) out.set(a, id);
    } catch {
      /* leave unresolved */
    }
  }
  return out;
}

/**
 * Build the authoritative 14-spot matrix tree for (userId, level) directly from
 * the contract (the source of truth) and persist the snapshot to the DB so the
 * frontend can render without doing any hierarchy calculation itself.
 */
export async function getMatrixTree(
  userId: number,
  level: number
): Promise<MatrixTreeDTO | { error: string }> {
  if (!Number.isInteger(userId) || userId < 1) return { error: "invalid userId" };
  if (!Number.isInteger(level) || level < 1 || level > LAST_LEVEL) {
    return { error: "invalid level" };
  }

  const owner = await resolveOwnerAddress(userId);
  if (!owner) return { error: "user not found" };

  let reinvestCount = 0;
  let totalEarning = "0";
  let totalTeamSize = 0;
  let active = false;
  let referrals: string[] = [];

  try {
    const [m, refs, slotActive] = await Promise.all([
      matrix().usersXMatrix(owner, level),
      matrix().usersXMatrixReferrals(owner, level),
      matrix().isUserSlotActive(userId, level),
    ]);
    reinvestCount = Number(m.reinvestCount ?? 0n);
    totalEarning = (m.totalEarning ?? 0n).toString();
    totalTeamSize = Number(m.totalTeamSize ?? 0n);
    active = slotActive === true;
    referrals = (refs as string[]).map((a) => String(a).toLowerCase());
  } catch (err) {
    return {
      error: `chain read failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const cycle = reinvestCount + 1;
  const idMap = await resolveUserIds(referrals);

  const filled: Array<{ spot: number; userId: number; address: string }> = [];
  const slots: MatrixSlotDTO[] = [];
  const filledCount = referrals.filter((a) => a && a !== ZERO).length;
  const nextOpenSpot = filledCount + 1;

  for (let i = 0; i < MATRIX_SIZE; i++) {
    const position = i + 1;
    const raw = referrals[i];
    const hasAddress = !!raw && raw !== ZERO;

    if (!active) {
      slots.push({ position, state: "locked", userId: null, address: null });
      continue;
    }

    if (hasAddress) {
      const occupantId = idMap.get(raw) ?? null;
      slots.push({
        position,
        state: "filled",
        userId: occupantId,
        address: raw,
      });
      if (occupantId) filled.push({ spot: position, userId: occupantId, address: raw });
      continue;
    }

    slots.push({
      position,
      state: position === nextOpenSpot ? "open" : "waiting",
      userId: null,
      address: null,
    });
  }

  await persistSnapshot(userId, level, reinvestCount, filled);

  return {
    userId,
    address: owner,
    level,
    cycle,
    active,
    filledSpots: filledCount,
    totalEarning,
    totalTeamSize,
    slots,
  };
}

/** Persist the current-cycle snapshot, replacing any stale rows. */
async function persistSnapshot(
  referrerId: number,
  level: number,
  reinvestCount: number,
  filled: Array<{ spot: number; userId: number; address: string }>
): Promise<void> {
  try {
    // Enrich with block/tx from indexed placement events when available.
    const placements = await prisma.indexedLaePlacement.findMany({
      where: { referrerId, level, cycle: reinvestCount + 1 },
      select: { spot: true, blockNumber: true, txHash: true },
    });
    const meta = new Map<number, { blockNumber: bigint; txHash: string }>();
    for (const p of placements) meta.set(p.spot, { blockNumber: p.blockNumber, txHash: p.txHash });

    await prisma.$transaction([
      prisma.indexedMatrixSlot.deleteMany({
        where: { referrerId, level, cycle: reinvestCount },
      }),
      prisma.indexedMatrixSlot.createMany({
        data: filled.map((f) => ({
          referrerId,
          level,
          cycle: reinvestCount,
          spot: f.spot,
          userId: f.userId,
          walletAddress: f.address,
          blockNumber: meta.get(f.spot)?.blockNumber ?? null,
          txHash: meta.get(f.spot)?.txHash ?? null,
        })),
        skipDuplicates: true,
      }),
    ]);
  } catch (err) {
    console.error("[matrix-tree] snapshot persist failed:", err);
  }
}

export interface MatrixOverviewLevel {
  level: number;
  active: boolean;
  filled: number;
  cycle: number;
}

/** Per-level active flag + fill count for the matrix level grid (DB-served). */
export async function getMatrixOverview(
  userId: number
): Promise<{ userId: number; address: string; levels: MatrixOverviewLevel[] } | { error: string }> {
  if (!Number.isInteger(userId) || userId < 1) return { error: "invalid userId" };
  const owner = await resolveOwnerAddress(userId);
  if (!owner) return { error: "user not found" };

  const levels: MatrixOverviewLevel[] = [];
  for (let level = 1; level <= LAST_LEVEL; level++) {
    let active = false;
    let filled = 0;
    let cycle = 1;
    try {
      const [slotActive, refs, m] = await Promise.all([
        matrix().isUserSlotActive(userId, level),
        matrix().usersXMatrixReferrals(owner, level),
        matrix().usersXMatrix(owner, level),
      ]);
      active = slotActive === true;
      filled = (refs as string[]).filter(
        (a) => a && String(a).toLowerCase() !== ZERO
      ).length;
      cycle = Number(m.reinvestCount ?? 0n) + 1;
    } catch {
      /* level read failed — leave defaults */
    }
    levels.push({ level, active, filled: active ? filled : 0, cycle });
  }

  return { userId, address: owner, levels };
}
