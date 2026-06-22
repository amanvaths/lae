/** BSC Testnet — LAE Club ecosystem addresses */

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "97");

export const LAE_CONTRACTS = {
  /** LAEClubMatrix — 15-level 14-spot matrix */
  matrix: (process.env.NEXT_PUBLIC_LAE_MATRIX_CONTRACT ??
    "0xfa671b8Bae031fB9ef6eD02E9a9a63d05f764Dcf") as `0x${string}`,
  /** Payment token (BTCB / mock on testnet) */
  payment: (process.env.NEXT_PUBLIC_PAYMENT_TOKEN ??
    process.env.NEXT_PUBLIC_DAI_CONTRACT ??
    "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575") as `0x${string}`,
  /** LAE Coin ERC20 */
  laeCoin: (process.env.NEXT_PUBLIC_LAE_COIN_CONTRACT ??
    process.env.NEXT_PUBLIC_SLT_CONTRACT ??
    "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A") as `0x${string}`,
  registrationNft: (process.env.NEXT_PUBLIC_REG_NFT_CONTRACT ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  royalRank1: (process.env.NEXT_PUBLIC_ROYAL1_NFT ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  royalRank2: (process.env.NEXT_PUBLIC_ROYAL2_NFT ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  royalRank3: (process.env.NEXT_PUBLIC_ROYAL3_NFT ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  royalRank4: (process.env.NEXT_PUBLIC_ROYAL4_NFT ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  staking: (process.env.NEXT_PUBLIC_LAE_STAKING_CONTRACT ??
    process.env.NEXT_PUBLIC_STAKING_CONTRACT ??
    "0xdb25Af21346aD358D5e52835934AF5f326169984") as `0x${string}`,
  clubPool: (process.env.NEXT_PUBLIC_CLUB_POOL ??
    process.env.NEXT_PUBLIC_ROYAL_POOL ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

export const BSCSCAN_BASE =
  CHAIN_ID === 97 ? "https://testnet.bscscan.com" : "https://bscscan.com";

export function txUrl(hash: string) {
  return `${BSCSCAN_BASE}/tx/${hash}`;
}

export function addressUrl(addr: string) {
  return `${BSCSCAN_BASE}/address/${addr}`;
}
