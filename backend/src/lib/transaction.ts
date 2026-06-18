import { prisma, type TransactionClient } from "./prisma.js";
import type { Prisma } from "@prisma/client";

const MATRIX_TX_OPTIONS: {
  isolationLevel: Prisma.TransactionIsolationLevel;
  timeout: number;
  maxWait: number;
} = {
  isolationLevel: "Serializable",
  timeout: 60_000,
  maxWait: 10_000,
};

/**
 * Execute all matrix operations inside a single Serializable transaction.
 * Any failure rolls back placement, income, rebirth, auto-upgrade, and cycle completion atomically.
 */
export async function runMatrixTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn, MATRIX_TX_OPTIONS);
}

export { MATRIX_TX_OPTIONS };
