"use strict";
/**
 * Verifies genealogy placement (every upline board) + senior-board income.
 * Scenario from user:
 *   Owner sponsors #2, #3  -> owner board spots 1, 2
 *   #2 sponsors #4, #5     -> owner board spots 3, 4 AND #2 board spots 1, 2
 *   Income paid once, from owner's board (senior, cycle 1).
 * Run: npx hardhat run genealogy-placement.test.js
 */
const { ethers } = require("hardhat");

const ZERO = "0x0000000000000000000000000000000000000000";

async function boardIds(matrix, addr, level, addrToId) {
  const slots = await matrix.usersXMatrixReferrals(addr, level);
  return slots.map((a) => (a === ZERO ? 0 : addrToId.get(a.toLowerCase()) ?? -1));
}

async function main() {
  const signers = await ethers.getSigners();
  const [deployer, u2, u3, u4, u5, u6, u7, treasury] = signers;

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
  for (const s of [u2, u3, u4, u5, u6, u7]) {
    await token.connect(s).faucet(cost * 10n);
    await token.connect(s).approve(matrixAddr, cost * 10n);
  }

  const addrToId = new Map();
  addrToId.set(deployer.address.toLowerCase(), 1);

  const incomes = [];
  matrix.on?.("TokenReceived", () => {});

  async function reg(signer, refId, expectId) {
    const tx = await matrix.connect(signer).registrationExt(refId);
    const rcpt = await tx.wait();
    addrToId.set(signer.address.toLowerCase(), expectId);
    for (const log of rcpt.logs) {
      let parsed;
      try { parsed = matrix.interface.parseLog(log); } catch { continue; }
      if (!parsed) continue;
      if (parsed.name === "NewUserPlace") {
        console.log(`  place: user #${parsed.args.user} -> board of #${parsed.args.referrer} L${parsed.args.level} cycle ${parsed.args.cycle} spot ${parsed.args.spot}`);
      }
      if (parsed.name === "TokenReceived") {
        console.log(`  income: #${parsed.args.receiverId} received ${ethers.formatEther(parsed.args.amount)} from #${parsed.args.fromId} (L${parsed.args.level})`);
        incomes.push({ to: Number(parsed.args.receiverId), amt: parsed.args.amount });
      }
      if (parsed.name === "UpgradeHold") {
        console.log(`  hold: board #${parsed.args.boardOwnerId} L${parsed.args.boardLevel} held ${ethers.formatEther(parsed.args.amount)}`);
      }
      if (parsed.name === "Reinvest") {
        console.log(`  recycle: board #${parsed.args.userId} L${parsed.args.level}`);
      }
      if (parsed.name === "Upgrade") {
        console.log(`  ascend: #${parsed.args.userId} -> L${parsed.args.level}`);
      }
    }
  }

  console.log("register #2 (sponsor #1)"); await reg(u2, 1, 2);
  console.log("register #3 (sponsor #1)"); await reg(u3, 1, 3);
  console.log("register #4 (sponsor #2)"); await reg(u4, 2, 4);
  console.log("register #5 (sponsor #2)"); await reg(u5, 2, 5);
  console.log("register #6 (sponsor #4)"); await reg(u6, 4, 6);
  console.log("register #7 (sponsor #4)"); await reg(u7, 4, 7);

  const ownerBoard = await boardIds(matrix, deployer.address, 1, addrToId);
  const b2 = await boardIds(matrix, u2.address, 1, addrToId);
  const b3 = await boardIds(matrix, u3.address, 1, addrToId);
  const b4 = await boardIds(matrix, u4.address, 1, addrToId);

  console.log("\nowner board:", ownerBoard.join(","));
  console.log("#2 board:   ", b2.join(","));
  console.log("#3 board:   ", b3.join(","));
  console.log("#4 board:   ", b4.join(","));

  const fails = [];
  const expect = (name, actual, expected) => {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) fails.push(`${name}: got ${a}, want ${e}`);
    else console.log(`OK ${name}`);
  };

  // Owner board: #2,#3 (owner directs) then #4,#5 (under #2), #6,#7 (under #4)
  expect("owner spots 1-6", ownerBoard.slice(0, 6), [2, 3, 4, 5, 6, 7]);
  // #2 board: #4,#5 direct, then #6,#7 (under #4 -> also on #2's board)
  expect("#2 spots 1-4", b2.slice(0, 4), [4, 5, 6, 7]);
  expect("#3 board empty", b3.filter(Boolean), []);
  expect("#4 spots 1-2", b4.slice(0, 2), [6, 7]);

  // Income: 6 registrations -> exactly 6 settlements (income or hold), all from owner's board (senior cycle 1)
  // owner slots: 1(->owner upline fallback owner) 2(owner) 3(owner) 4(hold) 5(hold+ascend) 6(owner)
  console.log(fails.length ? `\nFAILURES:\n${fails.join("\n")}` : "\nALL PLACEMENT CHECKS PASSED");
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
