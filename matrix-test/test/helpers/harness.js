"use strict";

const { ethers } = require("hardhat");
const { AMOUNT } = require("../../reference.js");

function addrForIndex(i) {
  return ethers.getAddress(ethers.zeroPadValue(ethers.toBeHex(BigInt(i) + 0x100000n), 20));
}

async function deployMatrixHarness() {
  const [owner, clubPool, treasury] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("TestPaymentToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const Matrix = await ethers.getContractFactory("LAEClubMatrix");
  const matrix = await Matrix.deploy(
    owner.address,
    await token.getAddress(),
    clubPool.address,
    treasury.address
  );
  await matrix.waitForDeployment();
  const cap = ethers.parseEther("1000");
  let minted = 0n;
  const need = ethers.parseEther("5000000");
  while (minted < need) {
    const chunk = need - minted > cap ? cap : need - minted;
    await token.faucet(chunk);
    minted += chunk;
  }
  await token.approve(await matrix.getAddress(), ethers.MaxUint256);
  await token.transfer(await matrix.getAddress(), ethers.parseEther("3000000"));
  return { matrix, token, owner, treasury, clubPool };
}

async function registerAndParse(matrix, referrerId, userAddr) {
  const tx = await matrix.registrationSys(referrerId, userAddr);
  const receipt = await tx.wait();
  const iface = matrix.interface;

  let registeredId = null;
  let receiverId = null;
  let tokenAmount = null;
  const tokenPayments = [];
  const placements = [];

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === "Registration") {
        registeredId = Number(parsed.args.userId);
      } else if (parsed.name === "TokenReceived") {
        const row = {
          receiverId: Number(parsed.args.receiverId),
          fromId: Number(parsed.args.fromId),
          level: Number(parsed.args.level),
          amount: parsed.args.amount,
        };
        tokenPayments.push(row);
        receiverId = row.receiverId;
        tokenAmount = row.amount;
      } else if (parsed.name === "NewUserPlace") {
        placements.push({
          userId: Number(parsed.args.user),
          boardOwnerId: Number(parsed.args.referrer),
          level: Number(parsed.args.level),
          cycle: Number(parsed.args.cycle),
          spot: Number(parsed.args.spot),
        });
      }
    } catch {
      // not our event
    }
  }

  return {
    registeredId,
    receiverId,
    tokenAmount,
    tokenPayments,
    treasury: receiverId === null,
    placements,
    receipt,
  };
}

async function getBoardSlots(matrix, boardOwnerAddr, level = 1) {
  const refs = await matrix.usersXMatrixReferrals(boardOwnerAddr, level);
  const ids = [];
  for (const addr of refs) {
    if (addr === ethers.ZeroAddress) ids.push(0);
    else ids.push(Number(await matrix.addressToId(addr)));
  }
  return ids;
}

async function getReinvestCount(matrix, userId) {
  const addr = await matrix.idToAddress(userId);
  const x = await matrix.usersXMatrix(addr, 1);
  return Number(x.reinvestCount);
}

async function getDirectIds(matrix, userId) {
  const raw = await matrix.getDirectPartnerIds(userId);
  return raw.map((x) => Number(x));
}

function failReport(ctx) {
  console.log("\nFAILED");
  console.log(`Registration Number: ${ctx.regNum}`);
  console.log(`Board Owner: ${ctx.boardOwner}`);
  console.log(`Slot: ${ctx.slot}`);
  console.log(`Expected Recipient: ${ctx.expected}`);
  console.log(`Actual Recipient: ${ctx.actual}`);
  console.log(`Reason: ${ctx.reason}`);
  process.exit(1);
}

module.exports = {
  AMOUNT,
  addrForIndex,
  deployMatrixHarness,
  registerAndParse,
  getBoardSlots,
  getReinvestCount,
  getDirectIds,
  failReport,
};
