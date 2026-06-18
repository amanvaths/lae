import type { MatrixType } from "@prisma/client";
import type { TransactionClient } from "../lib/prisma.js";
export type TokenRewardModeType = "FIXED_SLT" | "PERCENTAGE";
export interface SponsorPaymentConfig {
    enabled: boolean;
    clubPercent: number;
    pilotPercent: number;
}
export interface TokenRewardConfig {
    mode: TokenRewardModeType;
    clubWelcomePercent: number;
    clubDirectPercent: number;
    pilotWelcomePercent: number;
    pilotDirectPercent: number;
}
export interface PilotIncentiveConfig {
    enabled: boolean;
    recipient: "sponsor" | "incentive_pool";
    incentivePoolUserId?: string;
}
export declare function getSponsorPaymentConfig(tx?: TransactionClient): Promise<SponsorPaymentConfig>;
export declare function getTokenRewardConfig(tx?: TransactionClient): Promise<TokenRewardConfig>;
export declare function getPilotIncentiveConfig(tx?: TransactionClient): Promise<PilotIncentiveConfig>;
export declare function setAdminConfig(key: string, value: object): Promise<{
    id: string;
    updatedAt: Date;
    key: string;
    value: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function calcSponsorPaymentAmount(config: SponsorPaymentConfig, matrixType: MatrixType, packageAmount: number): number;
//# sourceMappingURL=admin-config.service.d.ts.map