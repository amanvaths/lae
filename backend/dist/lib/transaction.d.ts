import { type TransactionClient } from "./prisma.js";
import type { Prisma } from "@prisma/client";
declare const MATRIX_TX_OPTIONS: {
    isolationLevel: Prisma.TransactionIsolationLevel;
    timeout: number;
    maxWait: number;
};
/**
 * Execute all matrix operations inside a single Serializable transaction.
 * Any failure rolls back placement, income, rebirth, auto-upgrade, and cycle completion atomically.
 */
export declare function runMatrixTransaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
export { MATRIX_TX_OPTIONS };
//# sourceMappingURL=transaction.d.ts.map