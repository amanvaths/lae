import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixType } from "@prisma/client";
export type TokenRewardKind = "WELCOME_AIRDROP" | "DIRECT_REFERRAL" | "FIRST_LINE_BONUS";
export declare function resolveTokenAmount(tx: TransactionClient, kind: TokenRewardKind, matrixType: MatrixType, packageLevel: number): Promise<number>;
export declare function distributeWelcomeTokenReward(tx: TransactionClient, userId: string, packageLevel: number, matrixType: MatrixType): Promise<number>;
export declare function distributeDirectReferralTokenReward(tx: TransactionClient, sponsorId: string, referralUserId: string, packageLevel: number, matrixType: MatrixType): Promise<number>;
/** @deprecated Use processFirstLineMemberBonus — kept for backward compatibility */
export declare function distributeDirectReferralLineBonus(tx: TransactionClient, userId: string, _referralUserId: string, packageLevel: number, matrixType?: MatrixType): Promise<void>;
//# sourceMappingURL=token-reward.engine.d.ts.map