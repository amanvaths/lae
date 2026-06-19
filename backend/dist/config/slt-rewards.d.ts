/** Exact LAE welcome airdrop values from LAE PDF (50% of package in LAE) */
export declare const CLUB_SLT_WELCOME: readonly number[];
/** Exact LAE direct-referral bonus from PDF (10% of package in LAE) */
export declare const CLUB_SLT_DIRECT: readonly number[];
/** Pilot Matrix — 100% welcome LAE from PDF */
export declare const PILOT_SLT_WELCOME: readonly number[];
/** Pilot Matrix — 10% direct referral LAE from PDF */
export declare const PILOT_SLT_DIRECT: readonly number[];
export declare function getClubSltWelcome(level: number): number;
export declare function getClubSltDirect(level: number): number;
export declare function getPilotSltWelcome(level: number): number;
export declare function getPilotSltDirect(level: number): number;
//# sourceMappingURL=slt-rewards.d.ts.map