import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { generateReferralCode, normalizeWalletAddress, isValidWalletAddress } from "../../utils/crypto.js";
import { AppError } from "../../utils/helpers.js";
import { config } from "../../config/index.js";
import { userRepository } from "../../repositories/index.js";
import { buildTreePath, computeTreeDepth } from "../../repositories/referral-tree.repository.js";
import { runMatrixTransaction } from "../../lib/transaction.js";
import { buildSignInMessage, consumeNonce } from "../../services/nonce.service.js";
export function verifyWalletSignature(walletAddress, signature, nonce) {
    const message = buildSignInMessage(walletAddress, nonce);
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new AppError(401, "Invalid wallet signature", "INVALID_SIGNATURE");
    }
    if (!consumeNonce(walletAddress, nonce)) {
        throw new AppError(401, "Invalid or expired nonce", "INVALID_NONCE");
    }
}
export async function registerUser(walletAddress, referralCode, username, email) {
    if (!isValidWalletAddress(walletAddress)) {
        throw new AppError(400, "Invalid wallet address", "INVALID_WALLET");
    }
    const normalized = normalizeWalletAddress(walletAddress);
    const existing = await userRepository.findByWallet(normalized);
    if (existing) {
        throw new AppError(409, "Wallet already registered", "WALLET_EXISTS");
    }
    const sponsor = await userRepository.findByReferralCode(referralCode);
    if (!sponsor) {
        throw new AppError(404, "Invalid referral code", "INVALID_REFERRAL");
    }
    let code = generateReferralCode();
    let attempts = 0;
    while (await userRepository.findByReferralCode(code)) {
        code = generateReferralCode();
        if (++attempts > 10)
            throw new AppError(500, "Failed to generate referral code");
    }
    const isAdmin = config.adminWallets.includes(normalized);
    const user = await runMatrixTransaction(async (tx) => {
        const created = await tx.user.create({
            data: {
                walletAddress: normalized,
                username,
                email,
                sponsorId: sponsor.id,
                referralCode: code,
                isAdmin,
                treePath: "/",
                treeDepth: 0,
                wallet: { create: {} },
            },
            include: { wallet: true, sponsor: true },
        });
        const treePath = buildTreePath(sponsor.treePath, created.id);
        const treeDepth = computeTreeDepth(treePath);
        return tx.user.update({
            where: { id: created.id },
            data: { treePath, treeDepth },
            include: { wallet: true, sponsor: true },
        });
    });
    return user;
}
export async function loginUser(walletAddress) {
    const normalized = normalizeWalletAddress(walletAddress);
    const user = await userRepository.findByWallet(normalized);
    if (!user) {
        throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }
    if (user.status === "SUSPENDED") {
        throw new AppError(403, "Account suspended", "ACCOUNT_SUSPENDED");
    }
    if (user.deletedAt) {
        throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }
    return user;
}
export async function createSession(userId, token, expiresAt) {
    return prisma.session.create({
        data: { userId, token, expiresAt },
    });
}
export async function revokeSession(token) {
    await prisma.session.deleteMany({ where: { token } });
}
export async function getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user || user.deletedAt)
        throw new AppError(404, "User not found");
    const directCount = await userRepository.countDirectReferrals(userId);
    return { ...user, directReferralCount: directCount };
}
//# sourceMappingURL=auth.service.js.map