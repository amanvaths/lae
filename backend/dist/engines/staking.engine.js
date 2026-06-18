import { STAKING_DURATION_DAYS, STAKING_MIN_TOKENS, STAKING_MIN_CLUB_LEVEL, } from "../config/packages.js";
import { AppError } from "../utils/helpers.js";
export async function createStake(tx, userId, amount, round = 1) {
    await assertStakingEligibility(tx, userId, amount);
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.tokenBalance) < amount) {
        throw new AppError(400, "Insufficient token balance for staking", "INSUFFICIENT_TOKENS");
    }
    const lockStart = new Date();
    const lockEnd = new Date(lockStart);
    lockEnd.setDate(lockEnd.getDate() + STAKING_DURATION_DAYS);
    await tx.wallet.update({
        where: { userId },
        data: {
            tokenBalance: { decrement: amount },
            lockedBalance: { increment: amount },
        },
    });
    const stake = await tx.stake.create({
        data: {
            userId,
            amount,
            lockStart,
            lockEnd,
            status: "LOCKED",
            round,
        },
    });
    return stake.id;
}
export async function assertStakingEligibility(tx, userId, amount) {
    const config = await tx.systemConfig.findUnique({ where: { key: "staking_eligibility" } });
    const minTokens = config
        ? config.value.minTokens ?? STAKING_MIN_TOKENS
        : STAKING_MIN_TOKENS;
    const minLevel = config
        ? config.value.minClubLevel ?? STAKING_MIN_CLUB_LEVEL
        : STAKING_MIN_CLUB_LEVEL;
    const highestClub = await tx.userClubPackage.findFirst({
        where: { userId },
        orderBy: { packageLevel: "desc" },
    });
    const meetsLevel = highestClub && highestClub.packageLevel >= minLevel;
    const meetsTokens = amount >= minTokens;
    if (!meetsLevel && !meetsTokens) {
        throw new AppError(403, `Staking requires club level ${minLevel}+ or ${minTokens} tokens`, "STAKING_INELIGIBLE");
    }
}
export async function completeMaturedStakes(tx) {
    const now = new Date();
    const matured = await tx.stake.findMany({
        where: { status: "LOCKED", lockEnd: { lte: now } },
    });
    for (const stake of matured) {
        await tx.stake.update({
            where: { id: stake.id },
            data: { status: "COMPLETED", completedAt: now },
        });
        await tx.wallet.update({
            where: { userId: stake.userId },
            data: {
                lockedBalance: { decrement: stake.amount },
                tokenBalance: { increment: stake.amount },
            },
        });
    }
    return matured.length;
}
//# sourceMappingURL=staking.engine.js.map