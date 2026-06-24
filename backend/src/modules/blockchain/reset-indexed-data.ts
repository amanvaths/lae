import { prisma } from "../../lib/prisma.js";
import { CHAIN, MATRIX_CORE_DEPLOY_BLOCK } from "../../config/chains.js";

export async function resetIndexedMatrixData() {
  const deploy = MATRIX_CORE_DEPLOY_BLOCK;
  const [
    positions,
    cycles,
    income,
    recycles,
    slots,
    users,
    events,
    idxUsers,
    idxReferrals,
    idxClub,
    idxPilot,
    idxTx,
    idxIncome,
    idxRewards,
    idxWithdrawals,
    idxSpins,
    idxStakes,
  ] = await prisma.$transaction([
    prisma.matrixCorePosition.deleteMany(),
    prisma.matrixCoreCycle.deleteMany(),
    prisma.matrixCoreIncome.deleteMany(),
    prisma.matrixCoreRecycle.deleteMany(),
    prisma.matrixCoreSlotOpening.deleteMany(),
    prisma.matrixCoreUser.deleteMany(),
    prisma.chainEvent.deleteMany(),
    prisma.indexedUser.deleteMany(),
    prisma.indexedReferral.deleteMany(),
    prisma.indexedClubMatrix.deleteMany(),
    prisma.indexedPilotMatrix.deleteMany(),
    prisma.indexedTransaction.deleteMany(),
    prisma.indexedIncome.deleteMany(),
    prisma.indexedTokenReward.deleteMany(),
    prisma.indexedWithdrawal.deleteMany(),
    prisma.indexedSpin.deleteMany(),
    prisma.indexedStake.deleteMany(),
  ]);

  await prisma.indexerState.upsert({
    where: { id: "main" },
    create: {
      chainId: CHAIN.chainId,
      lastBlock: deploy > 0n ? deploy - 1n : 0n,
    },
    update: { lastBlock: deploy > 0n ? deploy - 1n : 0n, lastBlockHash: null },
  });

  return {
    matrixCoreUsers: users.count,
    matrixCorePositions: positions.count,
    matrixCoreCycles: cycles.count,
    matrixCoreIncome: income.count,
    matrixCoreRecycles: recycles.count,
    matrixCoreSlots: slots.count,
    chainEvents: events.count,
    indexedUsers: idxUsers.count,
    indexedReferrals: idxReferrals.count,
    indexedClubMatrices: idxClub.count,
    indexedPilotMatrices: idxPilot.count,
    indexedTransactions: idxTx.count,
    indexedIncome: idxIncome.count,
    indexedTokenRewards: idxRewards.count,
    indexedWithdrawals: idxWithdrawals.count,
    indexedSpins: idxSpins.count,
    indexedStakes: idxStakes.count,
    lastBlock: (deploy > 0n ? deploy - 1n : 0n).toString(),
  };
}

/** @deprecated use resetIndexedMatrixData */
export const resetIndexedAnalytics = resetIndexedMatrixData;
