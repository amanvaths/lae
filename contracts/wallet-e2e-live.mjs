#!/usr/bin/env node
/**
 * Live BSC Testnet wallet E2E — PASS only when tx hashes / chain state confirm.
 * Requires: deployed-bsc-testnet.json + DEPLOYER_PRIVATE_KEY (+ optional USER2_PRIVATE_KEY)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPC = process.env.BSC_RPC_URL ?? "https://data-seed-prebsc-1-s1.binance.org:8545";
const CHAIN_ID = 97;

const ERC20 = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const MATRIX_ABI = [
  "function registrationExt(uint256 referrerId) external",
  "function isUserExists(address) view returns (bool)",
  "function addressToId(address) view returns (uint256)",
  "function users(address) view returns (uint256 id, address referrer, uint256 referrerId, uint256 registrationTimestamp)",
  "function usersXMatrix(address userAddress, uint8 level) view returns (address currentReferrer, address[] referrals, bool blocked, bool reinvest)",
  "function getLaeRewardSummary(address userAddress) view returns (uint256 lockedTotal, uint256 vestedClaimable, uint256 claimedTotal, uint256 directCount, uint256[] monthlyUnlocked)",
  "function claimLaeRewards() external",
  "function levelTokenCost(uint8) view returns (uint256)",
];

const COIN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function createP2POrder(uint256 laeAmount, uint256 pricePerLae) external returns (uint256)",
  "function fillP2POrder(uint256 orderId) external",
  "function cancelP2POrder(uint256 orderId) external",
  "function p2pOrders(uint256) view returns (address seller, uint256 laeAmount, uint256 pricePerLae, bool active)",
  "function nextOrderId() view returns (uint256)",
];

function loadDeploy() {
  const p = path.join(__dirname, "deployed-bsc-testnet.json");
  if (!fs.existsSync(p)) throw new Error(`Missing ${p} — run deploy-bsc-testnet.mjs first`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function report(step, ok, detail) {
  const status = ok ? "PASS" : "FAIL";
  console.log(`[${status}] ${step}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function ensurePaymentToken(payment, wallet, spender, amount) {
  const bal = await payment.balanceOf(wallet.address);
  if (bal < amount) {
    throw new Error(`${wallet.address} needs ${ethers.formatEther(amount)} payment token, has ${ethers.formatEther(bal)}`);
  }
  const allowance = await payment.allowance(wallet.address, spender);
  if (allowance < amount) {
    const tx = await payment.approve(spender, ethers.MaxUint256);
    await tx.wait();
  }
}

async function main() {
  const deploy = loadDeploy();
  const pk1 = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk1) throw new Error("Set DEPLOYER_PRIVATE_KEY (matrix owner / funded wallet)");

  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const owner = new ethers.Wallet(pk1, provider);
  let user2 = process.env.USER2_PRIVATE_KEY
    ? new ethers.Wallet(process.env.USER2_PRIVATE_KEY, provider)
    : ethers.Wallet.createRandom().connect(provider);

  if (!process.env.USER2_PRIVATE_KEY) {
    console.log("Generated user2:", user2.address);
    const fundTx = await owner.sendTransaction({ to: user2.address, value: ethers.parseEther("0.01") });
    await fundTx.wait();
    const payment = new ethers.Contract(deploy.paymentToken, ERC20, owner);
    const regCost = ethers.parseEther("0.001");
    const transferTx = await payment.transfer(user2.address, regCost * 3n);
    await transferTx.wait();
  }

  const matrix = new ethers.Contract(deploy.matrix, MATRIX_ABI, provider);
  const coin = new ethers.Contract(deploy.laeCoin, COIN_ABI, provider);
  const payment = new ethers.Contract(deploy.paymentToken, ERC20, provider);
  const regCost = await matrix.levelTokenCost(1);

  const results = [];

  // --- Registration user2 under owner (id=1) ---
  await ensurePaymentToken(payment.connect(user2), user2, deploy.matrix, regCost);
  const regTx = await matrix.connect(user2).registrationExt(1);
  const regRcpt = await regTx.wait();
  const user2Id = await matrix.addressToId(user2.address);
  results.push(
    report(
      "Register user2 via registrationExt(1)",
      regRcpt?.status === 1 && user2Id > 1n,
      `tx=${regTx.hash} userId=${user2Id}`
    )
  );

  // --- Referral register user3 under user2 ---
  let user3 = ethers.Wallet.createRandom().connect(provider);
  console.log("Generated user3:", user3.address);
  {
    const f1 = await owner.sendTransaction({ to: user3.address, value: ethers.parseEther("0.01") });
    await f1.wait();
    const t1 = await payment.connect(owner).transfer(user3.address, regCost);
    await t1.wait();
  }
  await ensurePaymentToken(payment.connect(user3), user3, deploy.matrix, regCost);
  const refTx = await matrix.connect(user3).registrationExt(Number(user2Id));
  const refRcpt = await refTx.wait();
  const user3Id = await matrix.addressToId(user3.address);
  const u3 = await matrix.users(user3.address);
  results.push(
    report(
      "Referral register user3 under user2",
      refRcpt?.status === 1 && u3.referrerId === user2Id,
      `tx=${refTx.hash} userId=${user3Id} referrerId=${u3.referrerId}`
    )
  );

  // --- Matrix placement L1 ---
  const xm = await matrix.usersXMatrix(user3.address, 1);
  results.push(
    report(
      "Matrix L1 placement (currentReferrer set)",
      xm.currentReferrer !== ethers.ZeroAddress,
      `currentReferrer=${xm.currentReferrer}`
    )
  );

  // --- LAE reward allocation (locked > 0 on registrant) ---
  const summary = await matrix.getLaeRewardSummary(user2.address);
  results.push(
    report(
      "LAE reward allocation (lockedTotal > 0)",
      summary.lockedTotal > 0n,
      `locked=${ethers.formatEther(summary.lockedTotal)} vestedClaimable=${ethers.formatEther(summary.vestedClaimable)}`
    )
  );

  // --- claimLaeRewards (may fail vesting/direct gates — report honestly) ---
  try {
    const claimTx = await matrix.connect(user2).claimLaeRewards();
    const claimRcpt = await claimTx.wait();
    results.push(
      report("claimLaeRewards", claimRcpt?.status === 1, `tx=${claimTx.hash}`)
    );
  } catch (e) {
    results.push(report("claimLaeRewards", false, `expected if vesting/direct gates: ${e.shortMessage ?? e.message}`));
  }

  // --- P2P create / fill / cancel ---
  const laeForP2p = ethers.parseEther("10");
  const pricePerLae = ethers.parseEther("0.0001");
  const coinOwner = coin.connect(owner);
  const balLae = await coinOwner.balanceOf(owner.address);
  if (balLae < laeForP2p * 2n) {
    console.log("Owner LAE balance low for P2P — skipping P2P (treasury wallet may hold LAE)");
    results.push(report("P2P create/fill/cancel", false, "insufficient LAE on owner for test"));
  } else {
    const createTx = await coinOwner.createP2POrder(laeForP2p, pricePerLae);
    const createRcpt = await createTx.wait();
    const orderId = (await coin.nextOrderId()) - 1n;
    results.push(report("P2P create", createRcpt?.status === 1, `tx=${createTx.hash} orderId=${orderId}`));

    await ensurePaymentToken(payment.connect(user2), user2, deploy.laeCoin, (laeForP2p * pricePerLae) / ethers.parseEther("1"));
    const fillTx = await coin.connect(user2).fillP2POrder(orderId);
    const fillRcpt = await fillTx.wait();
    const orderAfterFill = await coin.p2pOrders(orderId);
    results.push(
      report("P2P fill", fillRcpt?.status === 1 && !orderAfterFill.active, `tx=${fillTx.hash}`)
    );

    const cancelOrderTx = await coinOwner.createP2POrder(ethers.parseEther("1"), pricePerLae);
    await cancelOrderTx.wait();
    const cancelId = (await coin.nextOrderId()) - 1n;
    const cancelTx = await coinOwner.cancelP2POrder(cancelId);
    const cancelRcpt = await cancelTx.wait();
    const cancelled = await coin.p2pOrders(cancelId);
    results.push(
      report("P2P cancel", cancelRcpt?.status === 1 && !cancelled.active, `tx=${cancelTx.hash}`)
    );
  }

  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log(`\n=== E2E SUMMARY: ${passed}/${total} PASS ===`);
  console.log(`Matrix: ${deploy.matrix}`);
  console.log(`LAECoin: ${deploy.laeCoin}`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
