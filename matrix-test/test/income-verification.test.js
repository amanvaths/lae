"use strict";
/**
 * Exhaustive income verification — contract is NOT modified.
 * Proves genealogy placement + frontier income routing on the live EVM,
 * then stress-validates 100,000 registrations against the full rule set.
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Reference, AMOUNT, matrixShare } = require("../reference.js");
const {
  addrForIndex,
  deployMatrixHarness,
  registerAndParse,
  getBoardSlots,
  getReinvestCount,
  getDirectIds,
} = require("./helpers/harness.js");
const {
  validateReferenceRun,
  runStress,
  printPass,
  printFail,
  roleTarget,
  resolveWithLapse,
  TREASURY_LABEL,
} = require("./helpers/verifier.js");

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Binary-tree sponsor plan: each id sponsors two children in BFS order. */
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

function labelRecipient(id, treasury) {
  if (treasury) return TREASURY_LABEL;
  return id === null ? "none" : `#${id}`;
}

function paymentBoardOwner(ref, memberId) {
  let cur = ref.users.get(memberId).referrerId;
  let best = 0;
  let minRc = Infinity;
  while (cur !== 0) {
    const rc = ref.users.get(cur).reinvestCount;
    if (rc < minRc) {
      minRc = rc;
      best = cur;
    } else if (rc === minRc && rc === 0) {
      best = cur;
    }
    cur = ref.users.get(cur).referrerId;
  }
  return best;
}

