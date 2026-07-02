#!/usr/bin/env node
/**
 * Deploy fresh LAEClubMatrix on BSC Testnet — owner (#1) only, NO seeding.
 *
 * Required: DEPLOYER_PRIVATE_KEY (owner wallet with testnet BNB)
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node contracts/deploy-fresh-testnet.mjs
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

const LAE_COIN = process.env.LAE_COIN_CONTRACT ?? "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A";
const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN ?? "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575";
const OWNER = process.env.OWNER_WALLET ?? "0xef9594fC5145404BfC7B5640296C3864319e3d86";
const CLUB_POOL = process.env.CLUB_POOL ?? OWNER;
const TREASURY = process.env.TREASURY_WALLET ?? OWNER;
const LIQUIDITY_POOL = process.env.LIQUIDITY_POOL ?? OWNER;

function compileContracts() {
  const matrixSource = fs.readFileSync(path.join(__dirname, "LAEClubMatrix.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "LAEClubMatrix.sol": { content: matrixSource } },
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
  return {
    abi: output.contracts["LAEClubMatrix.sol"].LAEClubMatrix.abi,
    bytecode: output.contracts["LAEClubMatrix.sol"].LAEClubMatrix.evm.bytecode.object,
  };
}

function readPrevDeployJson() {
  const p = path.join(__dirname, "deployed-bsc-testnet.json");
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
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
    if (prevMatrix && prevMatrix.toLowerCase() !== matrixAddr.toLowerCase()) {
      next = next.replaceAll(prevMatrix, matrixAddr);
    }
    if (prevBlock && String(prevBlock) !== String(deployBlock)) {
      next = next.replaceAll(String(prevBlock), String(deployBlock));
    }
    if (next !== text) {
      fs.writeFileSync(fp, next);
      console.log("      Patched", path.relative(ROOT, fp));
    }
  }
}

function updateEnvFiles(matrixAddr, deployBlock, prevDeploy) {
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
  upsertEnv(path.join(ROOT, "backend", ".env.production"), {
    LAE_MATRIX_CONTRACT_ADDRESS: matrixAddr,
    MATRIX_CORE_CONTRACT_ADDRESS: matrixAddr,
    LAE_MATRIX_DEPLOY_BLOCK: String(deployBlock),
    MATRIX_CORE_DEPLOY_BLOCK: String(deployBlock),
    INDEXER_START_BLOCK: String(deployBlock),
  });
  patchRepoContractDefaults(
    prevDeploy.contracts?.LAEClubMatrix,
    prevDeploy.deployBlock,
    matrixAddr,
    deployBlock
  );
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("ERROR: Set DEPLOYER_PRIVATE_KEY=0x...");
    process.exit(1);
  }

  const prevDeploy = readPrevDeployJson();
  const compiled = compileContracts();
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
  const wallet = new ethers.Wallet(pk, provider);
  const bal = await provider.getBalance(wallet.address);

  console.log("=== Fresh LAEClubMatrix deploy (owner only, no seed) ===");
  console.log("Deployer:", wallet.address);
  console.log("Owner:   ", OWNER);
  console.log("BNB:     ", ethers.formatEther(bal));

  const minBnb = ethers.parseEther(process.env.MIN_DEPLOY_BNB ?? "0.005");
  if (bal < minBnb) {
    console.error(`\nERROR: Need at least ${ethers.formatEther(minBnb)} tBNB.`);
    console.error("Fund:", wallet.address);
    console.error("Faucet: https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  console.log("\n[1/3] Deploy LAEClubMatrix...");
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const matrix = await factory.deploy(OWNER, PAYMENT_TOKEN, CLUB_POOL, TREASURY, {
    gasLimit: 6_000_000n,
  });
  const deployTx = matrix.deploymentTransaction();
  const deployReceipt = await deployTx.wait();
  const matrixAddr = await matrix.getAddress();
  const deployBlock = deployReceipt.blockNumber;
  console.log("      Matrix:", matrixAddr);
  console.log("      Block: ", deployBlock);

  const matrixC = new ethers.Contract(matrixAddr, compiled.abi, wallet);

  console.log("\n[2/3] Wire LAE coin + liquidity pool...");
  await (await matrixC.setLaeCoin(LAE_COIN)).wait();
  await (await matrixC.setLiquidityPool(LIQUIDITY_POOL)).wait();

  try {
    const laeAbi = [
      "function setMatrixContract(address) external",
      "function setTaxExempt(address,bool) external",
    ];
    const coin = new ethers.Contract(LAE_COIN, laeAbi, wallet);
    await (await coin.setMatrixContract(matrixAddr)).wait();
    await (await coin.setTaxExempt(matrixAddr, true)).wait();
    console.log("      LAECoin.setMatrixContract OK");
  } catch (e) {
    console.log("      LAECoin wiring skipped:", e.shortMessage ?? e.message);
  }

  const lastUserId = await matrixC.lastUserId();
  const ownerId = await matrixC.addressToId(OWNER);
  console.log("\n[verify] lastUserId:", lastUserId.toString(), "| owner id:", ownerId.toString());

  console.log("\n[3/3] Save config...");
  const addresses = {
    chainId: CHAIN_ID,
    network: "bsc-testnet",
    contracts: {
      LAEClubMatrix: matrixAddr,
      LAECoin: LAE_COIN,
      TestPaymentToken: PAYMENT_TOKEN,
    },
    deployBlock,
    deployedAt: new Date().toISOString().slice(0, 10),
    owner: OWNER,
    seededUsers: 0,
    seedNote: "Fresh deploy — owner #1 only",
    contractType: "closed-loop-upline",
  };
  fs.writeFileSync(
    path.join(__dirname, "deployed-bsc-testnet.json"),
    JSON.stringify(addresses, null, 2)
  );
  updateEnvFiles(matrixAddr, deployBlock, prevDeploy);

  console.log("\n✓ Done");
  console.log("Matrix:     ", matrixAddr);
  console.log("DeployBlock:", deployBlock);
  console.log("BSCScan:    ", `https://testnet.bscscan.com/address/${matrixAddr}`);
  console.log("\nNext: push to main → backend deploy with reset_indexer=true");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
