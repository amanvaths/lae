#!/usr/bin/env node
/**
 * Deploy LAE Club contracts to BSC Testnet (chain 97).
 * Requires: DEPLOYER_PRIVATE_KEY in env
 * Optional: PAYMENT_TOKEN (default testnet mock DAI)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import solc from "solc";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPC = process.env.BSC_RPC_URL ?? "https://data-seed-prebsc-1-s1.binance.org:8545";
const CHAIN_ID = 97;
const PAYMENT_TOKEN =
  process.env.PAYMENT_TOKEN ?? "0xf8E556996042b34cc706F040c59955abB678995e";

const FILES = [
  "LAECoin.sol",
  "LAEClubMatrix.sol",
];

function compile() {
  const sources = {};
  for (const f of FILES) {
    sources[f] = { content: fs.readFileSync(path.join(__dirname, f), "utf8") };
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
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  for (const e of output.errors ?? []) {
    if (e.severity === "error") {
      console.error(e.formattedMessage);
      process.exit(1);
    }
  }
  const out = {};
  for (const f of FILES) {
    const name = f.replace(".sol", "");
    const c = output.contracts[f][name];
    out[name] = { abi: c.abi, bytecode: c.evm.bytecode.object };
  }
  return out;
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("Set DEPLOYER_PRIVATE_KEY to deploy.");
    process.exit(1);
  }

  const compiled = compile();
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const wallet = new ethers.Wallet(pk, provider);
  const bal = await provider.getBalance(wallet.address);
  console.log("Deployer:", wallet.address);
  console.log("BNB balance:", ethers.formatEther(bal));
  if (bal === 0n) {
    console.error("Deployer needs testnet BNB. Fund via https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  const gasOpts = { gasLimit: 8_000_000n };

  console.log("\n1. Deploy LAECoin...");
  const coinFactory = new ethers.ContractFactory(
    compiled.LAECoin.abi,
    compiled.LAECoin.bytecode,
    wallet
  );
  const coin = await coinFactory.deploy(gasOpts);
  await coin.waitForDeployment();
  const coinAddr = await coin.getAddress();
  console.log("   LAECoin:", coinAddr);

  const treasury = wallet.address;
  const clubPool = wallet.address;
  const platformTreasury = wallet.address;
  const liquidityWallet = wallet.address;
  const operationsWallet = wallet.address;

  console.log("\n2. Deploy LAEClubMatrix...");
  const matrixFactory = new ethers.ContractFactory(
    compiled.LAEClubMatrix.abi,
    compiled.LAEClubMatrix.bytecode,
    wallet
  );
  const matrix = await matrixFactory.deploy(
    wallet.address,
    PAYMENT_TOKEN,
    clubPool,
    platformTreasury,
    gasOpts
  );
  await matrix.waitForDeployment();
  const matrixAddr = await matrix.getAddress();
  console.log("   Matrix:", matrixAddr);

  console.log("\n3. Wire contracts...");
  const coinC = new ethers.Contract(coinAddr, compiled.LAECoin.abi, wallet);
  const matrixC = new ethers.Contract(matrixAddr, compiled.LAEClubMatrix.abi, wallet);

  let tx = await coinC.setWallets(treasury, liquidityWallet, operationsWallet);
  await tx.wait();
  tx = await coinC.setMatrixContract(matrixAddr);
  await tx.wait();
  tx = await coinC.bootstrapSupply(
    ethers.parseEther("450000"),
    ethers.parseEther("20000"),
    ethers.parseEther("20000"),
    ethers.parseEther("10000")
  );
  await tx.wait();
  console.log("   bootstrapSupply tx:", tx.hash);

  tx = await coinC.setP2PPaymentToken(PAYMENT_TOKEN);
  await tx.wait();
  tx = await coinC.setP2PEnabled(true);
  await tx.wait();
  tx = await coinC.setTaxExempt(matrixAddr, true);
  await tx.wait();

  tx = await matrixC.setLaeCoin(coinAddr);
  await tx.wait();
  tx = await matrixC.setLiquidityPool(liquidityWallet);
  await tx.wait();
  console.log("   Matrix LAE + liquidity pool set");

  const deployBlock = await provider.getBlockNumber();
  const addresses = {
    chainId: CHAIN_ID,
    network: "bscTestnet",
    deployer: wallet.address,
    paymentToken: PAYMENT_TOKEN,
    laeCoin: coinAddr,
    matrix: matrixAddr,
    treasuryWallet: treasury,
    clubPool,
    platformTreasury,
    liquidityWallet,
    operationsWallet,
    deployBlock,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "deployed-bsc-testnet.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\nSaved", outPath);
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
