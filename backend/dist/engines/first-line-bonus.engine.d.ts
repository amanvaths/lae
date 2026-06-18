import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixType } from "@prisma/client";
/** Count direct referrals with club package >= qualification level */
export declare function countQualifiedDirectReferrals(tx: TransactionClient, userId: string, matrixType: MatrixType): Promise<number>;
export declare function hasCompletedDirectReferrals(tx: TransactionClient, userId: string, matrixType: MatrixType): Promise<boolean>;
/**
 * PDF: When user completes direct referrals, reward 10% SLT from ALL first-line members.
 * Credits the qualifying user (not upline) with 10% from each direct referral's package.
 */
export declare function processFirstLineMemberBonus(tx: TransactionClient, userId: string, matrixType: MatrixType, trigger: "purchase" | "cycle_completion" | "qualification"): Promise<number>;
/** Notify upline when downline's referral qualifies — triggers upline first-line check */
export declare function processFirstLineBonusForSponsorChain(tx: TransactionClient, userId: string, matrixType: MatrixType, trigger: "purchase" | "cycle_completion" | "qualification"): Promise<void>;
//# sourceMappingURL=first-line-bonus.engine.d.ts.map