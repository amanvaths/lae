import type { MatrixType } from "@prisma/client";
import type { TransactionClient } from "../lib/prisma.js";
import { runMatrixTransaction } from "../lib/transaction.js";
import {
  purchaseIdempotencyKey,
  withIdempotency,
} from "../lib/idempotency.js";
import {
  getClubPackageAmount,
  getPilotPackageAmount,
} from "../config/packages.js";
import { createClubMatrixForOwner, placeInClubMatrix } from "../engines/placement.engine.js";
import { createPilotMatrixForOwner, placeInPilotMatrix } from "../engines/pilot.engine.js";
import {
  distributeWelcomeTokenReward,
  distributeDirectReferralTokenReward,
} from "../engines/token-reward.engine.js";
import { grantSpinCouponsForQualifiedReferral } from "../engines/spin.engine.js";
import { routePilotIncentive } from "../engines/pilot-incentive.engine.js";
import { distributeSponsorPayment } from "../engines/sponsor-payment.engine.js";
import { processFirstLineBonusForSponsorChain } from "../engines/first-line-bonus.engine.js";
import { invalidateUserCaches } from "../lib/cache.js";

export interface PurchaseInput {
  userId: string;
  sponsorId: string;
  packageLevel: number;
  matrixType: MatrixType;
  txHash?: string;
  isManual?: boolean;
}

/**
 * Atomic package purchase — single Serializable transaction.
 * Rolls back entirely on any failure (placement, income, rebirth, upgrade, tokens).
 */
export async function executePackagePurchase(input: PurchaseInput): Promise<void> {
  const amount =
    input.matrixType === "CLUB"
      ? getClubPackageAmount(input.packageLevel)
      : getPilotPackageAmount(input.packageLevel);

  const idempotencyKey = purchaseIdempotencyKey(
    input.txHash ?? `${input.userId}-${input.matrixType}-${input.packageLevel}`,
    input.matrixType,
    input.packageLevel
  );

  const isManual = input.isManual ?? true;

  await runMatrixTransaction(async (tx) => {
    await withIdempotency(tx, idempotencyKey, "PACKAGE_PURCHASE", async () => {
      const existingPurchase = await tx.packagePurchase.findUnique({
        where: { idempotencyKey },
      });
      if (existingPurchase) return existingPurchase;

      await tx.packagePurchase.create({
        data: {
          userId: input.userId,
          packageLevel: input.packageLevel,
          matrixType: input.matrixType,
          amount,
          txHash: input.txHash,
          isManual,
          idempotencyKey,
        },
      });

      if (input.matrixType === "CLUB") {
        await tx.userClubPackage.upsert({
          where: { userId_packageLevel: { userId: input.userId, packageLevel: input.packageLevel } },
          create: {
            userId: input.userId,
            packageLevel: input.packageLevel,
            isManual,
            txHash: input.txHash,
          },
          update: { txHash: input.txHash, isManual },
        });
        await createClubMatrixForOwner(tx, input.userId, input.packageLevel);
        await placeInClubMatrix(tx, {
          userId: input.userId,
          sponsorId: input.sponsorId,
          packageLevel: input.packageLevel,
        });
      } else {
        await tx.userPilotPackage.upsert({
          where: { userId_packageLevel: { userId: input.userId, packageLevel: input.packageLevel } },
          create: {
            userId: input.userId,
            packageLevel: input.packageLevel,
            isManual,
            txHash: input.txHash,
          },
          update: { txHash: input.txHash, isManual },
        });
        await createPilotMatrixForOwner(tx, input.userId, input.packageLevel);
        await placeInPilotMatrix(tx, input.userId, input.sponsorId, input.packageLevel);

        if (isManual) {
          await routePilotIncentive(tx, {
            buyerUserId: input.userId,
            sponsorId: input.sponsorId,
            packageLevel: input.packageLevel,
            isManual: true,
            source: "purchase",
            referenceId: idempotencyKey,
          });
        }
      }

      await distributeSponsorPayment(
        tx,
        input.userId,
        input.sponsorId,
        input.packageLevel,
        input.matrixType,
        idempotencyKey
      );

      await distributeWelcomeTokenReward(tx, input.userId, input.packageLevel, input.matrixType);
      await distributeDirectReferralTokenReward(
        tx,
        input.sponsorId,
        input.userId,
        input.packageLevel,
        input.matrixType
      );

      await processFirstLineBonusForSponsorChain(tx, input.sponsorId, input.matrixType, "purchase");
      await processFirstLineBonusForSponsorChain(tx, input.userId, input.matrixType, "qualification");

      if (input.matrixType === "CLUB" && input.packageLevel >= 4) {
        await grantSpinCouponsForQualifiedReferral(tx, input.sponsorId, input.userId);
      }

      return { success: true };
    });
  });

  await invalidateUserCaches(input.userId);
  await invalidateUserCaches(input.sponsorId);
}

export async function executeClubPlacement(
  tx: TransactionClient,
  userId: string,
  sponsorId: string,
  packageLevel: number,
  idempotencyKey?: string
) {
  return placeInClubMatrix(tx, { userId, sponsorId, packageLevel, idempotencyKey });
}
