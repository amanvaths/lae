/**
 * Re-attach mc_income rows to the correct board placement (fixes L1 showing L15 amounts).
 * Run: node scripts/backfill-income-board-context.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const L1_MATRIX_SHARE = 900_000_000_000_000n;
const LEVEL1_COST = 1_000_000_000_000_000n;

function num(v) {
  return Number(v ?? 0);
}

function parseAmountWei(amount) {
  const s = String(amount ?? "0");
  return BigInt(s.includes(".") ? s.split(".")[0] : s);
}

function expectedSlot14Share(level) {
  if (level <= 0) return 0n;
  const cost = LEVEL1_COST * (2n ** BigInt(level - 1));
  return (cost * 9000n) / 10000n;
}

async function loadPlacementsForTx(txHash, fromUserId) {
  const positions = await prisma.matrixCorePosition.findMany({
    where: { txHash, occupantId: fromUserId },
    orderBy: { logIndex: "asc" },
  });
  if (positions.length) {
    return positions.map((p) => ({
      matrixOwnerId: p.matrixOwnerId,
      level: p.level,
      cycleId: p.cycleId,
      position: p.position,
      logIndex: p.logIndex,
    }));
  }

  const events = await prisma.chainEvent.findMany({
    where: { txHash, eventName: "NewUserPlace" },
    orderBy: { logIndex: "asc" },
  });
  const rows = [];
  for (const e of events) {
    const p = e.payload ?? {};
    if (num(p.user) !== fromUserId) continue;
    rows.push({
      matrixOwnerId: num(p.referrer),
      level: num(p.level) || 1,
      cycleId: num(p.cycle),
      position: num(p.spot),
      logIndex: e.logIndex,
    });
  }
  return rows;
}

function resolvePayingPlacement(placements, eventBoardLevel, amountWei, incomeLogIndex) {
  if (!placements.length) return null;

  let pool = placements;
  if (eventBoardLevel && eventBoardLevel > 0) {
    const atLevel = placements.filter((p) => p.level === eventBoardLevel);
    if (atLevel.length) pool = atLevel;
  }

  const prior = pool.filter((p) => p.logIndex < incomeLogIndex);
  if (prior.length) {
    return prior.reduce((best, p) => (p.logIndex > best.logIndex ? p : best));
  }

  if (pool.length === 1) return pool[0];

  if (eventBoardLevel && eventBoardLevel > 0 && amountWei === expectedSlot14Share(eventBoardLevel)) {
    const slot14 = pool.filter((p) => p.position === 14);
    if (slot14.length === 1) return slot14[0];
    if (slot14.length > 1) {
      return slot14.reduce((best, p) => (p.logIndex > best.logIndex ? p : best));
    }
  }

  if (amountWei <= L1_MATRIX_SHARE) {
    const non14 = pool.filter((p) => p.position !== 14);
    if (non14.length === 1) return non14[0];
  }

  if (amountWei > L1_MATRIX_SHARE) {
    const slot14 = pool.filter((p) => p.position === 14);
    if (slot14.length === 1) return slot14[0];
  }

  return pool.reduce((best, p) => (p.logIndex > best.logIndex ? p : best));
}

async function main() {
  const rows = await prisma.matrixCoreIncome.findMany({
    where: { kind: { in: ["matrix", "lapse"] } },
    select: {
      id: true,
      txHash: true,
      logIndex: true,
      fromUserId: true,
      level: true,
      amount: true,
      boardLevel: true,
      matrixOwnerId: true,
      position: true,
    },
  });

  let updated = 0;
  const placementCache = new Map();

  for (const row of rows) {
    if (!row.fromUserId) continue;
    const eventBoardLevel = row.level || null;
    const amountWei = parseAmountWei(row.amount);
    const cacheKey = `${row.txHash}:${row.fromUserId}`;
    if (!placementCache.has(cacheKey)) {
      placementCache.set(cacheKey, await loadPlacementsForTx(row.txHash, row.fromUserId));
    }
    const placement = resolvePayingPlacement(
      placementCache.get(cacheKey),
      eventBoardLevel,
      amountWei,
      row.logIndex
    );
    if (!placement) continue;

    const boardLevel = eventBoardLevel ?? placement.level;
    if (
      row.matrixOwnerId === placement.matrixOwnerId &&
      row.boardLevel === boardLevel &&
      row.position === placement.position
    ) {
      continue;
    }

    await prisma.matrixCoreIncome.update({
      where: { id: row.id },
      data: {
        matrixOwnerId: placement.matrixOwnerId,
        boardLevel,
        cycleId: placement.cycleId,
        position: placement.position,
      },
    });
    updated++;
  }

  console.log(`Backfill complete: ${updated} / ${rows.length} income rows updated`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
