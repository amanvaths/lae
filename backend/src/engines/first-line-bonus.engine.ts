import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixType } from "@prisma/client";
import {
  DIRECT_REFERRALS_FOR_FIRST_LINE_BONUS,
  QUALIFIED_REFERRAL_PACKAGE,
} from "../config/packages.js";
import { creditTokens, appendLedgerEntry } from "./income.engine.js";
import { resolveTokenAmount } from "./token-reward.engine.js";
import { tokenRewardIdempotencyKey } from "../lib/idempotency.js";

/** Count direct referrals with club package >= qualification level */
export async function countQualifiedDirectReferrals(
  tx: TransactionClient,
  userId: string,
  matrixType: MatrixType
): Promise<number> {
  if (matrixType === "CLUB") {
    return tx.user.count({
      where: {
        sponsorId: userId,
        deletedAt: null,
        clubPackages: { some: { packageLevel: { gte: QUALIFIED_REFERRAL_PACKAGE } } },
      },
    });
  }
  return tx.user.count({
    where: {
      sponsorId: userId,
      deletedAt: null,
      pilotPackages: { some: {} },
    },
  });
}

export async function hasCompletedDirectReferrals(
  tx: TransactionClient,
  userId: string,
  matrixType: MatrixType
): Promise<boolean> {
  const count = await countQualifiedDirectReferrals(tx, userId, matrixType);
  return count >= DIRECT_REFERRALS_FOR_FIRST_LINE_BONUS;
}

/**
 * PDF: When user completes direct referrals, reward 10% SLT from ALL first-line members.
 * Credits the qualifying user (not upline) with 10% from each direct referral's package.
 */
export async function processFirstLineMemberBonus(
  tx: TransactionClient,
  userId: string,
  matrixType: MatrixType,
  trigger: "purchase" | "cycle_completion" | "qualification"
): Promise<number> {
  const qualified = await hasCompletedDirectReferrals(tx, userId, matrixType);
  if (!qualified) return 0;

  const firstLineMembers = await tx.user.findMany({
    where: { sponsorId: userId, deletedAt: null },
    include: {
      clubPackages: matrixType === "CLUB" ? { orderBy: { packageLevel: "desc" }, take: 1 } : false,
      pilotPackages: matrixType === "PILOT" ? { orderBy: { packageLevel: "desc" }, take: 1 } : false,
    },
  });

  let totalTokens = 0;

  for (const member of firstLineMembers) {
    const pkgLevel =
      matrixType === "CLUB"
        ? member.clubPackages[0]?.packageLevel
        : member.pilotPackages[0]?.packageLevel;

    if (!pkgLevel) continue;

    const tokenAmount = await resolveTokenAmount(tx, "DIRECT_REFERRAL", matrixType, pkgLevel);
    if (tokenAmount <= 0) continue;

    const idempotencyKey = tokenRewardIdempotencyKey(
      userId,
      "FIRST_LINE_BONUS",
      `${member.id}-${matrixType}-${pkgLevel}-${trigger}`
    );

    const existing = await tx.tokenReward.findUnique({ where: { idempotencyKey } });
    if (existing) continue;

    await creditTokens(tx, userId, tokenAmount, idempotencyKey);

    await tx.tokenReward.create({
      data: {
        userId,
        amount: tokenAmount,
        rewardType: "FIRST_LINE_BONUS",
        packageLevel: pkgLevel,
        matrixType,
        sourceUserId: member.id,
        idempotencyKey,
      },
    });

    await appendLedgerEntry(tx, {
      userId,
      amount: 0,
      tokenAmount,
      type: "FIRST_LINE_BONUS",
      packageLevel: pkgLevel,
      matrixType,
      sourceUserId: member.id,
      idempotencyKey: `ledger-${idempotencyKey}`,
      metadata: { trigger },
    });

    totalTokens += tokenAmount;
  }

  return totalTokens;
}

/** Notify upline when downline's referral qualifies — triggers upline first-line check */
export async function processFirstLineBonusForSponsorChain(
  tx: TransactionClient,
  userId: string,
  matrixType: MatrixType,
  trigger: "purchase" | "cycle_completion" | "qualification"
): Promise<void> {
  await processFirstLineMemberBonus(tx, userId, matrixType, trigger);

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { sponsorId: true },
  });
  if (user?.sponsorId) {
    await processFirstLineMemberBonus(tx, user.sponsorId, matrixType, trigger);
  }
}
