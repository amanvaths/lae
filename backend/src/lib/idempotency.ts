import type { IdempotencyOperation } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { TransactionClient } from "./prisma.js";
import { AppError } from "../utils/helpers.js";

const DEFAULT_TTL_HOURS = 72;

export class IdempotencyConflictError extends AppError {
  constructor(key: string) {
    super(409, `Operation already completed: ${key}`, "IDEMPOTENCY_CONFLICT");
  }
}

/**
 * Acquire idempotency lock. Returns cached result if already COMPLETED.
 * Throws if another request holds PENDING (race protection via unique constraint).
 */
export async function acquireIdempotency(
  tx: TransactionClient,
  key: string,
  operation: IdempotencyOperation
): Promise<{ alreadyCompleted: boolean; result: Prisma.JsonValue | null }> {
  const existing = await tx.idempotencyKey.findUnique({ where: { key } });

  if (existing?.status === "COMPLETED") {
    return { alreadyCompleted: true, result: existing.result };
  }

  if (existing?.status === "FAILED") {
    await tx.idempotencyKey.delete({ where: { key } });
  } else if (existing?.status === "PENDING") {
    throw new AppError(409, "Operation in progress", "IDEMPOTENCY_IN_PROGRESS");
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + DEFAULT_TTL_HOURS);

  await tx.idempotencyKey.create({
    data: { key, operation, status: "PENDING", expiresAt },
  });

  return { alreadyCompleted: false, result: null };
}

export async function completeIdempotency(
  tx: TransactionClient,
  key: string,
  result?: Prisma.InputJsonValue
): Promise<void> {
  await tx.idempotencyKey.update({
    where: { key },
    data: { status: "COMPLETED", result: result ?? undefined },
  });
}

export async function failIdempotency(tx: TransactionClient, key: string): Promise<void> {
  await tx.idempotencyKey.update({
    where: { key },
    data: { status: "FAILED" },
  });
}

/**
 * Wrap an operation with full idempotency protection.
 * Safe to retry — duplicate calls return cached result without re-executing.
 */
export async function withIdempotency<T>(
  tx: TransactionClient,
  key: string,
  operation: IdempotencyOperation,
  fn: () => Promise<T>
): Promise<T> {
  const { alreadyCompleted, result } = await acquireIdempotency(tx, key, operation);

  if (alreadyCompleted) {
    return result as T;
  }

  try {
    const output = await fn();
    await completeIdempotency(tx, key, output as Prisma.InputJsonValue);
    return output;
  } catch (err) {
    await failIdempotency(tx, key);
    throw err;
  }
}

export function purchaseIdempotencyKey(txHash: string, matrixType: string, level: number): string {
  return `purchase:${matrixType}:${level}:${txHash}`;
}

export function cycleIdempotencyKey(matrixId: string): string {
  return `cycle:${matrixId}`;
}

export function rebirthIdempotencyKey(parentMatrixId: string, cycleNumber: number): string {
  return `rebirth:${parentMatrixId}:${cycleNumber}`;
}

export function upgradeIdempotencyKey(userId: string, fromLevel: number, toLevel: number): string {
  return `upgrade:${userId}:${fromLevel}:${toLevel}`;
}

export function incomeIdempotencyKey(type: string, matrixId: string, suffix: string): string {
  return `income:${type}:${matrixId}:${suffix}`;
}

export function withdrawalIdempotencyKey(withdrawalId: string): string {
  return `withdraw:${withdrawalId}`;
}

export function tokenRewardIdempotencyKey(userId: string, rewardType: string, ref: string): string {
  return `token:${userId}:${rewardType}:${ref}`;
}

export function placementIdempotencyKey(userId: string, matrixType: string, level: number): string {
  return `placement:${userId}:${matrixType}:${level}`;
}
