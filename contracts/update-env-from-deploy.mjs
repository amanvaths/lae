#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deployPath = path.join(__dirname, "deployed-bsc-testnet.json");
if (!fs.existsSync(deployPath)) {
  console.error("Run deploy-matrix-core-bsc-testnet.mjs first");
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(deployPath, "utf8"));

const matrixCore =
  d.contracts?.LAEClubMatrix ?? d.matrixCore ?? d.matrix ?? d.contracts?.matrixCore;
const deployBlock = String(d.matrixCoreDeployBlock ?? d.deployBlock ?? 0);

function upsertEnv(filePath, updates) {
  let lines = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8").split("\n") : [];
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") continue;
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  fs.writeFileSync(filePath, lines.filter((l, i, a) => l.length || i < a.length - 1).join("\n") + "\n");
  console.log("Updated", filePath);
}

const root = path.join(__dirname, "..");

upsertEnv(path.join(root, ".env.local"), {
  NEXT_PUBLIC_CHAIN_ID: String(d.chainId ?? 97),
  NEXT_PUBLIC_LAE_MATRIX_CONTRACT: matrixCore,
  NEXT_PUBLIC_MATRIX_CORE_CONTRACT: matrixCore,
  NEXT_PUBLIC_MATRIX_CORE_DEPLOY_BLOCK: deployBlock,
  NEXT_PUBLIC_LAE_MATRIX_DEPLOY_BLOCK: deployBlock,
  NEXT_PUBLIC_PAYMENT_TOKEN: d.paymentToken ?? d.contracts?.TestPaymentToken,
  NEXT_PUBLIC_LAE_COIN_CONTRACT: d.laeCoin ?? d.contracts?.LAECoin,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
});

upsertEnv(path.join(root, "backend", ".env"), {
  LAE_MATRIX_CONTRACT_ADDRESS: matrixCore,
  MATRIX_CORE_CONTRACT_ADDRESS: matrixCore,
  LAE_MATRIX_DEPLOY_BLOCK: deployBlock,
  MATRIX_CORE_DEPLOY_BLOCK: deployBlock,
  INDEXER_START_BLOCK: deployBlock,
  LAE_COIN_CONTRACT_ADDRESS: d.laeCoin ?? d.contracts?.LAECoin,
  PAYMENT_TOKEN_ADDRESS: d.paymentToken ?? d.contracts?.TestPaymentToken,
  CHAIN_ID: String(d.chainId ?? 97),
});

console.log("\nDone. Restart frontend + backend.");
console.log(JSON.stringify(d, null, 2));
