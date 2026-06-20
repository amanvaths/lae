import { prisma } from "../../lib/prisma.js";
import { serializeForJson } from "../../lib/serialize.js";
function normalizeWallet(wallet) {
    return wallet.toLowerCase();
}
export async function getDashboard(wallet) {
    const w = normalizeWallet(wallet);
    const [user, incomeSum, tokenSum, withdrawals, directCount, clubCount, pilotCount] = await Promise.all([
        prisma.indexedUser.findUnique({ where: { walletAddress: w } }),
        prisma.indexedIncome.aggregate({
            where: { recipientAddress: w },
            _sum: { amount: true },
        }),
        prisma.indexedTokenReward.aggregate({
            where: { recipientAddress: w },
            _sum: { sltAmount: true },
        }),
        prisma.indexedWithdrawal.aggregate({
            where: { walletAddress: w },
            _sum: { amount: true },
        }),
        prisma.indexedReferral.count({ where: { sponsorAddress: w } }),
        prisma.indexedClubMatrix.count({ where: { ownerAddress: w } }),
        prisma.indexedPilotMatrix.count({ where: { ownerAddress: w } }),
    ]);
    return serializeForJson({
        wallet: w,
        registered: !!user,
        sponsor: user?.sponsorAddress ?? null,
        registeredAt: user?.registeredAt ?? null,
        totalIncome: incomeSum._sum.amount?.toString() ?? "0",
        totalTokenRewards: tokenSum._sum.sltAmount?.toString() ?? "0",
        totalWithdrawals: withdrawals._sum.amount?.toString() ?? "0",
        directReferrals: directCount,
        clubEvents: clubCount,
        pilotEvents: pilotCount,
    });
}
export async function getWalletAnalytics(wallet) {
    const w = normalizeWallet(wallet);
    const [incomes, withdrawals, tokens] = await Promise.all([
        prisma.indexedIncome.findMany({
            where: { recipientAddress: w },
            orderBy: { blockNumber: "desc" },
            take: 50,
        }),
        prisma.indexedWithdrawal.findMany({
            where: { walletAddress: w },
            orderBy: { blockNumber: "desc" },
            take: 50,
        }),
        prisma.indexedTokenReward.findMany({
            where: { recipientAddress: w },
            orderBy: { blockNumber: "desc" },
            take: 50,
        }),
    ]);
    return serializeForJson({ wallet: w, incomes, withdrawals, tokenRewards: tokens });
}
export async function getReferrals(wallet) {
    const w = normalizeWallet(wallet);
    return serializeForJson(await prisma.indexedReferral.findMany({
        where: { sponsorAddress: w },
        orderBy: { blockNumber: "desc" },
    }));
}
export async function getTeamStats(wallet) {
    const w = normalizeWallet(wallet);
    const direct = await prisma.indexedReferral.findMany({
        where: { sponsorAddress: w },
    });
    const teamWallets = direct.map((d) => d.referralAddress);
    const [registeredDirect, registeredLaeDirect] = await Promise.all([
        prisma.indexedUser.count({ where: { walletAddress: { in: teamWallets } } }),
        prisma.indexedLaeUser.count({ where: { walletAddress: { in: teamWallets } } }),
    ]);
    return serializeForJson({
        wallet: w,
        directCount: direct.length,
        registeredDirect,
        registeredLaeDirect,
        direct,
    });
}
export async function getMatrices(wallet) {
    const w = normalizeWallet(wallet);
    const [club, pilot] = await Promise.all([
        prisma.indexedClubMatrix.findMany({
            where: { ownerAddress: w },
            orderBy: { blockNumber: "desc" },
        }),
        prisma.indexedPilotMatrix.findMany({
            where: { ownerAddress: w },
            orderBy: { blockNumber: "desc" },
        }),
    ]);
    return serializeForJson({ club, pilot });
}
export async function getIncomeHistory(wallet, limit = 100) {
    const w = normalizeWallet(wallet);
    return serializeForJson(await prisma.indexedIncome.findMany({
        where: { recipientAddress: w },
        orderBy: { blockNumber: "desc" },
        take: limit,
    }));
}
export async function getRewardHistory(wallet, limit = 100) {
    const w = normalizeWallet(wallet);
    return serializeForJson(await prisma.indexedTokenReward.findMany({
        where: { recipientAddress: w },
        orderBy: { blockNumber: "desc" },
        take: limit,
    }));
}
export async function getTransactions(wallet, limit = 100) {
    const w = normalizeWallet(wallet);
    return serializeForJson(await prisma.indexedTransaction.findMany({
        where: { walletAddress: w },
        orderBy: { blockNumber: "desc" },
        take: limit,
    }));
}
export async function getSpins(wallet, limit = 50) {
    const w = normalizeWallet(wallet);
    return serializeForJson(await prisma.indexedSpin.findMany({
        where: { walletAddress: w },
        orderBy: { blockNumber: "desc" },
        take: limit,
    }));
}
export async function getStakes(wallet) {
    const w = normalizeWallet(wallet);
    return serializeForJson(await prisma.indexedStake.findMany({
        where: { walletAddress: w },
        orderBy: { blockNumber: "desc" },
    }));
}
export async function getLeaderboard(limit = 50) {
    const rows = await prisma.indexedIncome.groupBy({
        by: ["recipientAddress"],
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: limit,
    });
    return rows.map((r, i) => ({
        rank: i + 1,
        wallet: r.recipientAddress,
        totalIncome: r._sum.amount?.toString() ?? "0",
    }));
}
export async function getIndexerStatus() {
    const state = await prisma.indexerState.findUnique({ where: { id: "main" } });
    const eventCount = await prisma.chainEvent.count();
    return {
        state: state
            ? {
                id: state.id,
                chainId: state.chainId,
                lastBlock: state.lastBlock.toString(),
                lastBlockHash: state.lastBlockHash,
                updatedAt: state.updatedAt.toISOString(),
            }
            : null,
        eventCount,
        mode: "indexer-only",
    };
}
//# sourceMappingURL=analytics.service.js.map