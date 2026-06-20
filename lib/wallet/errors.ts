/** Map wagmi / viem / wallet errors to user-facing messages. */
export function formatWalletError(error: unknown): string {
  if (!error) return "Transaction failed";

  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Transaction failed";

  const lower = msg.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("rejected the request")) {
    return "Transaction rejected in wallet";
  }
  if (lower.includes("insufficient funds") || lower.includes("insufficient balance")) {
    return "Insufficient BNB for gas fees";
  }
  if (lower.includes("allowance") || lower.includes("exceeds allowance")) {
    return "Token approval required — approve payment token first";
  }
  if (lower.includes("transfer amount exceeds balance") || lower.includes("erc20: transfer amount exceeds balance")) {
    return "Insufficient payment token balance";
  }
  if (lower.includes("wrong network") || lower.includes("chain mismatch") || lower.includes("unsupported chain")) {
    return "Wrong network — switch to BSC Testnet";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "RPC timeout — try again in a moment";
  }
  if (lower.includes("network") && lower.includes("error")) {
    return "Network error — check your connection and RPC";
  }
  if (lower.includes("nonce")) {
    return "Wallet nonce error — reset account in MetaMask or retry";
  }
  if (lower.includes("execution reverted")) {
    if (lower.includes("user exists")) return "Wallet already registered";
    if (lower.includes("invalid referrer")) return "Invalid sponsor ID — check referral link";
    if (lower.includes("nothing claimable")) return "No LAE rewards available to claim yet";
    return "Contract rejected transaction — check requirements";
  }
  if (lower.includes("connector not connected") || lower.includes("wallet not connected")) {
    return "Wallet not connected";
  }

  return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
}
