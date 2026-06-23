import { prisma } from "../../lib/prisma.js";
import { CHAIN, LAE_MATRIX_DEPLOY_BLOCK } from "../../config/chains.js";

/** Wipe all indexer/analytics tables and rewind cursor to matrix deploy block. */
export async function resetIndexedAnalytics(): Promise<Record<string, number>> {
  const deploy = LAE_MATRIX_DEPLOY_BLOCK;
  const cursor = deploy > 0n ? deploy - 1n : 0n;

  const [
    laePlacements,
    matrixSlots,
    laeIncome,
    laeUsers,
    referrals,
    transactions,
    clubMatrix,
    pilotMatrix,
    income,
    tokenRewards,
    withdrawals,
    spins,
    stakes,
    users,
    chainEvents,
  ] = await prisma.$transaction([
    prisma.indexedLaePlacement.deleteMany(),
    prisma.indexedMatrixSlot.deleteMany(),
    prisma.indexedLaeIncome.deleteMany(),
    prisma.indexedLaeUser.deleteMany(),
    prisma.indexedReferral.deleteMany(),
    prisma.indexedTransaction.deleteMany(),
    prisma.indexedClubMatrix.deleteMany(),
    prisma.indexedPilotMatrix.deleteMany(),
    prisma.indexedIncome.deleteMany(),
    prisma.indexedTokenReward.deleteMany(),
    prisma.indexedWithdrawal.deleteMany(),
    prisma.indexedSpin.deleteMany(),
    prisma.indexedStake.deleteMany(),
    prisma.indexedUser.deleteMany(),
    prisma.chainEvent.deleteMany(),
  ]);

  await prisma.indexerState.upsert({
    where: { id: "main" },
    create: { id: "main", chainId: CHAIN.chainId, lastBlock: cursor },
    update: { lastBlock: cursor, lastBlockHash: null, chainId: CHAIN.chainId },
  });

  console.warn(`[indexer] Analytics reset — cursor ${cursor.toString()}, laeUsers ${laeUsers.count}`);

  return {
    indexedLaeUsers: laeUsers.count,
    indexedLaeIncome: laeIncome.count,
    indexedLaePlacements: laePlacements.count,
    indexedMatrixSlots: matrixSlots.count,
    chainEvents: chainEvents.count,
    indexedUsers: users.count,
    indexedReferrals: referrals.count,
    indexedTransactions: transactions.count,
    indexedClubMatrix: clubMatrix.count,
    indexedPilotMatrix: pilotMatrix.count,
    indexedIncome: income.count,
    indexedTokenRewards: tokenRewards.count,
    indexedWithdrawals: withdrawals.count,
    indexedSpins: spins.count,
    indexedStakes: stakes.count,
    indexerCursorBlock: Number(cursor),
  };
}
