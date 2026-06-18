import "dotenv/config";

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  host: process.env.HOST ?? "0.0.0.0",

  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },

  polygon: {
    rpcUrl: process.env.BSC_RPC_URL ?? process.env.POLYGON_RPC_URL ?? "https://data-seed-prebsc-1-s1.binance.org:8545",
    chainId: parseInt(process.env.CHAIN_ID ?? process.env.POLYGON_CHAIN_ID ?? "97", 10),
    sensoContract: process.env.SENSO_CONTRACT_ADDRESS ?? "0x74Ddbe4bcb6000bD9AA357E02B874C3D0e0248D5",
    daiContract: process.env.DAI_CONTRACT_ADDRESS ?? "0xf8E556996042b34cc706F040c59955abB678995e",
    sltContract: process.env.SLT_CONTRACT_ADDRESS ?? "0x7a509cb5cF853BaE4C4A76B7e37037cf8ec2A146",
    spinContract: process.env.SPIN_CONTRACT_ADDRESS ?? "0xE5BD47a1bA6D742c147b74c54Ca6CFd95cACD50D",
    stakingContract: process.env.STAKING_CONTRACT_ADDRESS ?? "0xDAB2Ef2396b53D64cf22Fe58fE0275fDdb0fe5D8",
  },

  adminWallets: (process.env.ADMIN_WALLET_ADDRESSES ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean),

  indexerAdminApiKey: process.env.INDEXER_ADMIN_API_KEY ?? "",

  minWithdrawDai: parseFloat(process.env.MIN_WITHDRAW_DAI ?? "1"),
  transactionFeePol: parseFloat(process.env.TRANSACTION_FEE_POL ?? "0.05"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
} as const;

function assertConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}

assertConfig();
