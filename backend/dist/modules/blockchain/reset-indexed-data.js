import { prisma } from "../../lib/prisma.js";
import { CHAIN, MATRIX_CORE_DEPLOY_BLOCK } from "../../config/chains.js";
export async function resetIndexedMatrixData() {
    const deploy = MATRIX_CORE_DEPLOY_BLOCK;
    // Delete sequentially (FK-safe order) and tolerate tables missing on older
    // production DBs — a single failed table must not abort the whole reset.
    const tables = [
        ["matrixCorePositions", () => prisma.matrixCorePosition.deleteMany()],
        ["matrixCoreCycles", () => prisma.matrixCoreCycle.deleteMany()],
        ["matrixCoreIncome", () => prisma.matrixCoreIncome.deleteMany()],
        ["matrixCoreRecycles", () => prisma.matrixCoreRecycle.deleteMany()],
        ["matrixCoreSlots", () => prisma.matrixCoreSlotOpening.deleteMany()],
        ["matrixCoreUsers", () => prisma.matrixCoreUser.deleteMany()],
        ["chainEvents", () => prisma.chainEvent.deleteMany()],
        ["indexedUsers", () => prisma.indexedUser.deleteMany()],
        ["indexedReferrals", () => prisma.indexedReferral.deleteMany()],
        ["indexedClubMatrices", () => prisma.indexedClubMatrix.deleteMany()],
        ["indexedPilotMatrices", () => prisma.indexedPilotMatrix.deleteMany()],
        ["indexedTransactions", () => prisma.indexedTransaction.deleteMany()],
        ["indexedIncome", () => prisma.indexedIncome.deleteMany()],
        ["indexedTokenRewards", () => prisma.indexedTokenReward.deleteMany()],
        ["indexedWithdrawals", () => prisma.indexedWithdrawal.deleteMany()],
        ["indexedSpins", () => prisma.indexedSpin.deleteMany()],
        ["indexedStakes", () => prisma.indexedStake.deleteMany()],
    ];
    const deleted = {};
    const errors = [];
    for (const [name, run] of tables) {
        try {
            deleted[name] = (await run()).count;
        }
        catch (err) {
            deleted[name] = "error";
            errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    await prisma.indexerState.upsert({
        where: { id: "main" },
        create: {
            id: "main",
            chainId: CHAIN.chainId,
            lastBlock: deploy > 0n ? deploy - 1n : 0n,
        },
        update: { lastBlock: deploy > 0n ? deploy - 1n : 0n, lastBlockHash: null },
    });
    return {
        ...deleted,
        errors: errors.length ? errors : undefined,
        lastBlock: (deploy > 0n ? deploy - 1n : 0n).toString(),
    };
}
/** @deprecated use resetIndexedMatrixData */
export const resetIndexedAnalytics = resetIndexedMatrixData;
//# sourceMappingURL=reset-indexed-data.js.map