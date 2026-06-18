export { CHAIN_ID, CONTRACTS, MAX_UINT256 } from "./config";

/** BSC Testnet block explorer */
export const EXPLORER_URL = "https://testnet.bscscan.com";

export function txUrl(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function addressUrl(addr: string): string {
  return `${EXPLORER_URL}/address/${addr}`;
}
