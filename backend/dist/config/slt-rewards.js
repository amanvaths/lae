/** Exact SLT welcome airdrop values from SENSO Limitless PDF (50% of package in SLT) */
export const CLUB_SLT_WELCOME = [
    2.5, 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120,
];
/** Exact SLT direct-referral bonus from PDF (10% of package in SLT) */
export const CLUB_SLT_DIRECT = [
    0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024,
];
/** Pilot Matrix — 100% welcome SLT from PDF */
export const PILOT_SLT_WELCOME = [
    25, 50, 100, 200, 400, 800, 1600, 3200,
];
/** Pilot Matrix — 10% direct referral SLT from PDF */
export const PILOT_SLT_DIRECT = [
    2.5, 5, 10, 20, 40, 80, 160, 320,
];
export function getClubSltWelcome(level) {
    return CLUB_SLT_WELCOME[level - 1] ?? 0;
}
export function getClubSltDirect(level) {
    return CLUB_SLT_DIRECT[level - 1] ?? 0;
}
export function getPilotSltWelcome(level) {
    return PILOT_SLT_WELCOME[level - 1] ?? 0;
}
export function getPilotSltDirect(level) {
    return PILOT_SLT_DIRECT[level - 1] ?? 0;
}
//# sourceMappingURL=slt-rewards.js.map