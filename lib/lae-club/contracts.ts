/** BSC — LAE Club LAEClubMatrix addresses */

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "97");

export const LAE_CONTRACTS = {
  /** LAEClubMatrix — 12 levels × 14 spots (BTitan-style) */
  matrix: (process.env.NEXT_PUBLIC_LAE_MATRIX_CONTRACT ??
    process.env.NEXT_PUBLIC_MATRIX_CORE_CONTRACT ??
    "0x32a4B3f011691ddB2881CCd6D14797186a211460") as `0x${string}`,
  payment: (process.env.NEXT_PUBLIC_PAYMENT_TOKEN ??
    "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575") as `0x${string}`,
  laeCoin: (process.env.NEXT_PUBLIC_LAE_COIN_CONTRACT ??
    "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A") as `0x${string}`,
  staking: (process.env.NEXT_PUBLIC_LAE_STAKING_CONTRACT ??
    "0xdb25Af21346aD358D5e52835934AF5f326169984") as `0x${string}`,
} as const;

export const BSCSCAN_BASE =
  CHAIN_ID === 97 ? "https://testnet.bscscan.com" : "https://bscscan.com";

export function txUrl(hash: string) {
  return `${BSCSCAN_BASE}/tx/${hash}`;
}

export function addressUrl(addr: string) {
  return `${BSCSCAN_BASE}/address/${addr}`;
}
