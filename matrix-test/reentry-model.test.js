"use strict";
/**
 * Replays the EXACT live testnet sequence (19 ids, same tree) and verifies the
 * re-entry + all-uplines-ascension model:
 *
 *   #2<-1 #3<-1 #4<-2 #5<-2 #6<-4 #7<-4 #8<-6 #9<-6 #10<-7 #11<-7
 *   #12<-8 #13<-8 #14<-9 #15<-9 #16<-10 #17<-10 #18<-11 #19<-11
 *
 * Expected (user spec):
 *   #1 L1 cycle 2 = [2]        (#2 re-enters #1 after its board recycles)
 *   #1 L2 cycle 1 = [2,4,6,7]  (ascension places on EVERY active upline board)
 *   #2 L2 = [4,6,7], #4 L2 = [6,7]
 * Plus solvency: no reverts, sum(income)+treasury+held == total matrix-share in.
 *
 * Run: npx hardhat run matrix-test/reentry-model.test.js
 */
const { ethers } = require("hardhat");
const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const treasuryWallet = ethers.Wallet.createRandom().connect(ethers.provider);

  const Token = await ethers.getContractFactory("TestPaymentToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const Matrix = await ethers.getContractFactory("LAEClubMatrix");
  const matrix = await Matrix.deploy(
    deployer.address, await token.getAddress(), treasuryWallet.address, treasuryWallet.address
  );
  await matrix.waitForDeployment();
  const matrixAddr = await matrix.getAddress();
  const cost = await matrix.levelTokenCost(1);
  const share = (cost * 9000n) / 10000n;

  const w = { 1: deployer };
  const addrToId = new Map([[deployer.address.toLowerCase(), 1]]);

  const seq = [
    [2, 1], [3, 1], [4, 2], [5, 2], [6, 4], [7, 4], [8, 6], [9, 6], [10, 7], [11, 7],
    [12, 8], [13, 8], [14, 9], [15, 9], [16, 10], [17, 10], [18, 11], [19, 11],
  ];

  const fails = [];
  const expect = (name, actual, expected) => {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) fails.push(`${name}: got ${a}, want ${e}`);
    else console.log(`OK ${name}`);
  };

  for (const [id, sponsor] of seq) {
    const s = signers[id];
    w[id] = s;
    addrToId.set(s.address.toLowerCase(), id);
    await token.connect(s).faucet(cost * 2n);
    await token.connect(s).approve(matrixAddr, cost * 2n);
    const rcpt = await (await matrix.connect(s).registrationExt(sponsor)).wait();
    const line = [];
    for (const log of rcpt.logs) {
      let p; try { p = matrix.interface.parseLog(log); } catch { continue; }
      if (!p) continue;
      if (p.name === "NewUserPlace") line.push(`place#${p.args.user}->#${p.args.referrer} L${p.args.level}c${p.args.cycle}s${p.args.spot}`);
      if (p.name === "Reinvest") line.push(`RECYCLE#${p.args.userId} L${p.args.level}`);
      if (p.name === "UpgradeHold") line.push(`HOLD#${p.args.boardOwnerId} L${p.args.boardLevel}`);
      if (p.name === "Upgrade") line.push(`ASCEND#${p.args.userId}->L${p.args.level}`);
      if (p.name === "TokenReceived") line.push(`inc#${p.args.receiverId}=${ethers.formatEther(p.args.amount)}L${p.args.level}`);
      if (p.name === "ClubPoolPayment") line.push(`treasury=${ethers.formatEther(p.args.amount)}`);
    }
    console.log(`#${id}<-${sponsor}: ${line.join(" | ")}`);
  }

  const idsOf = async (id, level) => {
    const slots = await matrix.usersXMatrixReferrals(w[id].address, level);
    return slots.filter((a) => a !== ZERO).map((a) => addrToId.get(a.toLowerCase()) ?? -1);
  };

  console.log("");
  const b1 = await matrix.usersXMatrix(deployer.address, 1);
  console.log(`#1 L1 reinvestCount=${b1[1]} (cycle ${Number(b1[1]) + 1})`);
  expect("#1 L1 current-cycle slots", await idsOf(1, 1), [2]);
  expect("#1 L1 is cycle 2", Number(b1[1]), 1);
  expect("#1 L2 cycle 1", await idsOf(1, 2), [2, 4, 6, 7]);
  expect("#2 L2", await idsOf(2, 2), [4, 6, 7]);
  expect("#4 L2", await idsOf(4, 2), [6, 7]);

  // Solvency: total matrix-share in == income paid + treasury + still-held
  let totalIncome = 0n;
  for (let i = 1; i < 20; i++) totalIncome += (await matrix.getUserDetails(i))[7];
  let held = 0n;
  for (let i = 1; i < 20; i++) for (let l = 1; l <= 3; l++) held += (await matrix.usersXMatrix(w[i].address, l))[2];
  const treasuryBal = await token.balanceOf(treasuryWallet.address);
  const totalIn = share * BigInt(seq.length);
  console.log(`\nsolvency: in=${ethers.formatEther(totalIn)} income=${ethers.formatEther(totalIncome)} treasury=${ethers.formatEther(treasuryBal)} held=${ethers.formatEther(held)}`);
  expect("solvency (in == income+treasury+held)", (totalIncome + treasuryBal + held).toString(), totalIn.toString());

  console.log(fails.length ? `\nFAILURES:\n${fails.join("\n")}` : "\nALL RE-ENTRY MODEL CHECKS PASSED");
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
