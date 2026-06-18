import { getClubPackageAmount, getPilotPackageAmount, } from "../config/packages.js";
import { getClubSltWelcome, getClubSltDirect, getPilotSltWelcome, getPilotSltDirect, } from "../config/slt-rewards.js";
import { getTokenRewardConfig } from "../services/admin-config.service.js";
import { creditTokens, appendLedgerEntry } from "./income.engine.js";
import { tokenRewardIdempotencyKey } from "../lib/idempotency.js";
export async function resolveTokenAmount(tx, kind, matrixType, packageLevel) {
    const config = await getTokenRewardConfig(tx);
    if (config.mode === "FIXED_SLT") {
        if (matrixType === "CLUB") {
            if (kind === "WELCOME_AIRDROP")
                return getClubSltWelcome(packageLevel);
            return getClubSltDirect(packageLevel);
        }
        if (kind === "WELCOME_AIRDROP")
            return getPilotSltWelcome(packageLevel);
        return getPilotSltDirect(packageLevel);
    }
    const packageAmount = matrixType === "CLUB"
        ? getClubPackageAmount(packageLevel)
        : getPilotPackageAmount(packageLevel);
    if (matrixType === "CLUB") {
        const pct = kind === "WELCOME_AIRDROP" ? config.clubWelcomePercent : config.clubDirectPercent;
        return packageAmount * pct;
    }
    const pct = kind === "WELCOME_AIRDROP" ? config.pilotWelcomePercent : config.pilotDirectPercent;
    return packageAmount * pct;
}
async function recordTokenReward(tx, userId, tokenAmount, rewardType, packageLevel, matrixType, idempotencyKey, sourceUserId) {
    await creditTokens(tx, userId, tokenAmount, idempotencyKey);
    await tx.tokenReward.create({
        data: {
            userId,
            amount: tokenAmount,
            rewardType,
            packageLevel,
            matrixType,
            sourceUserId,
            idempotencyKey,
        },
    });
    await appendLedgerEntry(tx, {
        userId,
        amount: 0,
        tokenAmount,
        type: "TOKEN_AIRDROP",
        packageLevel,
        matrixType,
        sourceUserId,
        idempotencyKey: `ledger-${idempotencyKey}`,
        metadata: { rewardType },
    });
}
export async function distributeWelcomeTokenReward(tx, userId, packageLevel, matrixType) {
    const idempotencyKey = tokenRewardIdempotencyKey(userId, "WELCOME_AIRDROP", `${matrixType}-${packageLevel}`);
    const existing = await tx.tokenReward.findUnique({ where: { idempotencyKey } });
    if (existing)
        return Number(existing.amount);
    const tokenAmount = await resolveTokenAmount(tx, "WELCOME_AIRDROP", matrixType, packageLevel);
    await recordTokenReward(tx, userId, tokenAmount, "WELCOME_AIRDROP", packageLevel, matrixType, idempotencyKey);
    return tokenAmount;
}
export async function distributeDirectReferralTokenReward(tx, sponsorId, referralUserId, packageLevel, matrixType) {
    const idempotencyKey = tokenRewardIdempotencyKey(sponsorId, "DIRECT_REFERRAL", `${referralUserId}-${matrixType}-${packageLevel}`);
    const existing = await tx.tokenReward.findUnique({ where: { idempotencyKey } });
    if (existing)
        return Number(existing.amount);
    const tokenAmount = await resolveTokenAmount(tx, "DIRECT_REFERRAL", matrixType, packageLevel);
    await recordTokenReward(tx, sponsorId, tokenAmount, "DIRECT_REFERRAL", packageLevel, matrixType, idempotencyKey, referralUserId);
    return tokenAmount;
}
/** @deprecated Use processFirstLineMemberBonus — kept for backward compatibility */
export async function distributeDirectReferralLineBonus(tx, userId, _referralUserId, packageLevel, matrixType = "CLUB") {
    const { processFirstLineMemberBonus } = await import("./first-line-bonus.engine.js");
    await processFirstLineMemberBonus(tx, userId, matrixType, "qualification");
    void packageLevel;
}
//# sourceMappingURL=token-reward.engine.js.map