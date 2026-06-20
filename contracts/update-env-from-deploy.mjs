#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deployPath = path.join(__dirname, "deployed-bsc-testnet.json");
if (!fs.existsSync(deployPath)) {
  console.error("Run deploy-bsc-testnet.mjs first");
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(deployPath, "utf8"));

function upsertEnv(filePath, updates) {
  let lines = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8").split("\n") : [];
  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  fs.writeFileSync(filePath, lines.filter((l, i, a) => l.length || i < a.length - 1).join("\n") + "\n");
  console.log("Updated", filePath);
}

upsertEnv(path.join(__dirname, "..", ".env.local"), {
  NEXT_PUBLIC_CHAIN_ID: String(d.chainId),
  NEXT_PUBLIC_LAE_MATRIX_CONTRACT: d.matrix,
  NEXT_PUBLIC_LAE_COIN_CONTRACT: d.laeCoin,
  NEXT_PUBLIC_PAYMENT_TOKEN: d.paymentToken,
  NEXT_PUBLIC_REG_NFT_CONTRACT: d.registrationNft,
  NEXT_PUBLIC_ROYAL1_NFT: d.royalRank1,
  NEXT_PUBLIC_ROYAL2_NFT: d.royalRank2,
  NEXT_PUBLIC_ROYAL3_NFT: d.royalRank3,
  NEXT_PUBLIC_ROYAL4_NFT: d.royalRank4,
  NEXT_PUBLIC_API_URL: "http://localhost:4000",
});

upsertEnv(path.join(__dirname, "..", "backend", ".env"), {
  LAE_MATRIX_CONTRACT_ADDRESS: d.matrix,
  LAE_COIN_CONTRACT_ADDRESS: d.laeCoin,
  CHAIN_ID: String(d.chainId),
  INDEXER_START_BLOCK: String(d.deployBlock),
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://senso:senso_secret@localhost:5432/senso_limitless?schema=public",
});

upsertEnv(path.join(__dirname, "..", ".env.example"), {
  NEXT_PUBLIC_CHAIN_ID: String(d.chainId),
  NEXT_PUBLIC_LAE_MATRIX_CONTRACT: d.matrix,
  NEXT_PUBLIC_LAE_COIN_CONTRACT: d.laeCoin,
  NEXT_PUBLIC_REG_NFT_CONTRACT: d.registrationNft,
  NEXT_PUBLIC_ROYAL1_NFT: d.royalRank1,
  NEXT_PUBLIC_ROYAL2_NFT: d.royalRank2,
  NEXT_PUBLIC_ROYAL3_NFT: d.royalRank3,
  NEXT_PUBLIC_ROYAL4_NFT: d.royalRank4,
  LAE_MATRIX_CONTRACT_ADDRESS: d.matrix,
  LAE_COIN_CONTRACT_ADDRESS: d.laeCoin,
});

console.log(JSON.stringify(d, null, 2));
