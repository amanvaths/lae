/** Club Matrix package levels (DAI) */
export declare const CLUB_PACKAGES: readonly number[];
/** Pilot Matrix package levels (DAI) — total contribution */
export declare const PILOT_PACKAGES: readonly number[];
/** Pilot pool allocation (DAI to pool per package) */
export declare const PILOT_POOL_AMOUNTS: readonly number[];
/** 1 DAI incentive per Pilot package (manual purchase/upgrade only) */
export declare const PILOT_INCENTIVE_DAI = 1;
/** Direct referrals required to unlock first-line member bonus */
export declare const DIRECT_REFERRALS_FOR_FIRST_LINE_BONUS = 4;
export declare const CLUB_CYCLE_MULTIPLIER = 3;
export declare const CLUB_WITHDRAW_RATIO: number;
export declare const CLUB_REINVEST_RATIO: number;
export declare const CLUB_TOKEN_WELCOME_PERCENT = 0.5;
export declare const CLUB_TOKEN_DIRECT_PERCENT = 0.1;
export declare const PILOT_TOKEN_WELCOME_PERCENT = 1;
export declare const PILOT_TOKEN_DIRECT_PERCENT = 0.1;
export declare const QUALIFIED_REFERRAL_PACKAGE = 4;
export declare const SPIN_COUPONS_PER_QUALIFIED = 5;
export declare const SPIN_REWARDS: {
    readonly NO_TOKEN: 0;
    readonly TOKEN_10: 10;
    readonly TOKEN_200: 200;
    readonly TOKEN_2000: 2000;
    readonly TOKEN_10000: 10000;
    readonly TOKEN_100000: 100000;
};
export declare const STAKING_DURATION_DAYS = 365;
export declare const STAKING_MIN_TOKENS = 5000000;
export declare const STAKING_MIN_CLUB_LEVEL = 10;
export declare const CLUB_POSITIONS: readonly ["LEFT", "RIGHT", "LEFT_CHILD", "RIGHT_CHILD"];
export declare const PILOT_POSITIONS: readonly ["SLOT_1", "SLOT_2"];
export declare function getClubPackageAmount(level: number): number;
export declare function getPilotPackageAmount(level: number): number;
export declare function getPilotPoolAmount(level: number): number;
export declare function getClubCycleReward(packageLevel: number): number;
export declare function getClubWithdrawAmount(packageLevel: number): number;
export declare function getClubReinvestAmount(packageLevel: number): number;
//# sourceMappingURL=packages.d.ts.map