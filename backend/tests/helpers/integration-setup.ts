import { prisma } from "../../src/lib/prisma.js";
import { registerUser } from "../../src/modules/auth/auth.service.js";
import { executePackagePurchase } from "../../src/services/matrix-orchestrator.service.js";
import type { MatrixType, IncomeType } from "@prisma/client";

const E2E_WALLET_PREFIX = "0xe2e";

let walletCounter = 0;

export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export function nextTestWallet(): string {
  walletCounter += 1;
  const suffix = walletCounter.toString(16).padStart(38, "0");
  return `${E2E_WALLET_PREFIX}${suffix}`;
}

export async function ensureRootUser(): Promise<{ id: string; referralCode: string }> {
  const rootWallet = "0x0000000000000000000000000000000000000001";
  let root = await prisma.user.findFirst({ where: { walletAddress: rootWallet } });

  if (!root) {
    root = await prisma.user.create({
      data: {
        walletAddress: rootWallet,
        referralCode: "SENSOROOT",
        username: "SENSO Root",
        isAdmin: true,
        treePath: "/",
        treeDepth: 1,
        wallet: { create: {} },
      },
    });
    const treePath = `/${root.id}/`;
    root = await prisma.user.update({
      where: { id: root.id },
      data: { treePath, treeDepth: 1 },
    });
  }

  return { id: root.id, referralCode: root.referralCode };
}

export async function registerTestUser(
  sponsorReferralCode: string,
  walletAddress?: string
) {
  const wallet = walletAddress ?? nextTestWallet();
  const user = await registerUser(wallet, sponsorReferralCode);
  return user;
}

export async function purchaseClub(userId: string, sponsorId: string, level = 1, txHash?: string) {
  await executePackagePurchase({
    userId,
    sponsorId,
    packageLevel: level,
    matrixType: "CLUB",
    txHash: txHash ?? `club-${userId}-${level}-${Date.now()}`,
    isManual: true,
  });
}

export async function purchasePilot(userId: string, sponsorId: string, level = 1, txHash?: string) {
  await executePackagePurchase({
    userId,
    sponsorId,
    packageLevel: level,
    matrixType: "PILOT",
    txHash: txHash ?? `pilot-${userId}-${level}-${Date.now()}`,
    isManual: true,
  });
}

export async function getWallet(userId: string) {
  return prisma.wallet.findUniqueOrThrow({ where: { userId } });
}

export async function getLedgerByType(userId: string, type: IncomeType) {
  return prisma.incomeLedger.findMany({ where: { userId, type }, orderBy: { createdAt: "asc" } });
}

export async function countLedgerByType(userId: string, type: IncomeType): Promise<number> {
  return prisma.incomeLedger.count({ where: { userId, type } });
}

export async function enableSponsorPayments(clubPercent = 0.1, pilotPercent = 0.1) {
  await prisma.systemConfig.upsert({
    where: { key: "sponsor_payment" },
    create: {
      key: "sponsor_payment",
      value: { enabled: true, clubPercent, pilotPercent },
    },
    update: {
      value: { enabled: true, clubPercent, pilotPercent },
    },
  });
}

export async function disableSponsorPayments() {
  await prisma.systemConfig.upsert({
    where: { key: "sponsor_payment" },
    create: {
      key: "sponsor_payment",
      value: { enabled: false, clubPercent: 0, pilotPercent: 0 },
    },
    update: {
      value: { enabled: false, clubPercent: 0, pilotPercent: 0 },
    },
  });
}

export async function cleanupE2EUsers(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { walletAddress: { startsWith: E2E_WALLET_PREFIX } },
    select: { id: true },
  });

  if (users.length === 0) return;

  const ids = users.map((u) => u.id);
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

export async function getClubMatrixForOwner(ownerId: string, packageLevel: number) {
  return prisma.clubMatrix.findFirst({
    where: { ownerId, packageLevel, deletedAt: null },
    include: { placements: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPilotMatrixForOwner(ownerId: string, packageLevel: number) {
  return prisma.pilotMatrix.findFirst({
    where: { ownerId, packageLevel, deletedAt: null },
    include: { slots: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRebirthMatrices(ownerId: string, matrixType: MatrixType) {
  if (matrixType === "CLUB") {
    return prisma.clubMatrix.findMany({
      where: { ownerId, isRebirth: true, deletedAt: null },
      include: { placements: true },
    });
  }
  return prisma.pilotMatrix.findMany({
    where: { ownerId, isRebirth: true, deletedAt: null },
    include: { slots: true },
  });
}
