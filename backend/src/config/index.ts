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
    sensoContract: process.env.SENSO_CONTRACT_ADDRESS ?? "0x6521619C38fe4be6B800263CC783d9524ED4F7BA",
    daiContract: process.env.DAI_CONTRACT_ADDRESS ?? "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575",
    sltContract: process.env.SLT_CONTRACT_ADDRESS ?? "0xc842c083E703ecf82496813cc3BFe6d36c0A49b0",
    spinContract: process.env.SPIN_CONTRACT_ADDRESS ?? "0xF9bdE4a2Ca487b18DA8546124b63Ec9e938ea1aE",
    stakingContract: process.env.STAKING_CONTRACT_ADDRESS ?? "0xdb25Af21346aD358D5e52835934AF5f326169984",
  },

  adminWallets: (process.env.ADMIN_WALLET_ADDRESSES ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean),

  indexerAdminApiKey: process.env.INDEXER_ADMIN_API_KEY ?? "",

  minWithdrawDai: parseFloat(process.env.MIN_WITHDRAW_DAI ?? "1"),
  transactionFeePol: parseFloat(process.env.TRANSACTION_FEE_POL ?? "0.05"),
  corsOrigin:
    process.env.CORS_ORIGIN ??
    "http://localhost:3000,http://127.0.0.1:3000",
} as const;

/** Comma-separated list from CORS_ORIGIN (supports http + https during SSL rollout). */
export function getCorsOrigins(): string[] {
  return config.corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function assertConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}

assertConfig();
