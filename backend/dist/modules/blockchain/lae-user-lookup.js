import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS } from "../../config/chains.js";
const MATRIX_LOOKUP_ABI = [
    "function idToAddress(uint256) view returns (address)",
    "function getUserDetails(uint256 userId) view returns (address userAddress, address referrerAddress, uint256 referrerId, uint256 partnersCount, uint8 activeSlotsCount, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome)",
];
let matrixContract = null;
function getMatrixContract() {
    const addr = CONTRACTS.matrixCore;
    if (!addr || addr === "0x0000000000000000000000000000000000000000")
        return null;
    if (!matrixContract) {
        const provider = new ethers.JsonRpcProvider(CHAIN.rpcUrl, CHAIN.chainId);
        matrixContract = new ethers.Contract(addr, MATRIX_LOOKUP_ABI, provider);
    }
    return matrixContract;
}
/** Resolve wallet for a LAEClubMatrix user id — DB first, then idToAddress. */
export async function laeWalletForUserId(userId) {
    if (userId <= 0)
        return null;
    const cached = await prisma.matrixCoreUser.findFirst({ where: { userId } });
    if (cached?.walletAddress)
        return cached.walletAddress;
    const matrix = getMatrixContract();
    if (!matrix)
        return null;
    try {
        const addr = String(await matrix.idToAddress(userId)).toLowerCase();
        if (!addr || addr === "0x0000000000000000000000000000000000000000")
            return null;
        return addr;
    }
    catch {
        return null;
    }
}
/** No-op — LAEClubMatrix income rows store toUserId directly. */
export async function repairLaeIncomeReceiverAddresses() {
    return 0;
}
//# sourceMappingURL=lae-user-lookup.js.map