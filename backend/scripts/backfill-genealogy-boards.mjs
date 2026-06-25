/**
 * One-time backfill: sync genealogy board positions from chain into mc_* tables.
 * Run after deploying the genealogy-indexing fix (existing indexer data used wrong NewUserPlace events).
 *
 *   cd backend && node scripts/backfill-genealogy-boards.mjs
 */
import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RPC = process.env.BSC_RPC_URL || "https://bsc-testnet.bnbchain.org";
const MATRIX =
  process.env.LAE_MATRIX_CONTRACT_ADDRESS ||
  "0xB65745665aFce75a7d8B804bda96B68a82adbC0D";

const ABI = [
  "function lastUserId() view returns (uint256)",
  "function idToAddress(uint256) view returns (address)",
  "function usersXMatrix(address,uint8) view returns (address,uint256,uint256,uint256,uint256,uint256)",
  "function usersXMatrixReferrals(address,uint8) view returns (address[])",
];

const provider = new ethers.JsonRpcProvider(RPC);
const contract = new ethers.Contract(MATRIX, ABI, provider);
const SIZE = 14;

function addrAt(rawRefs, i) {
  const raw =
    typeof rawRefs?.getItem === "function" ? rawRefs.getItem(i) : rawRefs?.[i] ?? ethers.ZeroAddress;
  return String(raw).toLowerCase();
}

async function addressToId(addr) {
  const id = Number(await contract.addressToId(addr));
  return id > 0 ? id : null;
}

async function backfillUser(userId) {
  const wallet = String(await contract.idToAddress(userId)).toLowerCase();
  if (!wallet || wallet === ethers.ZeroAddress) return;

  const matrixRow = await contract.usersXMatrix(wallet, 1);
  const reinvestCount = Number(matrixRow[1] ?? 0);
  const currentCycle = reinvestCount + 1;
  const rawRefs = await contract.usersXMatrixReferrals(wallet, 1);

  let filled = 0;
  const placements = [];

  for (let p = 1; p <= SIZE; p++) {
    const addr = addrAt(rawRefs, p - 1);
    if (!addr || addr === ethers.ZeroAddress) continue;
    const occId = await addressToId(addr);
    if (!occId) continue;
    filled++;
    placements.push({ position: p, occupantId: occId });
  }

  await prisma.matrixCoreUser.upsert({
    where: { userId },
    create: { userId, walletAddress: wallet },
    update: { walletAddress: wallet },
  });

  if (reinvestCount === 0) {
    for (const pl of placements) {
      await prisma.matrixCorePosition.upsert({
        where: {
          matrixOwnerId_level_cycleId_position: {
            matrixOwnerId: userId,
            level: 1,
            cycleId: 1,
            position: pl.position,
          },
        },
        create: {
          matrixOwnerId: userId,
          level: 1,
          cycleId: 1,
          position: pl.position,
          occupantId: pl.occupantId,
          blockNumber: 0n,
          txHash: "backfill",
          logIndex: 0,
        },
        update: { occupantId: pl.occupantId },
      });
    }
    await prisma.matrixCoreCycle.upsert({
      where: { matrixOwnerId_level_cycleId: { matrixOwnerId: userId, level: 1, cycleId: 1 } },
      create: {
        matrixOwnerId: userId,
        level: 1,
        cycleId: 1,
        filled,
        completed: filled >= SIZE,
      },
      update: { filled, completed: filled >= SIZE },
    });
    console.log(`User#${userId}: cycle 1 → ${filled}/${SIZE}`);
    return;
  }

  // reinvestCount >= 1: snapshot live board as completed cycle 1
  for (const pl of placements) {
    await prisma.matrixCorePosition.upsert({
      where: {
        matrixOwnerId_level_cycleId_position: {
          matrixOwnerId: userId,
          level: 1,
          cycleId: 1,
          position: pl.position,
        },
      },
      create: {
        matrixOwnerId: userId,
        level: 1,
        cycleId: 1,
        position: pl.position,
        occupantId: pl.occupantId,
        blockNumber: 0n,
        txHash: "backfill",
        logIndex: 0,
      },
      update: { occupantId: pl.occupantId },
    });
  }
  await prisma.matrixCoreCycle.upsert({
    where: { matrixOwnerId_level_cycleId: { matrixOwnerId: userId, level: 1, cycleId: 1 } },
    create: { matrixOwnerId: userId, level: 1, cycleId: 1, filled: 14, completed: true },
    update: { filled: 14, completed: true },
  });

  for (let c = 2; c <= currentCycle; c++) {
    const count = await prisma.matrixCorePosition.count({
      where: { matrixOwnerId: userId, level: 1, cycleId: c },
    });
    await prisma.matrixCoreCycle.upsert({
      where: { matrixOwnerId_level_cycleId: { matrixOwnerId: userId, level: 1, cycleId: c } },
      create: {
        matrixOwnerId: userId,
        level: 1,
        cycleId: c,
        filled: count,
        completed: count >= SIZE,
      },
      update: { filled: count, completed: count >= SIZE },
    });
  }

  console.log(`User#${userId}: cycle 1 snap ${placements.length}/${SIZE}, current cycle ${currentCycle}`);
}

const lastId = Number(await contract.lastUserId());
for (let id = 1; id <= lastId; id++) {
  try {
    await backfillUser(id);
  } catch (e) {
    console.warn(`User#${id} skip:`, e.message);
  }
}

await prisma.$disconnect();
console.log("Done.");
