/** BSC Testnet deployed contracts — override via NEXT_PUBLIC_* env vars */

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "97");

export const CONTRACTS = {
  senso: (process.env.NEXT_PUBLIC_SENSO_CONTRACT ??
    "0x74Ddbe4bcb6000bD9AA357E02B874C3D0e0248D5") as `0x${string}`,
  dai: (process.env.NEXT_PUBLIC_DAI_CONTRACT ??
    "0xf8E556996042b34cc706F040c59955abB678995e") as `0x${string}`,
  slt: (process.env.NEXT_PUBLIC_SLT_CONTRACT ??
    "0x7a509cb5cF853BaE4C4A76B7e37037cf8ec2A146") as `0x${string}`,
  spin: (process.env.NEXT_PUBLIC_SPIN_CONTRACT ??
    "0xE5BD47a1bA6D742c147b74c54Ca6CFd95cACD50D") as `0x${string}`,
  staking: (process.env.NEXT_PUBLIC_STAKING_CONTRACT ??
    "0xDAB2Ef2396b53D64cf22Fe58fE0275fDdb0fe5D8") as `0x${string}`,
} as const;

export const MAX_UINT256 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

/** How many blocks back to scan for events on BSC testnet RPCs */
export const LOG_LOOKBACK_BLOCKS = 30_000n;
