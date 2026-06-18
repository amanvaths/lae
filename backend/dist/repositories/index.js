import { prisma } from "../lib/prisma.js";
export const userRepository = {
    findByWallet(walletAddress) {
        return prisma.user.findFirst({
            where: { walletAddress: walletAddress.toLowerCase(), deletedAt: null },
            include: { wallet: true, sponsor: { select: { id: true, walletAddress: true, referralCode: true } } },
        });
    },
    findByReferralCode(referralCode) {
        return prisma.user.findFirst({ where: { referralCode, deletedAt: null } });
    },
    findById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: { wallet: true },
        });
    },
    create(data) {
        return prisma.user.create({
            data,
            include: { wallet: true },
        });
    },
    countDirectReferrals(userId) {
        return prisma.user.count({ where: { sponsorId: userId, deletedAt: null } });
    },
    getDirectReferrals(userId, skip = 0, take = 50) {
        return prisma.user.findMany({
            where: { sponsorId: userId, deletedAt: null },
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: { wallet: true },
        });
    },
    async getSponsorChain(userId, maxDepth = 100) {
        const chain = [];
        let currentId = userId;
        let depth = 0;
        while (currentId && depth < maxDepth) {
            const currentUser = await prisma.user.findUnique({
                where: { id: currentId },
                select: { sponsorId: true },
            });
            if (!currentUser?.sponsorId)
                break;
            const sponsorUser = await prisma.user.findUnique({
                where: { id: currentUser.sponsorId },
                select: { id: true, walletAddress: true, referralCode: true },
            });
            if (!sponsorUser)
                break;
            depth++;
            chain.push({
                id: sponsorUser.id,
                walletAddress: sponsorUser.walletAddress,
                referralCode: sponsorUser.referralCode,
                depth,
            });
            currentId = sponsorUser.id;
        }
        return chain;
    },
    async getReferralTree(userId, maxDepth = 5) {
        async function buildTree(id, depth) {
            if (depth > maxDepth)
                return null;
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    walletAddress: true,
                    referralCode: true,
                    createdAt: true,
                    directReferrals: {
                        select: { id: true },
                    },
                },
            });
            if (!user)
                return null;
            const children = await Promise.all(user.directReferrals.map((r) => buildTree(r.id, depth + 1)));
            return {
                id: user.id,
                walletAddress: user.walletAddress,
                referralCode: user.referralCode,
                createdAt: user.createdAt,
                directCount: user.directReferrals.length,
                children: children.filter(Boolean),
            };
        }
        return buildTree(userId, 0);
    },
};
export const walletRepository = {
    findByUserId(userId) {
        return prisma.wallet.findUnique({ where: { userId } });
    },
    getLedger(userId, skip = 0, take = 50) {
        return prisma.incomeLedger.findMany({
            where: { userId },
            skip,
            take,
            orderBy: { createdAt: "desc" },
        });
    },
};
export const clubRepository = {
    getUserMatrices(userId) {
        return prisma.clubMatrix.findMany({
            where: { ownerId: userId, deletedAt: null },
            include: { placements: { include: { user: { select: { id: true, walletAddress: true } } } } },
            orderBy: [{ packageLevel: "asc" }, { cycleNumber: "asc" }],
        });
    },
    getMatrixById(matrixId) {
        return prisma.clubMatrix.findUnique({
            where: { id: matrixId },
            include: {
                placements: { include: { user: { select: { id: true, walletAddress: true, referralCode: true } } } },
                owner: { select: { id: true, walletAddress: true } },
            },
        });
    },
    getUserPackages(userId) {
        return prisma.userClubPackage.findMany({
            where: { userId, deletedAt: null },
            orderBy: { packageLevel: "asc" },
        });
    },
};
export const pilotRepository = {
    getUserMatrices(userId) {
        return prisma.pilotMatrix.findMany({
            where: { ownerId: userId, deletedAt: null },
            include: { slots: true },
            orderBy: [{ packageLevel: "asc" }, { cycleNumber: "asc" }],
        });
    },
    getUserPackages(userId) {
        return prisma.userPilotPackage.findMany({
            where: { userId, deletedAt: null },
            orderBy: { packageLevel: "asc" },
        });
    },
};
//# sourceMappingURL=index.js.map