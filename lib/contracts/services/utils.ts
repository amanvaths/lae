import { keccak256, toBytes, type Address } from "viem";
import { withBasePath } from "@/lib/paths";

export function makeWithdrawRef(address: Address): `0x${string}` {
  return keccak256(toBytes(`${address}-${Date.now()}-${Math.random()}`));
}

/** @deprecated LAE Club uses numeric user IDs — prefer referralLinkByUserId from lib/lae-club/hooks */
export function getSponsorFromUrl(): Address | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const sponsor = params.get("sponsor");
  if (sponsor?.startsWith("0x") && sponsor.length === 42) {
    return sponsor as Address;
  }
  return undefined;
}

/** LAE Club referral link by on-chain user ID */
export function referralLink(userId: bigint | number | string | undefined): string {
  if (typeof window === "undefined" || userId === undefined || userId === "" || userId === 0 || userId === "0") {
    return "";
  }
  return `${window.location.origin}${withBasePath("/register")}?ref=${String(userId)}`;
}
