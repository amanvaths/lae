#!/usr/bin/env node
/**
 * Deploy LAEClubMatrix (optional) + seed binary-tree users on BSC Testnet.
 *
 * Uses registrationSys — deployer wallet pays; user addresses are deterministic
 * (no manual MetaMask per ID).
 *
 * Required:
 *   DEPLOYER_PRIVATE_KEY=0x...   (must be contract owner / deployer)
 *
 * Optional:
 *   BSC_RPC_URL
 *   MAX_USERS=50                 (users #2..MAX, default 50 → 49 registrations after partners)
 *   SKIP_DEPLOY=1                seed only on existing MATRIX_ADDRESS
 *   MATRIX_ADDRESS=0x...
 *   PAYMENT_TOKEN, LAE_COIN_CONTRACT, OWNER_WALLET
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node contracts/deploy-and-seed-testnet.mjs
 *   DEPLOYER_PRIVATE_KEY=0x... SKIP_DEPLOY=1 MATRIX_ADDRESS=0x... node contracts/deploy-and-seed-testnet.mjs
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
const MAX_USERS = Number(process.env.MAX_USERS ?? "200");
const SKIP_DEPLOY = process.env.SKIP_DEPLOY === "1";

function addrForUserId(userId) {
  return ethers.getAddress(ethers.zeroPadValue(ethers.toBeHex(BigInt(userId) + 0x100000n), 20));
}

function buildBinaryTreeSponsors(maxId) {
  const sponsors = [];
  const ids = [1];
  let next = 0;
  let childCount = 0;
  for (let id = 2; id <= maxId; id++) {
    sponsors.push([id, ids[next]]);
    ids.push(id);
    childCount++;
    if (childCount === 2) {
      childCount = 0;
      next++;
    }
  }
  return sponsors;
}

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

async function deployMatrix(wallet) {
  console.log("\n[1/4] Deploy LAEClubMatrix...");
  const compiled = compileMatrix();
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const matrix = await factory.deploy(OWNER, PAYMENT_TOKEN, CLUB_POOL, TREASURY, { gasLimit: 8_000_000n });
  await matrix.waitForDeployment();
  const matrixAddr = await matrix.getAddress();
  console.log("      Matrix:", matrixAddr);

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

  const deployBlock = await wallet.provider.getBlockNumber();
  return { matrixAddr, abi: compiled.abi, deployBlock, matrixC };
}

async function ensureTokenFunding(wallet, matrixAddr, regCount) {
  const tokenAbi = [
    "function faucet(uint256) external",
    "function approve(address,uint256) external returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
  ];
  const matrixAbi = ["function levelTokenCost(uint8) view returns (uint256)"];
  const matrix = new ethers.Contract(matrixAddr, matrixAbi, wallet);
  const price = await matrix.levelTokenCost(1);
  const need = price * BigInt(regCount + 5);
  const token = new ethers.Contract(PAYMENT_TOKEN, tokenAbi, wallet);
  const bal = await token.balanceOf(wallet.address);
  console.log("\n[2/4] Payment token — need", ethers.formatEther(need), "have", ethers.formatEther(bal));
  if (bal < need) {
    console.log("      Faucet top-up...");
    const chunk = ethers.parseEther("1000");
    let left = need - bal;
    while (left > 0n) {
      const mint = left > chunk ? chunk : left;
      await (await token.faucet(mint)).wait();
      left -= mint;
    }
  }
  const allowance = await token.allowance(wallet.address, matrixAddr);
  if (allowance < need) {
    console.log("      Approve matrix...");
    await (await token.approve(matrixAddr, ethers.MaxUint256)).wait();
  }
}

function parseReceiptEvents(iface, receipt) {
  const out = { registrations: [], payments: [], placements: [] };
  for (const log of receipt.logs) {
    try {
      const p = iface.parseLog(log);
      if (p.name === "Registration") {
        out.registrations.push({ userId: Number(p.args.userId) });
      } else if (p.name === "TokenReceived") {
        out.payments.push({
          receiverId: Number(p.args.receiverId),
          fromUserId: Number(p.args.fromId),
          level: Number(p.args.level),
          amount: p.args.amount.toString(),
        });
      } else if (p.name === "NewUserPlace") {
        out.placements.push({
          userId: Number(p.args.user),
          boardOwnerId: Number(p.args.referrer),
          level: Number(p.args.level),
          cycle: Number(p.args.cycle),
          spot: Number(p.args.spot),
        });
      }
    } catch {
      // not our event
    }
  }
  return out;
}

async function seedUsers(matrixC, wallet, maxUsers) {
  console.log("\n[3/4] Seed binary tree — users #2.." + maxUsers);

  const gas = { gasLimit: 10_000_000n };
  const iface = matrixC.interface;
  const allPayments = [];
  const allRegs = [];

  const partnersDone = await matrixC.partnersInitialized();
  if (!partnersDone) {
    console.log("      initializePartners #2, #3...");
    const tx = await matrixC.initializePartners(addrForUserId(2), addrForUserId(3), gas);
    const rcpt = await tx.wait();
    const ev = parseReceiptEvents(iface, rcpt);
    allRegs.push({ step: "partners", tx: rcpt.hash, ...ev });
    console.log("      partners tx:", rcpt.hash);
  } else {
    console.log("      partners already initialized — skip");
  }

  const sponsors = buildBinaryTreeSponsors(maxUsers);
  let done = 0;
  for (const [userId, sponsorId] of sponsors) {
    if (userId <= 3) continue;
    const userAddr = addrForUserId(userId);
    process.stdout.write(`      reg #${userId} under #${sponsorId}... `);
    const tx = await matrixC.registrationSys(sponsorId, userAddr, gas);
    const rcpt = await tx.wait();
    const ev = parseReceiptEvents(iface, rcpt);
    const pay = ev.payments[0];
    const recv = pay ? `#${pay.receiverId}` : "none";
    console.log(`ok → pay ${recv} (L${pay?.level ?? "-"} S? tx ${rcpt.hash.slice(0, 12)}…)`);
    allPayments.push({
      userId,
      sponsorId,
      tx: rcpt.hash,
      payment: pay ?? null,
      placementCount: ev.placements.length,
    });
    allRegs.push({ userId, sponsorId, tx: rcpt.hash, events: ev });
    done++;
  }
  console.log("      registered", done, "users");
  return { allPayments, allRegs };
}

function saveDeployJson(matrixAddr, deployBlock, wallet) {
  const prev = fs.existsSync(path.join(__dirname, "deployed-bsc-testnet.json"))
    ? JSON.parse(fs.readFileSync(path.join(__dirname, "deployed-bsc-testnet.json"), "utf8"))
    : {};
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
    seededUsers: MAX_USERS,
  };
  fs.writeFileSync(path.join(__dirname, "deployed-bsc-testnet.json"), JSON.stringify(addresses, null, 2));
  return addresses;
}

function updateEnvFiles(matrixAddr, deployBlock) {
  const d = {
    chainId: CHAIN_ID,
    matrixCore: matrixAddr,
    matrix: matrixAddr,
    deployBlock,
    paymentToken: PAYMENT_TOKEN,
    laeCoin: LAE_COIN,
  };

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

  patchRepoContractDefaults(matrixAddr, deployBlock);
}

/** Keep hardcoded fallbacks in repo aligned after fresh deploy. */
function patchRepoContractDefaults(matrixAddr, deployBlock) {
  const oldMatrix = /0x912623C0Dd9f0aeF626080438DA41322A7E93425/gi;
  const oldBlock = /116339372/g;
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
    const next = text.replace(oldMatrix, matrixAddr).replace(oldBlock, String(deployBlock));
    if (next !== text) {
      fs.writeFileSync(fp, next);
      console.log("      Patched", path.relative(ROOT, fp));
    }
  }
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("ERROR: Set DEPLOYER_PRIVATE_KEY=0x... (owner wallet with testnet BNB)");
    console.error("Fund BNB: https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
  const wallet = new ethers.Wallet(pk, provider);
  const bal = await provider.getBalance(wallet.address);
  console.log("BSC Testnet deploy + seed");
  console.log("Deployer:", wallet.address);
  console.log("BNB:", ethers.formatEther(bal));
  console.log("MAX_USERS:", MAX_USERS);
  if (bal === 0n) process.exit(1);

  let matrixAddr = process.env.MATRIX_ADDRESS;
  let deployBlock = 0;
  let abi;

  if (SKIP_DEPLOY && matrixAddr) {
    console.log("\nSKIP_DEPLOY — using", matrixAddr);
    const compiled = compileMatrix();
    abi = compiled.abi;
    deployBlock = Number(process.env.DEPLOY_BLOCK ?? "0");
  } else {
    const d = await deployMatrix(wallet);
    matrixAddr = d.matrixAddr;
    abi = d.abi;
    deployBlock = d.deployBlock;
  }

  const matrixC = new ethers.Contract(matrixAddr, abi, wallet);
  const regCount = Math.max(0, MAX_USERS - 3);
  await ensureTokenFunding(wallet, matrixAddr, regCount);

  const { allPayments, allRegs } = await seedUsers(matrixC, wallet, MAX_USERS);

  console.log("\n[4/4] Save config + payment log");
  saveDeployJson(matrixAddr, deployBlock, wallet);
  updateEnvFiles(matrixAddr, deployBlock);

  const logPath = path.join(__dirname, "seed-payments-testnet.json");
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      {
        matrix: matrixAddr,
        deployBlock,
        maxUsers: MAX_USERS,
        payments: allPayments,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log("\n✓ Matrix:", matrixAddr);
  console.log("✓ Deploy block:", deployBlock);
  console.log("✓ Payment log:", logPath);
  console.log("\n--- Payment summary (who received from whom) ---");
  console.log("UserID | Sponsor | Receiver | Level");
  for (const row of allPayments) {
    const p = row.payment;
    const recv = p ? `#${p.receiverId}` : "-";
    console.log(
      `${String(row.userId).padStart(6)} | ${String(row.sponsorId).padStart(7)} | ${recv.padStart(8)} | L${p?.level ?? "-"}`
    );
  }

  console.log("\n--- Next: reindex backend ---");
  console.log("cd backend && npm run build && node scripts/post-deploy-reindex.mjs");
  console.log("(or Admin → Reset indexer on VPS)");
  console.log("\nBSCScan:", `https://testnet.bscscan.com/address/${matrixAddr}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
