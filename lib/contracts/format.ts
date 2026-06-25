import { formatEther, parseEther } from "viem";

export function fmtEther(wei: bigint | undefined, dp = 4): string {
  if (wei === undefined) return "—";
  return `${Number(formatEther(wei)).toFixed(dp)}`;
}

export function fmtToken(wei: bigint | undefined, symbol = "LAE", dp = 2): string {
  if (wei === undefined) return "—";
  return `${Number(formatEther(wei)).toFixed(dp)} ${symbol}`;
}

/** Parse API income: wei integer string or human decimal (e.g. 0.0081). */
export function incomeStringToWei(value?: string | null): bigint {
  if (!value) return 0n;
  const trimmed = value.trim();
  if (!trimmed) return 0n;
  if (trimmed.includes(".")) {
    try {
      return parseEther(trimmed);
    } catch {
      return 0n;
    }
  }
  try {
    return BigInt(trimmed);
  } catch {
    return 0n;
  }
}

export { formatEther, parseEther };
