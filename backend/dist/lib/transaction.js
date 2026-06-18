import { prisma } from "./prisma.js";
const MATRIX_TX_OPTIONS = {
    isolationLevel: "Serializable",
    timeout: 60_000,
    maxWait: 10_000,
};
/**
 * Execute all matrix operations inside a single Serializable transaction.
 * Any failure rolls back placement, income, rebirth, auto-upgrade, and cycle completion atomically.
 */
export async function runMatrixTransaction(fn) {
    return prisma.$transaction(fn, MATRIX_TX_OPTIONS);
}
export { MATRIX_TX_OPTIONS };
//# sourceMappingURL=transaction.js.map