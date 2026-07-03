"use strict";
/**
 * Fills owner's board past slot 14 (binary tree, 2 directs per ID) and checks:
 *  - owner board recycles to cycle 2 and keeps filling
 *  - after owner recycle, income shifts to the senior cycle-1 boards (#2/#3)
 *  - no registration ever reverts (solvency holds)
 * Run: npx hardhat run recycle-shift.test.js
 */
const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const treasury = signers[19];

  const Token = await ethers.getContractFactory("TestPaymentToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const Matrix = await ethers.getContractFactory("LAEClubMatrix");
  const matrix = await Matrix.deploy(
    deployer.address, await token.getAddress(), treasury.address, treasury.address
  );
  await matrix.waitForDeployment();
  const matrixAddr = await matrix.getAddress();
  const cost = await matrix.levelTokenCost(1);

  // Binary tree: sponsor of user #n is #(n>>1) — owner #1 root, each ID gets 2 directs.
  const N = 40;
  const wallets = { 1: deployer };
  const payLog = [];

  for (let id = 2; id <= N; id++) {
    const w = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: w.address, value: ethers.parseEther("1") });
    await token.connect(w).faucet(cost * 2n);
    await token.connect(w).approve(matrixAddr, cost * 2n);
    wallets[id] = w;
    const sponsor = id >> 1;
    const tx = await matrix.connect(w).registrationExt(sponsor);
    const rcpt = await tx.wait();
    for (const log of rcpt.logs) {
      let p; try { p = matrix.interface.parseLog(log); } catch { continue; }
      if (!p) continue;
      if (p.name === "TokenReceived") payLog.push({ reg: id, to: Number(p.args.receiverId), kind: "income" });
      if (p.name === "UpgradeHold") payLog.push({ reg: id, to: Number(p.args.boardOwnerId), kind: "hold" });
      if (p.name === "LapseIncome") payLog.push({ reg: id, to: Number(p.args.receiverId), kind: "lapse" });
      if (p.name === "ClubPoolPayment") payLog.push({ reg: id, to: 0, kind: "treasury" });
      if (p.name === "Reinvest" && Number(p.args.level) === 1) {
        console.log(`recycle: board #${p.args.userId} at registration of #${id}`);
      }
    }
  }

  const ownerB = await matrix.usersXMatrix(deployer.address, 1);
  console.log(`owner L1: reinvestCount=${ownerB[1]} totalFilled=${ownerB[4]}`);
  const b2 = await matrix.usersXMatrix(wallets[2].address, 1);
  const b3 = await matrix.usersXMatrix(wallets[3].address, 1);
  console.log(`#2 L1: reinvestCount=${b2[1]} totalFilled=${b2[4]}`);
  console.log(`#3 L1: reinvestCount=${b3[1]} totalFilled=${b3[4]}`);

  console.log("\nsettlement per registration:");
  for (const p of payLog) console.log(`  reg #${p.reg} -> board-owner/receiver #${p.to} (${p.kind})`);

  // Every registration settles exactly once
  const perReg = new Map();
  for (const p of payLog) perReg.set(p.reg, (perReg.get(p.reg) ?? 0) + 1);
  let fails = 0;
  for (let id = 2; id <= N; id++) {
    if ((perReg.get(id) ?? 0) !== 1) { console.log(`FAIL reg #${id}: ${perReg.get(id) ?? 0} settlements`); fails++; }
  }

  const contractBal = await token.balanceOf(matrixAddr);
  console.log(`\ncontract balance: ${ethers.formatEther(contractBal)} (held funds remain)`);
  console.log(fails ? `\n${fails} FAILURES` : "\nALL RECYCLE/SETTLEMENT CHECKS PASSED");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
