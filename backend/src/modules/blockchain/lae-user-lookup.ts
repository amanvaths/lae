import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS, MATRIX_CORE_DEPLOY_BLOCK } from "../../config/chains.js";

const MATRIX_LOOKUP_ABI = [
  "function idToAddress(uint256) view returns (address)",
  "function addressToId(address) view returns (uint256)",
  "function getUserDetails(uint256 userId) view returns (address userAddress, address referrerAddress, uint256 referrerId, uint256 partnersCount, uint8 activeSlotsCount, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome)",
] as const;

let matrixContract: ethers.Contract | null = null;

function getMatrixContract(): ethers.Contract | null {
  const addr = CONTRACTS.matrixCore;
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return null;
  if (!matrixContract) {
    const provider = new ethers.JsonRpcProvider(CHAIN.rpcUrl, CHAIN.chainId);
    matrixContract = new ethers.Contract(addr, MATRIX_LOOKUP_ABI, provider);
  }
  return matrixContract;
}

/** Resolve wallet for a LAEClubMatrix user id — DB first, then idToAddress. */
export async function laeWalletForUserId(userId: number): Promise<string | null> {
  if (userId <= 0) return null;

  const cached = await prisma.matrixCoreUser.findFirst({ where: { userId } });
  if (cached?.walletAddress) return cached.walletAddress;

  const matrix = getMatrixContract();
  if (!matrix) return null;

  try {
    const addr = String(await matrix.idToAddress(userId)).toLowerCase();
    if (!addr || addr === "0x0000000000000000000000000000000000000000") return null;
    return addr;
  } catch {
    return null;
  }
}

/** Resolve LAE user id from wallet — DB first, then on-chain addressToId (owner #1 has no Registration event). */
export async function laeUserIdForWallet(wallet: string): Promise<number | null> {
  const w = wallet.toLowerCase();
  if (!w.startsWith("0x") || w.length !== 42) return null;

  const cached = await prisma.matrixCoreUser.findUnique({ where: { walletAddress: w } });
  if (cached) return cached.userId;

  const matrix = getMatrixContract();
  if (!matrix) return null;

  try {
    const id = Number(await matrix.addressToId(w));
    if (!Number.isFinite(id) || id <= 0) return null;

    const details = await matrix.getUserDetails(id);
    const walletAddress = String(details.userAddress ?? details[0]).toLowerCase();
    const sponsorId = Number(details.referrerId ?? details[2]);

    await prisma.matrixCoreUser.upsert({
      where: { userId: id },
      create: {
        userId: id,
        walletAddress: walletAddress || w,
        sponsorId: sponsorId > 0 ? sponsorId : null,
        highestSlot: Number(details.activeSlotsCount ?? details[4]) || 1,
        directReferrals: Number(details.partnersCount ?? details[3]) || 0,
        totalEarned: ethers.formatUnits(details.totalIncome ?? details[7], 18),
        registeredBlock: MATRIX_CORE_DEPLOY_BLOCK > 0n ? MATRIX_CORE_DEPLOY_BLOCK : 0n,
      },
      update: {
        walletAddress: walletAddress || w,
        sponsorId: sponsorId > 0 ? sponsorId : null,
        highestSlot: Number(details.activeSlotsCount ?? details[4]) || 1,
        directReferrals: Number(details.partnersCount ?? details[3]) || 0,
        totalEarned: ethers.formatUnits(details.totalIncome ?? details[7], 18),
      },
    });

    return id;
  } catch {
    return null;
  }
}

/** No-op — LAEClubMatrix income rows store toUserId directly. */
export async function repairLaeIncomeReceiverAddresses(): Promise<number> {
  return 0;
}
