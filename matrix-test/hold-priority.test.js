"use strict";
/**
 * Verifies HOLD PRIORITY: slot 4/5 fill on any upline board converts the
 * registration payment into that board's upgrade fund; slot 5 auto-ascends
 * (next level unlock + placement + funded payment).
 *
 * Replays the exact live testnet sequence:
 *   #2<-1, #3<-2, #4<-1, #5<-2, #6<-3, #7<-3, #8<-4, #9<-4, #10<-5
 *
 * Expected:
 *   #7  -> hold 0.0009 on #2 (slot 4)          [previously leaked to #1 slot 6]
 *   #10 -> hold on #2 (slot 5) -> #2 L2 UNLOCK + placed on #1 L2 spot 1
 *          + 0.0018 payment by L2 slot-1 role (-> #1)
 *   Owner root-ascension carry (0.0018) paid to owner, not stranded.
 *
 * Run: npx hardhat run hold-priority.test.js
 */
const { ethers } = require("hardhat");

const ZERO = "0x0000000000000000000000000000000000000000";

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

  // id -> signer (deployer = #1)
  const w = { 1: deployer };
  const addrToId = new Map([[deployer.address.toLowerCase(), 1]]);

  const seq = [
    [2, 1], [3, 2], [4, 1], [5, 2], [6, 3], [7, 3], [8, 4], [9, 4], [10, 5],
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
    const tx = await matrix.connect(s).registrationExt(sponsor);
    const rcpt = await tx.wait();
    const lines = [];
    for (const log of rcpt.logs) {
      let p; try { p = matrix.interface.parseLog(log); } catch { continue; }
      if (!p) continue;
      if (p.name === "NewUserPlace") lines.push(`place #${p.args.referrer} L${p.args.level} spot ${p.args.spot}`);
      if (p.name === "UpgradeHold") lines.push(`HOLD board #${p.args.boardOwnerId} L${p.args.boardLevel} ${ethers.formatEther(p.args.amount)}`);
      if (p.name === "TokenReceived") lines.push(`income #${p.args.receiverId} ${ethers.formatEther(p.args.amount)} L${p.args.level}`);
      if (p.name === "Upgrade") lines.push(`ASCEND #${p.args.userId} -> L${p.args.level}`);
    }
    console.log(`reg #${id} <- ${sponsor}: ${lines.join(" | ")}`);
  }

  const idsOf = async (addr, level) => {
    const slots = await matrix.usersXMatrixReferrals(addr, level);
    return slots.filter((a) => a !== ZERO).map((a) => addrToId.get(a.toLowerCase()) ?? -1);
  };

  console.log("");
  expect("owner L1 board", await idsOf(deployer.address, 1), [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect("#2 L1 board", await idsOf(w[2].address, 1), [3, 5, 6, 7, 10]);
  expect("#2 L2 active", await matrix.isUserSlotActive(2, 2), true);
  expect("owner L2 board", await idsOf(deployer.address, 2), [2]);

  const inc1 = (await matrix.getUserDetails(1))[7];
  const inc2 = (await matrix.getUserDetails(2))[7];
  expect("#1 totalIncome", ethers.formatEther(inc1), "0.0072");
  expect("#2 totalIncome", ethers.formatEther(inc2), "0.0009");

  // Solvency: matrix share in = 9 * 0.0009 = 0.0081 fully distributed (no holds left)
  const held1 = (await matrix.usersXMatrix(deployer.address, 1))[2];
  const held2 = (await matrix.usersXMatrix(w[2].address, 1))[2];
  expect("#1 L1 held", held1.toString(), "0");
  expect("#2 L1 held", held2.toString(), "0");
  expect("distributed total", ethers.formatEther(inc1 + inc2), "0.0081");

  console.log(fails.length ? `\nFAILURES:\n${fails.join("\n")}` : "\nALL HOLD-PRIORITY CHECKS PASSED");
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
