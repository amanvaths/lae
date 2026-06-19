import { formatEther, parseEther } from "viem";

export function fmtEther(wei: bigint | undefined, dp = 4): string {
  if (wei === undefined) return "—";
  return `${Number(formatEther(wei)).toFixed(dp)}`;
}

export function fmtToken(wei: bigint | undefined, symbol = "LAE", dp = 2): string {
  if (wei === undefined) return "—";
  return `${Number(formatEther(wei)).toFixed(dp)} ${symbol}`;
}

/** Parse API decimal strings (wei integer part) without throwing. */
export function parseApiWei(value?: string | null): bigint {
  if (!value) return 0n;
  const part = value.split(".")[0]?.replace(/\D/g, "") ?? "";
  if (!part) return 0n;
  try {
    return BigInt(part);
  } catch {
    return 0n;
  }
}

export { formatEther, parseEther };
