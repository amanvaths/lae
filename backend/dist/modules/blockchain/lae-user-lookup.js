import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CHAIN, CONTRACTS } from "../../config/chains.js";
const ID_TO_ADDRESS_ABI = ["function idToAddress(uint256 id) view returns (address)"];
let idToAddressContract = null;
function getIdToAddressContract() {
    const addr = CONTRACTS.laeMatrix;
    if (!addr || addr === "0x0000000000000000000000000000000000000000")
        return null;
    if (!idToAddressContract) {
        const provider = new ethers.JsonRpcProvider(CHAIN.rpcUrl, CHAIN.chainId);
        idToAddressContract = new ethers.Contract(addr, ID_TO_ADDRESS_ABI, provider);
    }
    return idToAddressContract;
}
/** Resolve wallet for a LAE user id — DB first, then on-chain idToAddress. */
export async function laeWalletForUserId(userId) {
    if (userId <= 0)
        return null;
    const cached = await prisma.indexedLaeUser.findFirst({ where: { userId } });
    if (cached?.walletAddress)
        return cached.walletAddress;
    const matrix = getIdToAddressContract();
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
/** Fill missing receiverAddress on indexed income rows after users are backfilled. */
export async function repairLaeIncomeReceiverAddresses() {
    const rows = await prisma.indexedLaeIncome.findMany({
        where: { receiverAddress: null },
        select: { id: true, receiverUserId: true },
    });
    if (rows.length === 0)
        return 0;
    let fixed = 0;
    for (const row of rows) {
        const wallet = await laeWalletForUserId(row.receiverUserId);
        if (!wallet)
            continue;
        await prisma.indexedLaeIncome.update({
            where: { id: row.id },
            data: { receiverAddress: wallet },
        });
        fixed++;
    }
    if (fixed > 0) {
        console.log(`[backfill] Repaired ${fixed} income rows with receiverAddress`);
    }
    return fixed;
}
//# sourceMappingURL=lae-user-lookup.js.map