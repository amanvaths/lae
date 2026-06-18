import type { TransactionClient } from "../lib/prisma.js";
import {
  getClubWithdrawAmount,
  getClubReinvestAmount,
  CLUB_PACKAGES,
} from "../config/packages.js";
import { creditWallet, appendLedgerEntry } from "./income.engine.js";
import { createClubRebirth } from "./rebirth.engine.js";
import { handleClubAutoUpgrade } from "./auto-upgrade.engine.js";
import { lockClubMatrix, lockClubPackage } from "../lib/row-lock.js";
import { cycleIdempotencyKey, incomeIdempotencyKey } from "../lib/idempotency.js";
import { withIdempotency } from "../lib/idempotency.js";
import { processFirstLineBonusForSponsorChain } from "./first-line-bonus.engine.js";

export async function processClubCycleCompletion(
  tx: TransactionClient,
  matrixId: string
): Promise<void> {
  const idempotencyKey = cycleIdempotencyKey(matrixId);

  await withIdempotency(tx, idempotencyKey, "CYCLE_COMPLETION", async () => {
    await lockClubMatrix(tx, matrixId);

    const matrix = await tx.clubMatrix.findUniqueOrThrow({
      where: { id: matrixId },
      include: { owner: true },
    });

    if (matrix.status === "CYCLE_COMPLETE") return null;

    const packageLevel = matrix.packageLevel;
    const withdrawAmount = getClubWithdrawAmount(packageLevel);
    const reinvestAmount = getClubReinvestAmount(packageLevel);
    const idempotencyBase = `club-cycle-${matrixId}`;

    await tx.clubMatrix.update({
      where: { id: matrixId },
      data: {
        status: "CYCLE_COMPLETE",
        completedAt: new Date(),
        version: { increment: 1 },
      },
    });

    await lockClubPackage(tx, matrix.ownerId, packageLevel);

    const userPackage = await tx.userClubPackage.findUnique({
      where: {
        userId_packageLevel: { userId: matrix.ownerId, packageLevel },
      },
    });

    const cyclesCompleted = (userPackage?.cyclesCompleted ?? 0) + 1;

    if (userPackage) {
      await tx.userClubPackage.update({
        where: { id: userPackage.id },
        data: { cyclesCompleted },
      });
    }

    const isFirstCycle = cyclesCompleted === 1;
    const nextLevel = packageLevel + 1;
    const hasNextPackage =
      nextLevel <= CLUB_PACKAGES.length &&
      !!(await tx.userClubPackage.findUnique({
        where: {
          userId_packageLevel: { userId: matrix.ownerId, packageLevel: nextLevel },
        },
      }));

    if (isFirstCycle && nextLevel <= CLUB_PACKAGES.length && !hasNextPackage) {
      await handleClubAutoUpgrade(tx, matrix.ownerId, packageLevel, withdrawAmount, idempotencyBase);
    } else {
      await creditWallet(tx, {
        userId: matrix.ownerId,
        amount: withdrawAmount,
        type: "CYCLE",
        packageLevel,
        matrixType: "CLUB",
        matrixId,
        idempotencyKey: incomeIdempotencyKey("CYCLE", matrixId, "withdraw"),
      });
    }

    await appendLedgerEntry(tx, {
      userId: matrix.ownerId,
      amount: reinvestAmount,
      type: "REBIRTH",
      packageLevel,
      matrixType: "CLUB",
      matrixId,
      idempotencyKey: incomeIdempotencyKey("REBIRTH", matrixId, "reinvest"),
      metadata: { reinvest: true },
    });

    await createClubRebirth(tx, matrix.ownerId, packageLevel, matrixId, reinvestAmount);

    await processFirstLineBonusForSponsorChain(tx, matrix.ownerId, "CLUB", "cycle_completion");

    await tx.matrixOperationLog.create({
      data: {
        userId: matrix.ownerId,
        operation: "CYCLE_COMPLETION",
        matrixType: "CLUB",
        matrixId,
        packageLevel,
        idempotencyKey: `${idempotencyBase}-log`,
        payload: { withdrawAmount, reinvestAmount, cyclesCompleted },
      },
    });

    return { withdrawAmount, reinvestAmount };
  });
}

