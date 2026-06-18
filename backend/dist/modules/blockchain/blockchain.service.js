import { ethers } from "ethers";
import { config } from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import { purchaseQueue } from "../../queues/index.js";
const DAI_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
];
const DEPOSIT_ABI = [
    "event Deposit(address indexed user, uint256 amount, uint8 matrixType, uint8 packageLevel, bytes32 txRef)",
    "event Withdraw(address indexed user, uint256 amount, bytes32 withdrawRef)",
    "event Reward(address indexed user, uint256 amount, bytes32 rewardRef)",
];
let provider = null;
export function getProvider() {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(config.polygon.rpcUrl, config.polygon.chainId);
    }
    return provider;
}
export async function verifyDepositTx(txHash, expectedUser, expectedAmount) {
    const prov = getProvider();
    const receipt = await prov.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1)
        return false;
    const iface = new ethers.Interface(DAI_ABI);
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog({ topics: log.topics, data: log.data });
            if (parsed?.name === "Transfer") {
                const to = parsed.args.to.toLowerCase();
                const value = parsed.args.value;
                if (to === expectedUser.toLowerCase() && value >= expectedAmount) {
                    return true;
                }
            }
        }
        catch {
            // not a DAI transfer log
        }
    }
    return false;
}
export async function processBlockchainDeposit(userId, txHash, amount, packageLevel, matrixType) {
    const existing = await prisma.blockchainTransaction.findUnique({ where: { txHash } });
    if (existing)
        return;
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { sponsor: true },
    });
    if (!user.sponsorId) {
        throw new Error("User must have a sponsor for matrix placement");
    }
    await prisma.blockchainTransaction.create({
        data: {
            userId,
            type: "DEPOSIT",
            amount,
            txHash,
            status: "CONFIRMED",
            packageLevel,
            matrixType,
            confirmedAt: new Date(),
        },
    });
    await purchaseQueue.add("purchase", {
        userId,
        sponsorId: user.sponsorId,
        packageLevel,
        matrixType,
        txHash,
        isManual: true,
    });
}
export function startDepositListener(contractAddress) {
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        console.warn("[blockchain] Deposit listener disabled — no contract address configured");
        return;
    }
    const prov = getProvider();
    const contract = new ethers.Contract(contractAddress, DEPOSIT_ABI, prov);
    contract.on("Deposit", async (user, amount, matrixType, packageLevel, _txRef, event) => {
        try {
            const dbUser = await prisma.user.findUnique({
                where: { walletAddress: user.toLowerCase() },
            });
            if (!dbUser)
                return;
            const txHash = event.transactionHash;
            const daiAmount = Number(ethers.formatUnits(amount, 18));
            const mType = matrixType === 0 ? "CLUB" : "PILOT";
            await processBlockchainDeposit(dbUser.id, txHash, daiAmount, packageLevel, mType);
        }
        catch (err) {
            console.error("[blockchain] Deposit event error:", err);
        }
    });
    console.log("[blockchain] Deposit listener started");
}
export async function initiateWithdrawTransfer(toAddress, amount) {
    const privateKey = process.env.WITHDRAW_PRIVATE_KEY;
    if (!privateKey) {
        console.warn("[blockchain] Withdraw private key not configured");
        return null;
    }
    const prov = getProvider();
    const wallet = new ethers.Wallet(privateKey, prov);
    const dai = new ethers.Contract(config.polygon.daiContract, DAI_ABI, wallet);
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const tx = await dai.transfer(toAddress, amountWei);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
}
//# sourceMappingURL=blockchain.service.js.map