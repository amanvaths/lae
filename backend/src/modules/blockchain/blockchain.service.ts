import { ethers } from "ethers";
import { config } from "../../config/index.js";

const DAI_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

let provider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(config.polygon.rpcUrl, config.polygon.chainId);
  }
  return provider;
}

export async function verifyDepositTx(
  txHash: string,
  expectedUser: string,
  expectedAmount: bigint
): Promise<boolean> {
  const prov = getProvider();
  const receipt = await prov.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) return false;

  const iface = new ethers.Interface(DAI_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === "Transfer") {
        const to = (parsed.args.to as string).toLowerCase();
        const value = parsed.args.value as bigint;
        if (to === expectedUser.toLowerCase() && value >= expectedAmount) {
          return true;
        }
      }
    } catch {
      // not a DAI transfer log
    }
  }
  return false;
}

/** @deprecated Legacy Senso purchase flow disabled — matrix runs on-chain only. */
export async function processBlockchainDeposit(): Promise<never> {
  throw new Error(
    "Legacy purchase processing is disabled. Register via LAEClubMatrix.registrationExt on-chain."
  );
}

/** @deprecated Legacy deposit listener disabled. */
export function startDepositListener(): void {
  console.warn("[blockchain] Deposit listener disabled — use LAEClubMatrix event indexer only");
}

/** @deprecated Legacy withdraw transfer disabled. */
export async function initiateWithdrawTransfer(): Promise<null> {
  console.warn("[blockchain] Withdraw transfer disabled — analytics API is read-only");
  return null;
}
