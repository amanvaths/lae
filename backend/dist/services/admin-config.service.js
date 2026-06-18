import { prisma } from "../lib/prisma.js";
const DEFAULT_SPONSOR = {
    enabled: true,
    clubPercent: 0,
    pilotPercent: 0,
};
const DEFAULT_TOKEN = {
    mode: "FIXED_SLT",
    clubWelcomePercent: 0.5,
    clubDirectPercent: 0.1,
    pilotWelcomePercent: 1.0,
    pilotDirectPercent: 0.1,
};
const DEFAULT_PILOT_INCENTIVE = {
    enabled: true,
    recipient: "sponsor",
};
async function readConfig(key, fallback, tx) {
    const db = tx ?? prisma;
    const row = await db.systemConfig.findUnique({ where: { key } });
    if (!row)
        return fallback;
    return { ...fallback, ...row.value };
}
export async function getSponsorPaymentConfig(tx) {
    return readConfig("sponsor_payment", DEFAULT_SPONSOR, tx);
}
export async function getTokenRewardConfig(tx) {
    return readConfig("token_reward", DEFAULT_TOKEN, tx);
}
export async function getPilotIncentiveConfig(tx) {
    return readConfig("pilot_incentive", DEFAULT_PILOT_INCENTIVE, tx);
}
export async function setAdminConfig(key, value) {
    return prisma.systemConfig.upsert({
        where: { key },
        create: { key, value },
        update: { value },
    });
}
export function calcSponsorPaymentAmount(config, matrixType, packageAmount) {
    if (!config.enabled)
        return 0;
    const pct = matrixType === "CLUB" ? config.clubPercent : config.pilotPercent;
    return Math.round(packageAmount * pct * 1e6) / 1e6;
}
//# sourceMappingURL=admin-config.service.js.map