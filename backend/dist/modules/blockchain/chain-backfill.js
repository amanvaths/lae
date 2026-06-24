import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS, MATRIX_CORE_DEPLOY_BLOCK } from "../../config/chains.js";
const MATRIX_READ_ABI = [
    "function lastUserId() view returns (uint256)",
    "function getUserDetails(uint256 userId) view returns (address userAddress, address referrerAddress, uint256 referrerId, uint256 partnersCount, uint8 activeSlotsCount, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome)",
];
/** Populate LAEClubMatrix users from on-chain getUserDetails. */
export async function backfillLaeUsersFromChain() {
    const addr = CONTRACTS.matrixCore;
    if (!addr || addr === "0x0000000000000000000000000000000000000000")
        return 0;
    const provider = new ethers.JsonRpcProvider(CHAIN.rpcUrl, CHAIN.chainId);
    const matrix = new ethers.Contract(addr, MATRIX_READ_ABI, provider);
    const lastUserId = Number(await matrix.lastUserId());
    if (lastUserId < 1)
        return 0;
    let upserted = 0;
    for (let userId = 1; userId <= lastUserId; userId++) {
        try {
            const d = await matrix.getUserDetails(userId);
            const walletAddress = String(d.userAddress ?? d[0]).toLowerCase();
            if (!walletAddress || walletAddress === "0x0000000000000000000000000000000000000000") {
                continue;
            }
            const sponsorId = Number(d.referrerId ?? d[2]);
            await prisma.matrixCoreUser.upsert({
                where: { walletAddress },
                create: {
                    walletAddress,
                    userId,
                    sponsorId: sponsorId > 0 ? sponsorId : null,
                    highestSlot: Number(d.activeSlotsCount ?? d[4]) || 1,
                    directReferrals: Number(d.partnersCount ?? d[3]) || 0,
                    totalEarned: ethers.formatUnits(d.totalIncome ?? d[7], 18),
                    registeredBlock: MATRIX_CORE_DEPLOY_BLOCK,
                },
                update: {
                    userId,
                    sponsorId: sponsorId > 0 ? sponsorId : null,
                    highestSlot: Number(d.activeSlotsCount ?? d[4]) || 1,
                    directReferrals: Number(d.partnersCount ?? d[3]) || 0,
                    totalEarned: ethers.formatUnits(d.totalIncome ?? d[7], 18),
                },
            });
            upserted++;
        }
        catch (err) {
            console.warn(`[backfill] skip userId ${userId}:`, err instanceof Error ? err.message : err);
        }
    }
    console.log(`[backfill] Indexed ${upserted} LAEClubMatrix users (lastUserId=${lastUserId})`);
    return upserted;
}
//# sourceMappingURL=chain-backfill.js.map