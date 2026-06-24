#!/usr/bin/env node
/**
 * Deploy MatrixCore (+ optional LAECoin) to BSC Testnet (chain 97).
 *
 * Required env:
 *   DEPLOYER_PRIVATE_KEY=0x...
 *
 * Optional env:
 *   BSC_RPC_URL
 *   PAYMENT_TOKEN          — existing BEP-20 (default: testnet mock)
 *   DEPLOY_LAECOIN=1       — also deploy LAECoin (default: 1)
 *   ENTRY_PRICE_WEI        — default 1000000000000000 (= 0.001 × 10^18)
 *   TREASURY_WALLET        — default: deployer
 *   ROOT_WALLET            — user #1 wallet (default: deployer)
 *   ADMIN_WALLET           — Ownable admin (default: deployer)
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node contracts/deploy-matrix-core-bsc-testnet.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import solc from "solc";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RPC = process.env.BSC_RPC_URL ?? "https://data-seed-prebsc-1-s1.binance.org:8545";
const CHAIN_ID = 97;

const PAYMENT_TOKEN =
  process.env.PAYMENT_TOKEN ?? "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575";
const ENTRY_PRICE = BigInt(process.env.ENTRY_PRICE_WEI ?? "1000000000000000"); // 0.001 @ 18 dec
const DEPLOY_LAECOIN = process.env.DEPLOY_LAECOIN !== "0";

const MATRIX_FILES = [
  "MatrixStorage.sol",
  "MatrixIncome.sol",
  "MatrixRecycle.sol",
  "MatrixPlacement.sol",
  "MatrixCore.sol",
];

function compileMatrixCore() {
  const matrixDir = path.join(__dirname, "matrix");
  const repoNodeModules = path.join(ROOT, "node_modules");
  const sources = {};
  for (const f of MATRIX_FILES) {
    sources[f] = { content: fs.readFileSync(path.join(matrixDir, f), "utf8") };
  }
  function findImport(importPath) {
    try {
      return { contents: fs.readFileSync(path.join(repoNodeModules, importPath), "utf8") };
    } catch {
      return { error: "File not found: " + importPath };
    }
  }
  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
  for (const e of output.errors ?? []) {
    if (e.severity === "error") {
      console.error(e.formattedMessage);
      process.exit(1);
    }
  }
  const c = output.contracts["MatrixCore.sol"].MatrixCore;
  return { abi: c.abi, bytecode: c.evm.bytecode.object };
}

function compileLaeCoin() {
  const source = fs.readFileSync(path.join(__dirname, "LAECoin.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "LAECoin.sol": { content: source } },
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
  const c = output.contracts["LAECoin.sol"].LAECoin;
  return { abi: c.abi, bytecode: c.evm.bytecode.object };
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("ERROR: Set DEPLOYER_PRIVATE_KEY=0x... in your terminal.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const wallet = new ethers.Wallet(pk, provider);
  const treasury = process.env.TREASURY_WALLET ?? wallet.address;
  const rootWallet = process.env.ROOT_WALLET ?? wallet.address;
  const admin = process.env.ADMIN_WALLET ?? wallet.address;

  const bal = await provider.getBalance(wallet.address);
  console.log("Network:     BSC Testnet (97)");
  console.log("RPC:         ", RPC);
  console.log("Deployer:    ", wallet.address);
  console.log("BNB balance: ", ethers.formatEther(bal));
  if (bal === 0n) {
    console.error("\nFund deployer with testnet BNB:");
    console.error("https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  console.log("\nConfig:");
  console.log("  paymentToken:  ", PAYMENT_TOKEN);
  console.log("  entryPrice:    ", ENTRY_PRICE.toString(), "(0.001 token if 18 decimals)");
  console.log("  treasuryWallet:", treasury);
  console.log("  rootWallet:    ", rootWallet, "(becomes User #1)");
  console.log("  admin:         ", admin);

  const gas = { gasLimit: 8_000_000n };
  let laeCoinAddr = process.env.LAE_COIN_CONTRACT ?? null;

  if (DEPLOY_LAECOIN && !laeCoinAddr) {
    console.log("\n[1/2] Deploy LAECoin...");
    const compiled = compileLaeCoin();
    const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);
    const coin = await factory.deploy(gas);
    await coin.waitForDeployment();
    laeCoinAddr = await coin.getAddress();
    console.log("      LAECoin:", laeCoinAddr);

    const coinC = new ethers.Contract(laeCoinAddr, compiled.abi, wallet);
    let tx = await coinC.setWallets(treasury, treasury, treasury);
    await tx.wait();
    tx = await coinC.bootstrapSupply(
      ethers.parseEther("400000"),
      ethers.parseEther("20000"),
      ethers.parseEther("20000"),
      ethers.parseEther("10000")
    );
    await tx.wait();
    tx = await coinC.setP2PPaymentToken(PAYMENT_TOKEN);
    await tx.wait();
    tx = await coinC.setP2PEnabled(true);
    await tx.wait();
    console.log("      LAECoin wired (bootstrap 400k reward pool)");
  } else if (laeCoinAddr) {
    console.log("\n[1/2] Skip LAECoin — using", laeCoinAddr);
  } else {
    console.log("\n[1/2] Skip LAECoin (DEPLOY_LAECOIN=0)");
  }

  console.log("\n[2/2] Deploy MatrixCore...");
  const matrixCompiled = compileMatrixCore();
  const matrixFactory = new ethers.ContractFactory(
    matrixCompiled.abi,
    matrixCompiled.bytecode,
    wallet
  );
  const matrix = await matrixFactory.deploy(
    PAYMENT_TOKEN,
    ENTRY_PRICE,
    treasury,
    rootWallet,
    admin,
    gas
  );
  await matrix.waitForDeployment();
  const matrixAddr = await matrix.getAddress();
  console.log("      MatrixCore:", matrixAddr);

  const matrixC = new ethers.Contract(matrixAddr, matrixCompiled.abi, wallet);
  const lastUserId = await matrixC.lastUserId();
  const rootMatrix = await matrixC.getUserMatrix(1);
  console.log("      lastUserId:", lastUserId.toString());
  console.log("      root wallet:", rootMatrix[1] ?? rootMatrix.wallet);

  if (laeCoinAddr) {
    try {
      const coinAbi = ["function setMatrixContract(address) external"];
      const coinC = new ethers.Contract(laeCoinAddr, coinAbi, wallet);
      const tx = await coinC.setMatrixContract(matrixAddr);
      await tx.wait();
      console.log("      LAECoin.setMatrixContract → MatrixCore");
    } catch (e) {
      console.warn("      (skip LAECoin wire — not owner or already set)");
    }
  }

  const deployBlock = await provider.getBlockNumber();
  const addresses = {
    chainId: CHAIN_ID,
    network: "bscTestnet",
    deployer: wallet.address,
    paymentToken: PAYMENT_TOKEN,
    matrixCore: matrixAddr,
    matrixContract: "MatrixCore",
    laeCoin: laeCoinAddr,
    entryPriceWei: ENTRY_PRICE.toString(),
    treasuryWallet: treasury,
    rootWallet,
    adminWallet: admin,
    matrixCoreDeployBlock: deployBlock,
    deployBlock,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "deployed-bsc-testnet.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\n✓ Saved", outPath);
  console.log("\n--- Next steps ---");
  console.log("1. node contracts/update-env-from-deploy.mjs");
  console.log("2. cd backend && npx prisma migrate deploy");
  console.log("3. Restart backend indexer");
  console.log("4. Admin → Settings → Reset indexer → Sync from deploy block");
  console.log("\nBSCScan:", `https://testnet.bscscan.com/address/${matrixAddr}`);
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
