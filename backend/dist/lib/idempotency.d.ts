import type { IdempotencyOperation } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { TransactionClient } from "./prisma.js";
import { AppError } from "../utils/helpers.js";
export declare class IdempotencyConflictError extends AppError {
    constructor(key: string);
}
/**
 * Acquire idempotency lock. Returns cached result if already COMPLETED.
 * Throws if another request holds PENDING (race protection via unique constraint).
 */
export declare function acquireIdempotency(tx: TransactionClient, key: string, operation: IdempotencyOperation): Promise<{
    alreadyCompleted: boolean;
    result: Prisma.JsonValue | null;
}>;
export declare function completeIdempotency(tx: TransactionClient, key: string, result?: Prisma.InputJsonValue): Promise<void>;
export declare function failIdempotency(tx: TransactionClient, key: string): Promise<void>;
/**
 * Wrap an operation with full idempotency protection.
 * Safe to retry — duplicate calls return cached result without re-executing.
 */
export declare function withIdempotency<T>(tx: TransactionClient, key: string, operation: IdempotencyOperation, fn: () => Promise<T>): Promise<T>;
export declare function purchaseIdempotencyKey(txHash: string, matrixType: string, level: number): string;
export declare function cycleIdempotencyKey(matrixId: string): string;
export declare function rebirthIdempotencyKey(parentMatrixId: string, cycleNumber: number): string;
export declare function upgradeIdempotencyKey(userId: string, fromLevel: number, toLevel: number): string;
export declare function incomeIdempotencyKey(type: string, matrixId: string, suffix: string): string;
export declare function withdrawalIdempotencyKey(withdrawalId: string): string;
export declare function tokenRewardIdempotencyKey(userId: string, rewardType: string, ref: string): string;
export declare function placementIdempotencyKey(userId: string, matrixType: string, level: number): string;
//# sourceMappingURL=idempotency.d.ts.map