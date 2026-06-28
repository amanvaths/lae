#!/usr/bin/env node
/**
 * Redeploy LAEClubMatrix only (keep existing LAECoin + payment token).
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
const RPC = process.env.BSC_RPC_URL ?? "https://data-seed-prebsc-1-s1.binance.org:8545";
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

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("Set DEPLOYER_PRIVATE_KEY=0x...");
    process.exit(1);
  }

  const compiled = compileMatrix();
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const wallet = new ethers.Wallet(pk, provider);
  const bal = await provider.getBalance(wallet.address);
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

  const deployBlock = await provider.getBlockNumber();
  const prev = JSON.parse(
    fs.readFileSync(path.join(__dirname, "deployed-bsc-testnet.json"), "utf8")
  );
  const addresses = {
    ...prev,
    contracts: {
      ...prev.contracts,
      LAEClubMatrix: matrixAddr,
    },
    deployBlock,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(__dirname, "deployed-bsc-testnet.json"),
    JSON.stringify(addresses, null, 2)
  );
  console.log("deployBlock:", deployBlock);
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
