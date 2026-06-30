#!/usr/bin/env node
/**
 * Redeploy LAEClubMatrix only (keep existing LAECoin + payment token).
 * Updates repo env defaults + workflow fallbacks. Does NOT seed users.
 *
 * Required: DEPLOYER_PRIVATE_KEY=0x...
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node contracts/deploy-lae-matrix-only.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import solc from "solc";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org";
const CHAIN_ID = 97;

const LAE_COIN =
  process.env.LAE_COIN_CONTRACT ?? "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A";
const PAYMENT_TOKEN =
  process.env.PAYMENT_TOKEN ?? "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575";
const OWNER =
  process.env.OWNER_WALLET ?? "0xef9594fC5145404BfC7B5640296C3864319e3d86";
const CLUB_POOL = process.env.CLUB_POOL ?? OWNER;
const TREASURY = process.env.TREASURY_WALLET ?? OWNER;
const LIQUIDITY_POOL = process.env.LIQUIDITY_POOL ?? OWNER;

const DEPLOY_JSON = path.join(__dirname, "deployed-bsc-testnet.json");

function compileMatrix() {
  const source = fs.readFileSync(path.join(__dirname, "LAEClubMatrix.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "LAEClubMatrix.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  for (const e of output.errors ?? []) {
    if (e.severity === "error") {
      console.error(e.formattedMessage);
      process.exit(1);
    }
  }
  const c = output.contracts["LAEClubMatrix.sol"].LAEClubMatrix;
  return { abi: c.abi, bytecode: c.evm.bytecode.object };
}

function readPrevDeploy() {
  if (!fs.existsSync(DEPLOY_JSON)) return { contracts: {}, deployBlock: 0 };
  return JSON.parse(fs.readFileSync(DEPLOY_JSON, "utf8"));
}

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
  console.log("      Updated", path.relative(ROOT, filePath));
}

function patchRepoContractDefaults(prevMatrix, prevBlock, matrixAddr, deployBlock) {
  const files = [
    path.join(ROOT, "lib", "lae-club", "contracts.ts"),
    path.join(ROOT, "backend", "src", "config", "chains.ts"),
    path.join(ROOT, ".github", "workflows", "deploy-vps.yml"),
    path.join(ROOT, ".github", "workflows", "deploy-backend-vps.yml"),
    path.join(ROOT, "scripts", "production-readiness.mjs"),
    path.join(ROOT, "backend", "scripts", "production-readiness.mjs"),
  ];
  for (const fp of files) {
    if (!fs.existsSync(fp)) continue;
    let text = fs.readFileSync(fp, "utf8");
    let next = text;
    if (prevMatrix) next = next.replaceAll(prevMatrix, matrixAddr);
    next = next.replaceAll(String(matrixAddr), matrixAddr);
    if (prevBlock) next = next.replaceAll(String(prevBlock), String(deployBlock));
    if (next !== text) {
      fs.writeFileSync(fp, next);
      console.log("      Patched", path.relative(ROOT, fp));
    }
  }
}

function updateEnvFiles(matrixAddr, deployBlock) {
  upsertEnv(path.join(ROOT, ".env.local"), {
    NEXT_PUBLIC_CHAIN_ID: "97",
    NEXT_PUBLIC_LAE_MATRIX_CONTRACT: matrixAddr,
    NEXT_PUBLIC_MATRIX_CORE_CONTRACT: matrixAddr,
    NEXT_PUBLIC_MATRIX_CORE_DEPLOY_BLOCK: String(deployBlock),
    NEXT_PUBLIC_LAE_MATRIX_DEPLOY_BLOCK: String(deployBlock),
    NEXT_PUBLIC_PAYMENT_TOKEN: PAYMENT_TOKEN,
    NEXT_PUBLIC_LAE_COIN_CONTRACT: LAE_COIN,
  });
  upsertEnv(path.join(ROOT, "backend", ".env"), {
    LAE_MATRIX_CONTRACT_ADDRESS: matrixAddr,
    MATRIX_CORE_CONTRACT_ADDRESS: matrixAddr,
    LAE_MATRIX_DEPLOY_BLOCK: String(deployBlock),
    MATRIX_CORE_DEPLOY_BLOCK: String(deployBlock),
    INDEXER_START_BLOCK: String(deployBlock),
    PAYMENT_TOKEN_ADDRESS: PAYMENT_TOKEN,
    LAE_COIN_CONTRACT_ADDRESS: LAE_COIN,
    CHAIN_ID: "97",
  });
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("Set DEPLOYER_PRIVATE_KEY=0x...");
    process.exit(1);
  }

  const prev = readPrevDeploy();
  const prevMatrix = prev.contracts?.LAEClubMatrix ?? "";
  const prevBlock = prev.deployBlock ?? 0;

  const compiled = compileMatrix();
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
  const wallet = new ethers.Wallet(pk, provider);
  const bal = await provider.getBalance(wallet.address);
  console.log("BSC Testnet — matrix deploy only (no seed)");
  console.log("Deployer:", wallet.address);
  console.log("BNB:", ethers.formatEther(bal));
  if (bal === 0n) process.exit(1);

  const gas = { gasLimit: 8_000_000n };
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const matrix = await factory.deploy(OWNER, PAYMENT_TOKEN, CLUB_POOL, TREASURY, gas);
  await matrix.waitForDeployment();
  const matrixAddr = await matrix.getAddress();
  console.log("LAEClubMatrix:", matrixAddr);

  const matrixC = new ethers.Contract(matrixAddr, compiled.abi, wallet);
  let tx = await matrixC.setLaeCoin(LAE_COIN);
  await tx.wait();
  tx = await matrixC.setLiquidityPool(LIQUIDITY_POOL);
  await tx.wait();

  const laeCoinAbi = [
    "function setMatrixContract(address) external",
    "function setTaxExempt(address,bool) external",
  ];
  const coinC = new ethers.Contract(LAE_COIN, laeCoinAbi, wallet);
  tx = await coinC.setMatrixContract(matrixAddr);
  await tx.wait();
  tx = await coinC.setTaxExempt(matrixAddr, true);
  await tx.wait();

  const deployBlock = (await tx.wait()).blockNumber;
  console.log("deployBlock:", deployBlock);

  const addresses = {
    ...prev,
    chainId: CHAIN_ID,
    network: "bsc-testnet",
    contracts: {
      ...(prev.contracts ?? {}),
      LAEClubMatrix: matrixAddr,
      LAECoin: LAE_COIN,
      TestPaymentToken: PAYMENT_TOKEN,
    },
    deployBlock,
    deployedAt: new Date().toISOString().slice(0, 10),
    owner: OWNER,
    seededUsers: 0,
  };
  fs.writeFileSync(DEPLOY_JSON, JSON.stringify(addresses, null, 2));

  console.log("\n[wire] env + repo defaults");
  updateEnvFiles(matrixAddr, deployBlock);
  patchRepoContractDefaults(prevMatrix, prevBlock, matrixAddr, deployBlock);

  console.log("\n✓ Done — seed locally when ready:");
  console.log(
    `DEPLOYER_PRIVATE_KEY=0x... SKIP_DEPLOY=1 MATRIX_ADDRESS=${matrixAddr} MAX_USERS=200 node contracts/deploy-and-seed-testnet.mjs`
  );
  console.log("BSCScan:", `https://testnet.bscscan.com/address/${matrixAddr}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
