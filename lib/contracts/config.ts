/** BSC Testnet deployed contracts — override via NEXT_PUBLIC_* env vars */

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "97");

export const CONTRACTS = {
  lae: (process.env.NEXT_PUBLIC_LAE_CONTRACT ??
    process.env.NEXT_PUBLIC_SENSO_CONTRACT ??
    "0x6521619C38fe4be6B800263CC783d9524ED4F7BA") as `0x${string}`,
  dai: (process.env.NEXT_PUBLIC_DAI_CONTRACT ??
    "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575") as `0x${string}`,
  slt: (process.env.NEXT_PUBLIC_SLT_CONTRACT ??
    "0xc842c083E703ecf82496813cc3BFe6d36c0A49b0") as `0x${string}`,
} as const;

export const MAX_UINT256 =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

/** How many blocks back to scan for events on BSC testnet RPCs */
export const LOG_LOOKBACK_BLOCKS = 30_000n;

/** LAEClubMatrix deploy block — BSC Testnet (Jun 2026) */
export const LAE_MATRIX_DEPLOY_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_LAE_MATRIX_DEPLOY_BLOCK ?? "115009159"
);

/** Max blocks per eth_getLogs request (public RPC limit) */
export const LOG_CHUNK_BLOCKS = 2_000n;
