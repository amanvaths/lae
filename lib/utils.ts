import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a large number into a compact currency-like string. */
export function formatCompact(value: number, prefix = ""): string {
  const units = [
    { v: 1e12, s: "T" },
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "K" },
  ];
  for (const u of units) {
    if (Math.abs(value) >= u.v) {
      return `${prefix}${(value / u.v).toFixed(value % u.v === 0 ? 0 : 1)}${u.s}`;
    }
  }
  return `${prefix}${value}`;
}
