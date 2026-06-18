import { AppError } from "../utils/helpers.js";
const DEFAULT_TTL_HOURS = 72;
export class IdempotencyConflictError extends AppError {
    constructor(key) {
        super(409, `Operation already completed: ${key}`, "IDEMPOTENCY_CONFLICT");
    }
}
/**
 * Acquire idempotency lock. Returns cached result if already COMPLETED.
 * Throws if another request holds PENDING (race protection via unique constraint).
 */
export async function acquireIdempotency(tx, key, operation) {
    const existing = await tx.idempotencyKey.findUnique({ where: { key } });
    if (existing?.status === "COMPLETED") {
        return { alreadyCompleted: true, result: existing.result };
    }
    if (existing?.status === "FAILED") {
        await tx.idempotencyKey.delete({ where: { key } });
    }
    else if (existing?.status === "PENDING") {
        throw new AppError(409, "Operation in progress", "IDEMPOTENCY_IN_PROGRESS");
    }
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + DEFAULT_TTL_HOURS);
    await tx.idempotencyKey.create({
        data: { key, operation, status: "PENDING", expiresAt },
    });
    return { alreadyCompleted: false, result: null };
}
export async function completeIdempotency(tx, key, result) {
    await tx.idempotencyKey.update({
        where: { key },
        data: { status: "COMPLETED", result: result ?? undefined },
    });
}
export async function failIdempotency(tx, key) {
    await tx.idempotencyKey.update({
        where: { key },
        data: { status: "FAILED" },
    });
}
/**
 * Wrap an operation with full idempotency protection.
 * Safe to retry — duplicate calls return cached result without re-executing.
 */
export async function withIdempotency(tx, key, operation, fn) {
    const { alreadyCompleted, result } = await acquireIdempotency(tx, key, operation);
    if (alreadyCompleted) {
        return result;
    }
    try {
        const output = await fn();
        await completeIdempotency(tx, key, output);
        return output;
    }
    catch (err) {
        await failIdempotency(tx, key);
        throw err;
    }
}
export function purchaseIdempotencyKey(txHash, matrixType, level) {
    return `purchase:${matrixType}:${level}:${txHash}`;
}
export function cycleIdempotencyKey(matrixId) {
    return `cycle:${matrixId}`;
}
export function rebirthIdempotencyKey(parentMatrixId, cycleNumber) {
    return `rebirth:${parentMatrixId}:${cycleNumber}`;
}
export function upgradeIdempotencyKey(userId, fromLevel, toLevel) {
    return `upgrade:${userId}:${fromLevel}:${toLevel}`;
}
export function incomeIdempotencyKey(type, matrixId, suffix) {
    return `income:${type}:${matrixId}:${suffix}`;
}
export function withdrawalIdempotencyKey(withdrawalId) {
    return `withdraw:${withdrawalId}`;
}
export function tokenRewardIdempotencyKey(userId, rewardType, ref) {
    return `token:${userId}:${rewardType}:${ref}`;
}
export function placementIdempotencyKey(userId, matrixType, level) {
    return `placement:${userId}:${matrixType}:${level}`;
}
//# sourceMappingURL=idempotency.js.map