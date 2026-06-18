/** BSC Testnet deployed contracts — matches frontend lib/contracts/config.ts */
export const CHAIN = {
  chainId: Number(process.env.CHAIN_ID ?? process.env.POLYGON_CHAIN_ID ?? "97"),
  rpcUrl:
    process.env.BSC_RPC_URL ??
    process.env.POLYGON_RPC_URL ??
    "https://data-seed-prebsc-1-s1.binance.org:8545",
  startBlock: BigInt(process.env.INDEXER_START_BLOCK ?? "0"),
  reorgDepth: Number(process.env.INDEXER_REORG_DEPTH ?? "12"),
  batchSize: Number(process.env.INDEXER_BATCH_SIZE ?? "2000"),
  pollMs: Number(process.env.INDEXER_POLL_MS ?? "8000"),
} as const;

export const CONTRACTS = {
  senso:
    process.env.SENSO_CONTRACT_ADDRESS ??
    "0x74Ddbe4bcb6000bD9AA357E02B874C3D0e0248D5",
  slt:
    process.env.SLT_CONTRACT_ADDRESS ??
    "0x7a509cb5cF853BaE4C4A76B7e37037cf8ec2A146",
  spin:
    process.env.SPIN_CONTRACT_ADDRESS ??
    "0xE5BD47a1bA6D742c147b74c54Ca6CFd95cACD50D",
  staking:
    process.env.STAKING_CONTRACT_ADDRESS ??
    "0xDAB2Ef2396b53D64cf22Fe58fE0275fDdb0fe5D8",
} as const;