describe("LAEClubMatrix income verification (contract untouched)", function () {
  this.timeout(30 * 60 * 1000);

  describe("MAIN BUG — owner recycle then #2 board income", function () {
    it("verifies placements and payouts on-chain through registration 20", async function () {
      const { matrix } = await deployMatrixHarness();
      const sponsors = buildBinaryTreeSponsors(20);
      const idToAddr = new Map();
      idToAddr.set(1, await matrix.idToAddress(1));

      const log = [];
      let regNum = 0;

      for (const [userId, sponsorId] of sponsors) {
        regNum++;
        const userAddr = addrForIndex(userId);
        idToAddr.set(userId, userAddr);
        const r = await registerAndParse(matrix, sponsorId, userAddr);

        expect(r.registeredId).to.equal(userId);

        const board2Addr = await matrix.idToAddress(2);
        const slots2 = await getBoardSlots(matrix, board2Addr, 1);
        const spotOn2 = slots2.indexOf(userId) + 1;

        log.push({
          regNum,
          userId,
          receiverId: r.receiverId,
          tokenPayments: r.tokenPayments,
          treasury: r.treasury,
          spotOn2,
          ownerReinvest: await getReinvestCount(matrix, 1),
          board2Reinvest: await getReinvestCount(matrix, 2),
        });
      }

      // Owner must have recycled before we check #2 slot 7+
      const ownerReinvest = await getReinvestCount(matrix, 1);
      expect(ownerReinvest).to.be.gte(1, "owner board must have recycled");

      const get = (id) => log.find((x) => x.userId === id);

      // After owner recycle: verify #2 board slots 7–10 pay correctly (by slot, not hardcoded id)
      const afterOwnerRecycle = log.filter((x) => x.ownerReinvest >= 1);
      const slot7 = afterOwnerRecycle.find((x) => x.spotOn2 === 7);
      const slot8 = afterOwnerRecycle.find((x) => x.spotOn2 === 8);
      const slot9 = afterOwnerRecycle.find((x) => x.spotOn2 === 9);
      const slot10 = afterOwnerRecycle.find((x) => x.spotOn2 === 10);

      expect(slot7, "must fill #2 slot 7 after owner recycle").to.exist;
      expect(slot7.tokenPayments.some((p) => p.receiverId === 4 && p.fromId === slot7.userId)).to.equal(
        true,
        "slot 7 payment -> #4 (first direct of #2)"
      );
      expect(slot7.tokenPayments.some((p) => p.receiverId === 1 && p.fromId === slot7.userId)).to.equal(
        false,
        "slot 7 must NOT pay owner"
      );

      expect(slot8, "must fill #2 slot 8").to.exist;
      expect(slot8.tokenPayments.some((p) => p.receiverId === 2 && p.fromId === slot8.userId)).to.equal(
        true,
        "slot 8 payment -> #2"
      );

      expect(slot9, "must fill #2 slot 9").to.exist;
      expect(slot9.tokenPayments.some((p) => p.receiverId === 2 && p.fromId === slot9.userId)).to.equal(
        true,
        "slot 9 payment -> #2"
      );

      expect(slot10, "must fill #2 slot 10").to.exist;
      expect(slot10.tokenPayments.some((p) => p.receiverId === 5 && p.fromId === slot10.userId)).to.equal(
        true,
        "slot 10 payment -> #5 (second direct of #2)"
      );

      for (const row of [slot7, slot8, slot9, slot10]) {
        const expectedBySlot = { 7: 4, 8: 2, 9: 2, 10: 5 };
        const exp = expectedBySlot[row.spotOn2];
        if (!row.tokenPayments.some((p) => p.receiverId === exp && p.fromId === row.userId)) {
          printFail({
            regNum: row.regNum,
            boardOwner: 2,
            slot: row.spotOn2,
            expected: `#${exp}`,
            actual: `#${row.receiverId}`,
            reason: `#2 board slot ${row.spotOn2} payment mismatch`,
          });
          expect.fail("board #2 slot payment mismatch");
        }
      }
    });
  });

  describe("EXTENDED — #2 recycle then #3 board frontier", function () {
    it("verifies income follows current board owner through #2 recycle and into #3", async function () {
      const ref = new Reference();
      const sponsors = buildBinaryTreeSponsors(80);
      for (const [, sponsorId] of sponsors) ref.register(sponsorId);

      const ownerRecycleAt = ref.users.get(1).reinvestCount;
      expect(ownerRecycleAt).to.be.gte(1);

      // Find first payout after owner recycle where board owner is #2
      const firstOn2 = ref.payouts.find((p) => p.boardOwnerId === 2);
      expect(firstOn2).to.exist;

      // #2 must eventually recycle
      let id2Recycle = false;
      for (const p of ref.payouts) {
        if (p.boardOwnerId === 2 && p.slot === 14) id2Recycle = true;
      }
      expect(id2Recycle, "#2 board must complete a cycle").to.be.true;

      // After #2 board completes (slot 14), frontier must pay from #3's board
      const idx2Recycle = ref.payouts.findIndex((p) => p.boardOwnerId === 2 && p.slot === 14);
      expect(idx2Recycle).to.be.gte(0, "#2 must recycle");
      const after2Recycle = ref.payouts.slice(idx2Recycle + 1);
      const paysFrom3 = after2Recycle.some((p) => p.boardOwnerId === 3);
      expect(paysFrom3, "after #2 recycle, income must route from #3 board").to.be.true;

      // Owner must not receive on #3 board slots 7-9 (self/downline slots)
      for (const p of ref.payouts) {
        if (p.boardOwnerId === 3 && [7, 8, 9].includes(p.slot) && p.receiverId === 1) {
          printFail({
            regNum: p.fromId,
            boardOwner: 3,
            slot: p.slot,
            expected: "not owner",
            actual: "#1",
            reason: "Owner leak on #3 board self/downline slots",
          });
          expect.fail("owner leak on #3");
        }
      }

      const v = validateReferenceRun(ref);
      expect(v.ok, v.failure?.reason).to.be.true;
    });
  });

  describe("ON-CHAIN equivalence bootstrap (contract === reference)", function () {
    it("matches reference per-user income for 3000 random registrations", async function () {
      const N = parseInt(process.env.BOOTSTRAP_N || "3000", 10);
      const { matrix, token, treasury } = await deployMatrixHarness();
      const ref = new Reference();
      const rng = mulberry32(20260628);
      const ids = [1];

      for (let i = 0; i < N; i++) {
        const sponsorId = ids[Math.floor(rng() * ids.length)];
        await matrix.registrationSys(sponsorId, addrForIndex(i));
        ids.push(ref.register(sponsorId));
      }

      let mismatches = 0;
      for (let id = 1; id <= N + 1; id++) {
        const onchain = await matrix.getUserDetails(id);
        const refIncome = ref.users.get(id).totalIncome;
        if (onchain[7] !== refIncome) mismatches++;
      }
      expect(mismatches).to.equal(0);

      const treasuryBal = await token.balanceOf(treasury.address);
      const contractBal = await token.balanceOf(await matrix.getAddress());
      const onChainTreasurySide = treasuryBal + contractBal;
      const refTreasurySide = ref.totalTreasuryIncome;
      const drift =
        onChainTreasurySide >= refTreasurySide
          ? onChainTreasurySide - refTreasurySide
          : refTreasurySide - onChainTreasurySide;
      expect(Number(drift)).to.be.lte(Number(ethers.parseEther("0.5")));

      const distributed = matrixShare(AMOUNT) * BigInt(N);
      expect(ref.totalUserIncome + ref.totalTreasuryIncome + ref._totalHeld()).to.equal(distributed);
    });
  });

  describe("STRESS — 100000 registrations full rule verification", function () {
    it("validates every placement, payout, recycle, and frontier rule", function () {
      const N = parseInt(process.env.STRESS_N || "100000", 10);
      const result = runStress(N, 42);

      if (!result.ok) {
        printFail(result.failure);
        expect.fail(result.failure.reason);
      }

      printPass(result.stats);
      expect(result.stats.totalFailedAssertions).to.equal(0);
      expect(result.stats.totalRegistrations).to.equal(N);
      expect(result.stats.totalPayoutsVerified).to.equal(N);
    });
  });
});
