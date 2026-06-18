import type { TransactionClient } from "../lib/prisma.js";
import { SPIN_COUPONS_PER_QUALIFIED, QUALIFIED_REFERRAL_PACKAGE, SPIN_REWARDS } from "../config/packages.js";
import type { SpinRewardType } from "@prisma/client";
import { creditTokens } from "./income.engine.js";
import { AppError } from "../utils/helpers.js";

const SPIN_WEIGHTS: { type: SpinRewardType; weight: number }[] = [
  { type: "NO_TOKEN", weight: 50 },
  { type: "TOKEN_10", weight: 25 },
  { type: "TOKEN_200", weight: 15 },
  { type: "TOKEN_2000", weight: 7 },
  { type: "TOKEN_10000", weight: 2 },
  { type: "TOKEN_100000", weight: 1 },
];

export async function grantSpinCouponsForQualifiedReferral(
  tx: TransactionClient,
  sponsorId: string,
  referralUserId: string
): Promise<number> {
  const referralPackage = await tx.userClubPackage.findFirst({
    where: {
      userId: referralUserId,
      packageLevel: { gte: QUALIFIED_REFERRAL_PACKAGE },
    },
  });

  if (!referralPackage) return 0;

  const coupons = [];
  for (let i = 0; i < SPIN_COUPONS_PER_QUALIFIED; i++) {
    coupons.push({
      userId: sponsorId,
      source: `qualified_referral:${referralUserId}`,
    });
  }

  await tx.spinCoupon.createMany({ data: coupons });
  return SPIN_COUPONS_PER_QUALIFIED;
}

export function pickSpinReward(): { type: SpinRewardType; amount: number } {
  const totalWeight = SPIN_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of SPIN_WEIGHTS) {
    random -= entry.weight;
    if (random <= 0) {
      const amount = SPIN_REWARDS[entry.type === "NO_TOKEN" ? "NO_TOKEN" : entry.type.replace("TOKEN_", "TOKEN_") as keyof typeof SPIN_REWARDS] ?? 
        (entry.type === "TOKEN_10" ? 10 :
         entry.type === "TOKEN_200" ? 200 :
         entry.type === "TOKEN_2000" ? 2000 :
         entry.type === "TOKEN_10000" ? 10000 :
         entry.type === "TOKEN_100000" ? 100000 : 0);
      return { type: entry.type, amount };
    }
  }

  return { type: "NO_TOKEN", amount: 0 };
}

export async function executeSpin(
  tx: TransactionClient,
  userId: string,
  couponId: string
): Promise<{ rewardType: SpinRewardType; tokenAmount: number }> {
  const coupon = await tx.spinCoupon.findFirst({
    where: { id: couponId, userId, used: false },
  });

  if (!coupon) {
    throw new AppError(404, "No valid spin coupon found", "NO_COUPON");
  }

  const { type, amount } = pickSpinReward();

  await tx.spinCoupon.update({
    where: { id: couponId },
    data: { used: true, usedAt: new Date() },
  });

  await tx.spinHistory.create({
    data: {
      userId,
      couponId,
      rewardType: type,
      tokenAmount: amount,
    },
  });

  if (amount > 0) {
    await creditTokens(tx, userId, amount);
  }

  return { rewardType: type, tokenAmount: amount };
}
