/** LAE Club chain + deploy block config */
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "97");

export const MATRIX_CORE_DEPLOY_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_MATRIX_CORE_DEPLOY_BLOCK ??
    process.env.NEXT_PUBLIC_LAE_MATRIX_DEPLOY_BLOCK ??
    "115449450"
);

export const LAE_MATRIX_DEPLOY_BLOCK = MATRIX_CORE_DEPLOY_BLOCK;

export const LOG_CHUNK_BLOCKS = 2000n;
export const LOG_LOOKBACK_BLOCKS = 500_000n;
export const MAX_UINT256 = 2n ** 256n - 1n;

/** Legacy Senso Limitless contract addresses (non–LAE Club routes) */
export const CONTRACTS = {
  lae: (process.env.NEXT_PUBLIC_SENSO_CONTRACT ??
    "0x6521619C38fe4be6B800263CC783d9524ED4F7BA") as `0x${string}`,
  dai: (process.env.NEXT_PUBLIC_PAYMENT_TOKEN ??
    "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575") as `0x${string}`,
  slt: (process.env.NEXT_PUBLIC_SLT_CONTRACT ??
    "0xc842c083E703ecf82496813cc3BFe6d36c0A49b0") as `0x${string}`,
} as const;
