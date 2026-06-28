"use strict";
/**
 * Exact-match test: the REAL LAEClubMatrix.sol deployed on Hardhat's EVM must
 * produce, per user, byte-identical income to the JS reference model — across a
 * random sponsor tree. This proves the reference (used for the 100k sweep)
 * faithfully mirrors the contract, and that the frontier income fix behaves the
 * same on-chain.
 */

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Reference, AMOUNT } = require("../reference.js");

const N = parseInt(process.env.N || "1500", 10);

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addrForIndex(i) {
  // deterministic, distinct, nonzero addresses for synthetic users
  return ethers.getAddress(ethers.zeroPadValue(ethers.toBeHex(BigInt(i) + 0x100000n), 20));
}

describe("LAEClubMatrix frontier income — exact contract vs reference", function () {
  this.timeout(10 * 60 * 1000);

  it("compiled contracts are byte-identical to repo source (no drift)", function () {
    for (const f of ["LAEClubMatrix.sol", "TestPaymentToken.sol"]) {
      const src = fs.readFileSync(path.resolve(__dirname, "..", "..", "contracts", f), "utf8");
      const copy = fs.readFileSync(path.resolve(__dirname, "..", "contracts", f), "utf8");
      expect(copy, `${f} drifted from source`).to.equal(src);
    }
  });

  it(`matches per-user income for ${N} random registrations`, async function () {
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

    // Fund + approve the owner (registrationSys pulls AMOUNT from msg.sender).
    const need = AMOUNT * BigInt(N);
    let minted = 0n;
    const cap = ethers.parseEther("1000");
    while (minted < need) {
      const chunk = need - minted > cap ? cap : need - minted;
      await token.faucet(chunk);
      minted += chunk;
    }
    await token.approve(await matrix.getAddress(), ethers.MaxUint256);

    // Deterministic sponsor sequence shared by chain + reference.
    const ref = new Reference();
    const rng = mulberry32(20260627);
    const ids = [1];

    for (let i = 0; i < N; i++) {
      const sponsorId = ids[Math.floor(rng() * ids.length)];
      const userAddr = addrForIndex(i);
      await matrix.registrationSys(sponsorId, userAddr);
      const id = ref.register(sponsorId);
      ids.push(id);
    }

    // Compare per-user income (id 1..N+1).
    let mismatches = 0;
    for (let id = 1; id <= N + 1; id++) {
      const refUser = ref.users.get(id);
      const onchain = await matrix.getUserDetails(id);
      const chainIncome = onchain[7]; // totalIncome
      if (chainIncome !== refUser.totalIncome) {
        mismatches++;
        if (mismatches <= 10) {
          console.log(`  id ${id}: chain=${chainIncome} ref=${refUser.totalIncome}`);
        }
      }
    }
    expect(mismatches, "per-user income mismatches").to.equal(0);

    // Treasury wallet got exactly the reference treasury total (90% legs).
    const treasuryBal = await token.balanceOf(treasury.address);
    expect(treasuryBal).to.equal(ref.totalTreasuryIncome);

    // Global solvency: distributed 90% leg == members + treasury.
    const distributed = (AMOUNT * 9000n) / 10000n * BigInt(N);
    expect(ref.totalUserIncome + ref.totalTreasuryIncome).to.equal(distributed);

    console.log(`  OK: ${N} regs, owner income=${ref.users.get(1).totalIncome}, treasury=${ref.totalTreasuryIncome}`);
  });
});
