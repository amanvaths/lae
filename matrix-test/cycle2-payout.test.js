"use strict";
/**
 * Verifies CYCLE-2 behaviour on a recycled board:
 *   - slot 4 payment -> TREASURY (no upgrade hold)
 *   - slot 5 payment -> BOARD OWNER (like slots 3 & 6, no auto-upgrade)
 *   - no Upgrade / UpgradeHold events fire in cycle 2
 *
 * Setup: register ids 2..20 all directly under owner (#1) so every entry lands
 * on owner's L1 board only. Slots 2..15 fill cycle 1 (recycle at 14), then
 * 16->c2s1, 17->c2s2, 18->c2s3, 19->c2s4, 20->c2s5.
 *
 * Run: npx hardhat run matrix-test/cycle2-payout.test.js
 */
const { ethers } = require("hardhat");

const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const treasury = signers[0]; // reuse owner-less treasury signer below via fresh wallet

  // dedicated treasury wallet so its balance delta is isolated
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
  const share = (cost * 9000n) / 10000n; // matrix share = 0.0009

  const addrToId = new Map([[deployer.address.toLowerCase(), 1]]);

  const fails = [];
  const expect = (name, actual, expected) => {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) fails.push(`${name}: got ${a}, want ${e}`);
    else console.log(`OK ${name}`);
  };

  const register = async (id) => {
    const s = signers[id];
    addrToId.set(s.address.toLowerCase(), id);
    await token.connect(s).faucet(cost * 2n);
    await token.connect(s).approve(matrixAddr, cost * 2n);
    const treBefore = await token.balanceOf(treasuryWallet.address);
    const rcpt = await (await matrix.connect(s).registrationExt(1)).wait();
    const treAfter = await token.balanceOf(treasuryWallet.address);
    const ev = { place: [], hold: [], income: [], ascend: [], club: [] };
    for (const log of rcpt.logs) {
      let p; try { p = matrix.interface.parseLog(log); } catch { continue; }
      if (!p) continue;
      if (p.name === "NewUserPlace") ev.place.push(Number(p.args.spot));
      if (p.name === "UpgradeHold") ev.hold.push(ethers.formatEther(p.args.amount));
      if (p.name === "TokenReceived") ev.income.push([Number(p.args.receiverId), ethers.formatEther(p.args.amount)]);
      if (p.name === "Upgrade") ev.ascend.push(Number(p.args.userId));
      if (p.name === "ClubPoolPayment") ev.club.push(ethers.formatEther(p.args.amount));
    }
    ev.treasuryDelta = treAfter - treBefore;
    return ev;
  };

  // ids 2..20 under owner
  let c2s4, c2s5;
  for (let id = 2; id <= 20; id++) {
    const ev = await register(id);
    const spot = ev.place[0];
    const tag = id <= 15 ? `c1s${spot}` : `c2s${spot}`;
    console.log(`reg #${id} ${tag}: income=${JSON.stringify(ev.income)} hold=${JSON.stringify(ev.hold)} ascend=${JSON.stringify(ev.ascend)} club=${JSON.stringify(ev.club)} tre+=${ethers.formatEther(ev.treasuryDelta)}`);
    if (id === 19) c2s4 = ev;
    if (id === 20) c2s5 = ev;
  }

  console.log("");
  // cycle-2 slot 4 -> treasury
  expect("c2 slot4 is cycle-2 slot 4", [c2s4.place[0], (await matrix.usersXMatrix(deployer.address, 1))[1] >= 1n], [4, true]);
  expect("c2 slot4 no hold", c2s4.hold, []);
  expect("c2 slot4 no ascend", c2s4.ascend, []);
  expect("c2 slot4 -> treasury delta", c2s4.treasuryDelta.toString(), share.toString());
  expect("c2 slot4 club event", c2s4.club, [ethers.formatEther(share)]);
  expect("c2 slot4 no member income", c2s4.income, []);

  // cycle-2 slot 5 -> board owner (#1)
  expect("c2 slot5 spot", c2s5.place[0], 5);
  expect("c2 slot5 no hold", c2s5.hold, []);
  expect("c2 slot5 no ascend", c2s5.ascend, []);
  expect("c2 slot5 -> owner income", c2s5.income, [[1, ethers.formatEther(share)]]);
  expect("c2 slot5 no treasury", c2s5.treasuryDelta.toString(), "0");

  console.log(fails.length ? `\nFAILURES:\n${fails.join("\n")}` : "\nALL CYCLE-2 PAYOUT CHECKS PASSED");
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
