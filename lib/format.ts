/** Formatting helpers for DAI amounts from backend */

export function fmtDai(amount: string | number, dp = 4): string {
  return `${Number(amount).toFixed(dp)} DAI`;
}

export function daiToUsd(dai: number, rate = 1): string {
  return (dai * rate).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}…${addr.slice(-end)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
