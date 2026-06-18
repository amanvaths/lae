import { formatEther, parseEther } from "viem";

export function fmtEther(wei: bigint | undefined, dp = 4): string {
  if (wei === undefined) return "—";
  return `${Number(formatEther(wei)).toFixed(dp)}`;
}

export function fmtToken(wei: bigint | undefined, symbol = "SLT", dp = 2): string {
  if (wei === undefined) return "—";
  return `${Number(formatEther(wei)).toFixed(dp)} ${symbol}`;
}

export { formatEther, parseEther };
