#!/usr/bin/env node
/**
 * Deploy TestPaymentToken (public faucet) and point LAEClubMatrix + LAECoin to it.
 *
 * Requires:
 *   DEPLOYER_PRIVATE_KEY  — must be matrix owner (0xef9594... or current owner)
 *
 * Optional env:
 *   BSC_RPC_URL
 *   LAE_MATRIX_CONTRACT   (default: deployed-bsc-testnet.json)
 *   LAE_COIN_CONTRACT
 *   UPDATE_MATRIX=1       (default) — call updateTokenAddress on matrix
 *   UPDATE_LAE_COIN=1     (default) — call setP2PPaymentToken on LAECoin
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node contracts/deploy-test-token.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import solc from "solc";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.publicnode.com";
const CHAIN_ID = 97;

const deployedPath = path.join(__dirname, "deployed-bsc-testnet.json");
const deployed = fs.existsSync(deployedPath)
  ? JSON.parse(fs.readFileSync(deployedPath, "utf8"))
  : {};

const MATRIX =
  process.env.LAE_MATRIX_CONTRACT ??
  deployed.matrix ??
  "0x431c0d8cdff03D85a6446C9D63947d3C4A5ad1E5";
const LAECOIN =
  process.env.LAE_COIN_CONTRACT ??
  deployed.laeCoin ??
  "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A";

function compileTestToken() {
  const source = fs.readFileSync(path.join(__dirname, "TestPaymentToken.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "TestPaymentToken.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
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
  const c = output.contracts["TestPaymentToken.sol"].TestPaymentToken;
  return { abi: c.abi, bytecode: c.evm.bytecode.object };
}

const matrixAbi = [
  "function updateTokenAddress(address newToken) external",
  "function owner() view returns (address)",
  "function PAYMENT_TOKEN() view returns (address)",
];

const laeCoinAbi = [
  "function setP2PPaymentToken(address token) external",
  "function owner() view returns (address)",
];

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("Set DEPLOYER_PRIVATE_KEY (matrix owner wallet).");
    process.exit(1);
  }

  const compiled = compileTestToken();
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const wallet = new ethers.Wallet(pk, provider);

  console.log("Deployer:", wallet.address);
  console.log("Matrix:  ", MATRIX);
  console.log("LAECoin: ", LAECOIN);

  const matrix = new ethers.Contract(MATRIX, matrixAbi, wallet);
  const owner = await matrix.owner();
  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.error(`Wallet is not matrix owner. Owner=${owner}`);
    process.exit(1);
  }

  console.log("\n1. Deploy TestPaymentToken (public faucet)...");
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const token = await factory.deploy({ gasLimit: 2_000_000n });
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("   TestPaymentToken:", tokenAddr);
  console.log("   BSCScan:", `https://testnet.bscscan.com/address/${tokenAddr}`);

  if (process.env.UPDATE_MATRIX !== "0") {
    console.log("\n2. Matrix.updateTokenAddress...");
    const tx = await matrix.updateTokenAddress(tokenAddr, { gasLimit: 200_000n });
    await tx.wait();
    console.log("   tx:", tx.hash);
    console.log("   PAYMENT_TOKEN now:", await matrix.PAYMENT_TOKEN());
  }

  if (process.env.UPDATE_LAE_COIN !== "0") {
    console.log("\n3. LAECoin.setP2PPaymentToken...");
    const coin = new ethers.Contract(LAECOIN, laeCoinAbi, wallet);
    const coinOwner = await coin.owner();
    if (coinOwner.toLowerCase() === wallet.address.toLowerCase()) {
      const tx = await coin.setP2PPaymentToken(tokenAddr, { gasLimit: 200_000n });
      await tx.wait();
      console.log("   tx:", tx.hash);
    } else {
      console.log("   skip — wallet is not LAECoin owner");
    }
  }

  deployed.paymentToken = tokenAddr;
  deployed.testPaymentToken = tokenAddr;
  deployed.testPaymentTokenDeployedAt = new Date().toISOString();
  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));

  console.log("\n--- Update GitHub secret + redeploy frontend ---");
  console.log(`NEXT_PUBLIC_PAYMENT_TOKEN=${tokenAddr}`);
  console.log(`NEXT_PUBLIC_DAI_CONTRACT=${tokenAddr}`);
  console.log(`DAI_CONTRACT_ADDRESS=${tokenAddr}`);
  console.log("\nSaved", deployedPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
