import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS, LAE_MATRIX_DEPLOY_BLOCK } from "../../config/chains.js";

const MATRIX_READ_ABI = [
  "function lastUserId() view returns (uint256)",
  "function getUserDetails(uint256 userId) view returns (address userAddress, address referrerAddress, uint256 referrerId, uint256 partnersCount, uint8 activeSlotsCount, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome)",
] as const;

/** Populate indexed users from on-chain getUserDetails — works without archive eth_getLogs. */
export async function backfillLaeUsersFromChain(): Promise<number> {
  const addr = CONTRACTS.laeMatrix;
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return 0;

  const provider = new ethers.JsonRpcProvider(CHAIN.rpcUrl, CHAIN.chainId);
  const matrix = new ethers.Contract(addr, MATRIX_READ_ABI, provider);
  const lastUserId = Number(await matrix.lastUserId());
  if (lastUserId < 1) return 0;

  let upserted = 0;
  for (let userId = 1; userId <= lastUserId; userId++) {
    try {
      const details = await matrix.getUserDetails(userId);
      const walletAddress = String(details.userAddress).toLowerCase();
      if (!walletAddress || walletAddress === "0x0000000000000000000000000000000000000000") {
        continue;
      }

      const sponsorId = Number(details.referrerId);
      const tsSec = Number(details.registrationTimestamp);
      const registeredAt =
        tsSec > 0 ? new Date(tsSec * 1000) : new Date();

      await prisma.indexedLaeUser.upsert({
        where: { walletAddress },
        create: {
          walletAddress,
          userId,
          sponsorId: sponsorId > 0 ? sponsorId : null,
          teamSize: Number(details.teamSize),
          totalIncome: ethers.formatUnits(details.totalIncome, 18),
          registeredAt,
          registeredBlock: LAE_MATRIX_DEPLOY_BLOCK,
        },
        update: {
          userId,
          sponsorId: sponsorId > 0 ? sponsorId : null,
          teamSize: Number(details.teamSize),
          totalIncome: ethers.formatUnits(details.totalIncome, 18),
          registeredAt,
        },
      });
      upserted++;
    } catch (err) {
      console.warn(`[backfill] skip userId ${userId}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[backfill] Indexed ${upserted} LAE users from chain (lastUserId=${lastUserId})`);
  return upserted;
}
