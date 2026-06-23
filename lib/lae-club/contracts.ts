/** BSC Testnet — LAE Club ecosystem addresses */

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "97");

export const LAE_CONTRACTS = {
  /** LAEClubMatrix — 15-level 14-spot matrix */
  matrix: (process.env.NEXT_PUBLIC_LAE_MATRIX_CONTRACT ??
    "0xaDFA4602894c75B52a71728A55fCAeeEcc1D2c9a") as `0x${string}`,
  /** Payment token (BTCB / mock on testnet) */
  payment: (process.env.NEXT_PUBLIC_PAYMENT_TOKEN ??
    process.env.NEXT_PUBLIC_DAI_CONTRACT ??
    "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575") as `0x${string}`,
  /** LAE Coin ERC20 */
  laeCoin: (process.env.NEXT_PUBLIC_LAE_COIN_CONTRACT ??
    process.env.NEXT_PUBLIC_SLT_CONTRACT ??
    "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A") as `0x${string}`,
  /** BTitan Registration Pass NFT */
  registrationNft: (process.env.NEXT_PUBLIC_REG_NFT_CONTRACT ??
    "0xA74d3788B821d392Fd4622Dae054164e4494cc19") as `0x${string}`,
  royalRank1: (process.env.NEXT_PUBLIC_ROYAL1_NFT ??
    "0xc48026c9497a92aCBCCBeB389238FA00890123Ab") as `0x${string}`,
  royalRank2: (process.env.NEXT_PUBLIC_ROYAL2_NFT ??
    "0x9eCd002C123F865Ee68FbD79aB3F5e67d0cEf2F5") as `0x${string}`,
  royalRank3: (process.env.NEXT_PUBLIC_ROYAL3_NFT ??
    "0x48D17b54D27140E212f6841E80aA6389C416f248") as `0x${string}`,
  royalRank4: (process.env.NEXT_PUBLIC_ROYAL4_NFT ??
    "0xEe9e3b2aEb8B59ef53593A4E1fc83f0E79CAD99B") as `0x${string}`,
  staking: (process.env.NEXT_PUBLIC_LAE_STAKING_CONTRACT ??
    process.env.NEXT_PUBLIC_STAKING_CONTRACT ??
    "0xdb25Af21346aD358D5e52835934AF5f326169984") as `0x${string}`,
  clubPool: (process.env.NEXT_PUBLIC_CLUB_POOL ??
    process.env.NEXT_PUBLIC_ROYAL_POOL ??
    "0xef9594fC5145404BfC7B5640296C3864319e3d86") as `0x${string}`,
} as const;

export const BSCSCAN_BASE =
  CHAIN_ID === 97 ? "https://testnet.bscscan.com" : "https://bscscan.com";

export function txUrl(hash: string) {
  return `${BSCSCAN_BASE}/tx/${hash}`;
}

export function addressUrl(addr: string) {
  return `${BSCSCAN_BASE}/address/${addr}`;
}
