/** Exact LAE welcome airdrop values from LAE PDF (50% of package in LAE) */
export const CLUB_SLT_WELCOME: readonly number[] = [
  2.5, 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120,
];

/** Exact LAE direct-referral bonus from PDF (10% of package in LAE) */
export const CLUB_SLT_DIRECT: readonly number[] = [
  0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024,
];

/** Pilot Matrix — 100% welcome LAE from PDF */
export const PILOT_SLT_WELCOME: readonly number[] = [
  25, 50, 100, 200, 400, 800, 1600, 3200,
];

/** Pilot Matrix — 10% direct referral LAE from PDF */
export const PILOT_SLT_DIRECT: readonly number[] = [
  2.5, 5, 10, 20, 40, 80, 160, 320,
];

export function getClubSltWelcome(level: number): number {
  return CLUB_SLT_WELCOME[level - 1] ?? 0;
}

export function getClubSltDirect(level: number): number {
  return CLUB_SLT_DIRECT[level - 1] ?? 0;
}

export function getPilotSltWelcome(level: number): number {
  return PILOT_SLT_WELCOME[level - 1] ?? 0;
}

export function getPilotSltDirect(level: number): number {
  return PILOT_SLT_DIRECT[level - 1] ?? 0;
}
