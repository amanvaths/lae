import type { TransactionClient } from "../lib/prisma.js";
import { CLUB_PACKAGES, PILOT_PACKAGES } from "../config/packages.js";
import { creditWallet, appendLedgerEntry } from "./income.engine.js";
import { createClubMatrixForOwner } from "./placement.engine.js";
import { createPilotMatrixForOwner } from "./pilot.engine.js";
import { routePilotIncentive } from "./pilot-incentive.engine.js";
import { upgradeIdempotencyKey } from "../lib/idempotency.js";
import { withIdempotency } from "../lib/idempotency.js";

export async function handleClubAutoUpgrade(
  tx: TransactionClient,
  userId: string,
  currentLevel: number,
  withdrawAmount: number,
  idempotencyBase: string
): Promise<void> {
  const nextLevel = currentLevel + 1;
  const upgradeKey = upgradeIdempotencyKey(userId, currentLevel, nextLevel);

  await withIdempotency(tx, upgradeKey, "AUTO_UPGRADE", async () => {
    if (nextLevel > CLUB_PACKAGES.length) {
      await creditWallet(tx, {
        userId,
        amount: withdrawAmount,
        type: "CYCLE",
        packageLevel: currentLevel,
        matrixType: "CLUB",
        idempotencyKey: `${idempotencyBase}-withdraw-max`,
      });
      return null;
    }

    await tx.userClubPackage.create({
      data: { userId, packageLevel: nextLevel, isManual: false },
    });

    await appendLedgerEntry(tx, {
      userId,
      amount: withdrawAmount,
      type: "UPGRADE",
      packageLevel: nextLevel,
      matrixType: "CLUB",
      idempotencyKey: `${idempotencyBase}-upgrade`,
      metadata: { fromLevel: currentLevel, toLevel: nextLevel, autoUpgrade: true },
    });

    await createClubMatrixForOwner(tx, userId, nextLevel, false);

    await tx.matrixOperationLog.create({
      data: {
        userId,
        operation: "AUTO_UPGRADE",
        matrixType: "CLUB",
        packageLevel: nextLevel,
        idempotencyKey: `${upgradeKey}-log`,
        payload: { fromLevel: currentLevel, toLevel: nextLevel },
      },
    });

    return { fromLevel: currentLevel, toLevel: nextLevel };
  });
}

/**
 * Pilot auto-upgrade per PDF:
 * - Cycle 1: owner already received slot-1 payment; NO additional payout on completion
 * - Cycles 2–3: auto-upgrade to next package (no incentive on auto-upgrade)
 * - Cycle 4+: wallet credit to owner
 */
export async function handlePilotAutoUpgrade(
  tx: TransactionClient,
  userId: string,
  packageLevel: number,
  cyclesCompleted: number,
  idempotencyBase: string,
  sponsorId?: string
): Promise<void> {
  const { getPilotPoolAmount } = await import("../config/packages.js");
  const poolAmount = getPilotPoolAmount(packageLevel);

  // Cycle 1: slot-1 already paid owner — no duplicate payout
  if (cyclesCompleted === 1) {
    return;
  }

  if (cyclesCompleted === 2 || cyclesCompleted === 3) {
    const nextLevel = packageLevel + 1;
    const upgradeKey = upgradeIdempotencyKey(userId, packageLevel, nextLevel);

    await withIdempotency(tx, upgradeKey, "AUTO_UPGRADE", async () => {
      if (nextLevel > PILOT_PACKAGES.length) {
        await creditWallet(tx, {
          userId,
          amount: poolAmount,
          type: "PILOT_CYCLE",
          packageLevel,
          matrixType: "PILOT",
          idempotencyKey: `${idempotencyBase}-max-level`,
        });
        return null;
      }

      const hasNext = await tx.userPilotPackage.findUnique({
        where: { userId_packageLevel: { userId, packageLevel: nextLevel } },
      });

      if (hasNext) {
        await creditWallet(tx, {
          userId,
          amount: poolAmount,
          type: "PILOT_CYCLE",
          packageLevel,
          matrixType: "PILOT",
          idempotencyKey: `${idempotencyBase}-already-owned`,
        });
        return null;
      }

      await tx.userPilotPackage.create({
        data: { userId, packageLevel: nextLevel, isManual: false },
      });

      await appendLedgerEntry(tx, {
        userId,
        amount: poolAmount,
        type: "UPGRADE",
        packageLevel: nextLevel,
        matrixType: "PILOT",
        idempotencyKey: `${idempotencyBase}-auto-upgrade`,
        metadata: { fromLevel: packageLevel, toLevel: nextLevel, cycle: cyclesCompleted, autoUpgrade: true },
      });

      const matrix = await createPilotMatrixForOwner(tx, userId, nextLevel);
      void matrix;
      // No pilot incentive on auto-upgrade (PDF: manual only)

      return { fromLevel: packageLevel, toLevel: nextLevel };
    });
    return;
  }

  await creditWallet(tx, {
    userId,
    amount: poolAmount,
    type: "PILOT_CYCLE",
    packageLevel,
    matrixType: "PILOT",
    idempotencyKey: `${idempotencyBase}-cycle${cyclesCompleted}`,
  });
  void sponsorId;
}

/** Manual pilot upgrade — applies 1 DAI incentive */
export async function handlePilotManualUpgrade(
  tx: TransactionClient,
  userId: string,
  sponsorId: string,
  packageLevel: number,
  referenceId: string
): Promise<void> {
  await tx.userPilotPackage.upsert({
    where: { userId_packageLevel: { userId, packageLevel } },
    create: { userId, packageLevel, isManual: true },
    update: { isManual: true },
  });

  await createPilotMatrixForOwner(tx, userId, packageLevel);

  await routePilotIncentive(tx, {
    buyerUserId: userId,
    sponsorId,
    packageLevel,
    isManual: true,
    source: "manual_upgrade",
    referenceId,
  });
}
