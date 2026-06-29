/** BSC — LAEClubMatrix deployed contract */
export const MATRIX_CORE_DEPLOY_BLOCK = BigInt(
  process.env.LAE_MATRIX_DEPLOY_BLOCK ??
    process.env.MATRIX_CORE_DEPLOY_BLOCK ??
    process.env.INDEXER_START_BLOCK ??
    "116207655"
);

export const CHAIN = {
  chainId: Number(process.env.CHAIN_ID ?? "97"),
  rpcUrl: process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org",
  startBlock: BigInt(process.env.INDEXER_START_BLOCK ?? String(MATRIX_CORE_DEPLOY_BLOCK)),
  reorgDepth: Number(process.env.INDEXER_REORG_DEPTH ?? "12"),
  batchSize: Number(process.env.INDEXER_BATCH_SIZE ?? "400"),
  pollMs: Number(process.env.INDEXER_POLL_MS ?? "8000"),
} as const;

export const CONTRACTS = {
  /** LAEClubMatrix — 15 slots × 14 positions */
  matrixCore:
    process.env.LAE_MATRIX_CONTRACT_ADDRESS ??
    process.env.MATRIX_CORE_CONTRACT_ADDRESS ??
    "0x88B8bd1E8Ce3D5F178BA3E6CcCb8Ce8Aec230d48",
  senso: process.env.SENSO_CONTRACT_ADDRESS ?? "0x6521619C38fe4be6B800263CC783d9524ED4F7BA",
  slt: process.env.SLT_CONTRACT_ADDRESS ?? "0xc842c083E703ecf82496813cc3BFe6d36c0A49b0",
  spin: process.env.SPIN_CONTRACT_ADDRESS ?? "0xF9bdE4a2Ca487b18DA8546124b63Ec9e938ea1aE",
  staking: process.env.STAKING_CONTRACT_ADDRESS ?? "0xdb25Af21346aD358D5e52835934AF5f326169984",
  laeCoin:
    process.env.LAE_COIN_CONTRACT_ADDRESS ?? "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A",
  paymentToken:
    process.env.PAYMENT_TOKEN_ADDRESS ??
    process.env.DAI_CONTRACT_ADDRESS ??
    "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575",
} as const;
