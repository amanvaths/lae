/** Club Matrix package levels (DAI) */
export const CLUB_PACKAGES = [
    5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240,
];
/** Pilot Matrix package levels (DAI) — total contribution */
export const PILOT_PACKAGES = [
    26, 51, 101, 201, 401, 801, 1601, 3201,
];
/** Pilot pool allocation (DAI to pool per package) */
export const PILOT_POOL_AMOUNTS = [
    25, 50, 100, 200, 400, 800, 1600, 3200,
];
/** 1 DAI incentive per Pilot package (manual purchase/upgrade only) */
export const PILOT_INCENTIVE_DAI = 1;
/** Direct referrals required to unlock first-line member bonus */
export const DIRECT_REFERRALS_FOR_FIRST_LINE_BONUS = 4;
export const CLUB_CYCLE_MULTIPLIER = 3;
export const CLUB_WITHDRAW_RATIO = 2 / 3;
export const CLUB_REINVEST_RATIO = 1 / 3;
export const CLUB_TOKEN_WELCOME_PERCENT = 0.5;
export const CLUB_TOKEN_DIRECT_PERCENT = 0.1;
export const PILOT_TOKEN_WELCOME_PERCENT = 1.0;
export const PILOT_TOKEN_DIRECT_PERCENT = 0.1;
export const QUALIFIED_REFERRAL_PACKAGE = 4;
export const SPIN_COUPONS_PER_QUALIFIED = 5;
export const SPIN_REWARDS = {
    NO_TOKEN: 0,
    TOKEN_10: 10,
    TOKEN_200: 200,
    TOKEN_2000: 2000,
    TOKEN_10000: 10000,
    TOKEN_100000: 100000,
};
export const STAKING_DURATION_DAYS = 365;
export const STAKING_MIN_TOKENS = 5_000_000;
export const STAKING_MIN_CLUB_LEVEL = 10;
export const CLUB_POSITIONS = [
    "LEFT",
    "RIGHT",
    "LEFT_CHILD",
    "RIGHT_CHILD",
];
export const PILOT_POSITIONS = ["SLOT_1", "SLOT_2"];
export function getClubPackageAmount(level) {
    const amount = CLUB_PACKAGES[level - 1];
    if (!amount)
        throw new Error(`Invalid club package level: ${level}`);
    return amount;
}
export function getPilotPackageAmount(level) {
    const amount = PILOT_PACKAGES[level - 1];
    if (!amount)
        throw new Error(`Invalid pilot package level: ${level}`);
    return amount;
}
export function getPilotPoolAmount(level) {
    const amount = PILOT_POOL_AMOUNTS[level - 1];
    if (!amount)
        throw new Error(`Invalid pilot package level: ${level}`);
    return amount;
}
export function getClubCycleReward(packageLevel) {
    return getClubPackageAmount(packageLevel) * CLUB_CYCLE_MULTIPLIER;
}
export function getClubWithdrawAmount(packageLevel) {
    return getClubCycleReward(packageLevel) * CLUB_WITHDRAW_RATIO;
}
export function getClubReinvestAmount(packageLevel) {
    return getClubCycleReward(packageLevel) * CLUB_REINVEST_RATIO;
}
//# sourceMappingURL=packages.js.map