export async function processPilotCycleCompletion(
  tx: TransactionClient,
  matrixId: string,
  secondSlotUserId: string
): Promise<void> {
  const idempotencyKey = cycleIdempotencyKey(matrixId);

  await withIdempotency(tx, idempotencyKey, "CYCLE_COMPLETION", async () => {
    const { lockPilotMatrix } = await import("../lib/row-lock.js");
    await lockPilotMatrix(tx, matrixId);

    const matrix = await tx.pilotMatrix.findUniqueOrThrow({
      where: { id: matrixId },
      include: { owner: { include: { sponsor: true } } },
    });

    if (matrix.status === "CYCLE_COMPLETE") return null;

    const { getPilotPoolAmount } = await import("../config/packages.js");
    const poolAmount = getPilotPoolAmount(matrix.packageLevel);
    const idempotencyBase = `pilot-cycle-${matrixId}`;

    await tx.pilotMatrix.update({
      where: { id: matrixId },
      data: {
        status: "CYCLE_COMPLETE",
        completedAt: new Date(),
        slotsFilled: 2,
        version: { increment: 1 },
      },
    });

    const userPackage = await tx.userPilotPackage.findUnique({
      where: {
        userId_packageLevel: { userId: matrix.ownerId, packageLevel: matrix.packageLevel },
      },
    });

    const cyclesCompleted = (userPackage?.cyclesCompleted ?? 0) + 1;

    if (userPackage) {
      await tx.userPilotPackage.update({
        where: { id: userPackage.id },
        data: { cyclesCompleted },
      });
    }

    const uplineId = matrix.owner.sponsorId;
    if (uplineId) {
      await creditWallet(tx, {
        userId: uplineId,
        amount: poolAmount,
        type: "PILOT_CYCLE",
        packageLevel: matrix.packageLevel,
        matrixType: "PILOT",
        matrixId,
        sourceUserId: secondSlotUserId,
        idempotencyKey: incomeIdempotencyKey("PILOT_CYCLE", matrixId, "upline"),
      });
    }

    const { handlePilotAutoUpgrade } = await import("./auto-upgrade.engine.js");
    await handlePilotAutoUpgrade(
      tx,
      matrix.ownerId,
      matrix.packageLevel,
      cyclesCompleted,
      idempotencyBase,
      matrix.owner.sponsorId ?? undefined
    );

    const { createPilotRebirth } = await import("./rebirth.engine.js");
    await createPilotRebirth(tx, matrix.ownerId, matrix.packageLevel, matrixId);

    await processFirstLineBonusForSponsorChain(tx, matrix.ownerId, "PILOT", "cycle_completion");

    return { poolAmount, cyclesCompleted };
  });
}

export async function processPilotFirstSlot(
  tx: TransactionClient,
  matrixId: string,
  slotUserId: string
): Promise<void> {
  const { lockPilotMatrix } = await import("../lib/row-lock.js");
  await lockPilotMatrix(tx, matrixId);

  const matrix = await tx.pilotMatrix.findUniqueOrThrow({ where: { id: matrixId } });

  const { getPilotPoolAmount } = await import("../config/packages.js");
  const poolAmount = getPilotPoolAmount(matrix.packageLevel);

  await creditWallet(tx, {
    userId: matrix.ownerId,
    amount: poolAmount,
    type: "PILOT_CYCLE",
    packageLevel: matrix.packageLevel,
    matrixType: "PILOT",
    matrixId,
    sourceUserId: slotUserId,
    idempotencyKey: incomeIdempotencyKey("PILOT_SLOT1", matrixId, slotUserId),
  });

  await tx.pilotMatrix.update({
    where: { id: matrixId },
    data: { slotsFilled: 1, version: { increment: 1 } },
  });
}
