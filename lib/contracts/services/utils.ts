import { keccak256, toBytes, type Address } from "viem";

export function makeWithdrawRef(address: Address): `0x${string}` {
  return keccak256(toBytes(`${address}-${Date.now()}-${Math.random()}`));
}

export function getSponsorFromUrl(): Address | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const sponsor = params.get("sponsor") ?? params.get("ref");
  if (sponsor?.startsWith("0x") && sponsor.length === 42) {
    return sponsor as Address;
  }
  return undefined;
}

export function referralLink(address: Address): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/login?sponsor=${address}`;
}
