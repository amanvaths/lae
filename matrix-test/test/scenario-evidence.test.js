"use strict";
/**
 * Evidence-only test: logs on-chain placements, recipients, and balance deltas
 * for registrations 1–20 (binary tree). Contract is NOT modified.
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  addrForIndex,
  deployMatrixHarness,
  registerAndParse,
  getBoardSlots,
  getReinvestCount,
  AMOUNT,
} = require("./helpers/harness.js");

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

describe("EVIDENCE — exact bug scenario logs (contract untouched)", function () {
  this.timeout(5 * 60 * 1000);

  it("prints registration 1–20 placements, recipients, balance deltas", async function () {
    const { matrix, token } = await deployMatrixHarness();
    const sponsors = buildBinaryTreeSponsors(20);
    const matrixShare = (AMOUNT * 9000n) / 10000n;

    const idAddr = async (id) => await matrix.idToAddress(id);
    const bal = async (id) => token.balanceOf(await idAddr(id));

    console.log("\n========== BUG SCENARIO EVIDENCE (on-chain) ==========");
    console.log(`AMOUNT per reg: ${AMOUNT} | matrix share (90%): ${matrixShare}`);
    console.log("");

    let regNum = 0;
    const rows = [];

    for (const [userId, sponsorId] of sponsors) {
      regNum++;
      const ownerBalBefore = await bal(1);
      const id4BalBefore = await bal(4);
      const id2BalBefore = await bal(2);
      const id5BalBefore = await bal(5);

      const userAddr = addrForIndex(userId);
      const r = await registerAndParse(matrix, sponsorId, userAddr);

      const ownerBalAfter = await bal(1);
      const id4BalAfter = await bal(4);
      const id2BalAfter = await bal(2);
      const id5BalAfter = await bal(5);

      const board2Addr = await idAddr(2);
      const slots2 = await getBoardSlots(matrix, board2Addr, 1);
      const spotOn2 = slots2.indexOf(userId) + 1;
      const ownerReinvest = await getReinvestCount(matrix, 1);
      const spotsOn2Board = slots2.filter((x) => x !== 0).length;

      const recipientLabel = r.treasury
        ? "TREASURY"
        : r.receiverId === null
          ? "NONE"
          : `ID #${r.receiverId}`;

      const row = {
        regNum,
        userId,
        sponsorId,
        spotOn2,
        spotsOn2Filled: spotsOn2Board,
        ownerReinvest,
        recipient: recipientLabel,
        receiverId: r.receiverId,
        treasury: r.treasury,
        tokenAmount: r.tokenAmount?.toString() ?? "0",
        ownerDelta: (ownerBalAfter - ownerBalBefore).toString(),
        id4Delta: (id4BalAfter - id4BalBefore).toString(),
        id2Delta: (id2BalAfter - id2BalBefore).toString(),
        id5Delta: (id5BalAfter - id5BalBefore).toString(),
      };
      rows.push(row);

      console.log(
        `REG #${String(regNum).padStart(2)} | new ID #${String(userId).padStart(2)} | sponsor #${sponsorId} | ` +
          `#2 board spot: ${spotOn2 > 0 ? spotOn2 : "-"} | #2 filled: ${spotsOn2Board}/14 | owner cycles: ${ownerReinvest} | ` +
          `PAY -> ${recipientLabel} | amt: ${row.tokenAmount} | ` +
          `balance Δ owner: ${row.ownerDelta} | #4: ${row.id4Delta} | #2: ${row.id2Delta} | #5: ${row.id5Delta}`
      );
    }

    console.log("\n--- Key rows (by registration number) ---");
    for (const n of [15, 16, 17, 18, 19, 20]) {
      const row = rows.find((x) => x.regNum === n);
      if (row) {
        console.log(
          `REG #${n}: new ID #${row.userId} | #2 spot ${row.spotOn2} | PAY ${row.recipient} | ` +
            `ownerΔ=${row.ownerDelta} #4Δ=${row.id4Delta} #2Δ=${row.id2Delta} #5Δ=${row.id5Delta}`
        );
      }
    }

    const ownerRecycle = await getReinvestCount(matrix, 1);
    console.log(`\nOwner reinvestCount after reg 20: ${ownerRecycle} (>=1 means owner recycled)`);

    const slot7Row = rows.find((x) => x.spotOn2 === 7 && x.ownerReinvest >= 1);
    const slot8Row = rows.find((x) => x.spotOn2 === 8 && x.ownerReinvest >= 1);
    const slot9Row = rows.find((x) => x.spotOn2 === 9 && x.ownerReinvest >= 1);
    const slot10Row = rows.find((x) => x.spotOn2 === 10 && x.ownerReinvest >= 1);

    console.log("\n--- Slot fill mapping (after owner recycle) ---");
    if (slot7Row) console.log(`Slot 7 filled by REG #${slot7Row.regNum} (ID #${slot7Row.userId}) -> ${slot7Row.recipient}`);
    if (slot8Row) console.log(`Slot 8 filled by REG #${slot8Row.regNum} (ID #${slot8Row.userId}) -> ${slot8Row.recipient}`);
    if (slot9Row) console.log(`Slot 9 filled by REG #${slot9Row.regNum} (ID #${slot9Row.userId}) -> ${slot9Row.recipient}`);
    if (slot10Row) console.log(`Slot 10 filled by REG #${slot10Row.regNum} (ID #${slot10Row.userId}) -> ${slot10Row.recipient}`);

    // Assertions for evidence test
    expect(ownerRecycle).to.be.gte(1);
    expect(slot7Row).to.exist;
    expect(slot7Row.receiverId).to.equal(4, "slot 7 pays #4 not owner");
    expect(slot7Row.receiverId).to.not.equal(1);
    expect(slot7Row.id4Delta).to.equal(matrixShare.toString());

    expect(slot8Row).to.exist;
    expect(slot8Row.receiverId).to.equal(2);
    expect(slot8Row.id2Delta).to.equal(matrixShare.toString());

    expect(slot9Row).to.exist;
    expect(slot9Row.receiverId).to.equal(2);
    expect(slot9Row.id2Delta).to.equal(matrixShare.toString());

    expect(slot10Row).to.exist;
    expect(slot10Row.receiverId).to.equal(5);
    expect(slot10Row.id5Delta).to.equal(matrixShare.toString());

    // #2 had 6 spots before owner recycle (REG #14 completes owner board)
    const atReg14 = rows.find((x) => x.regNum === 14);
    expect(atReg14.spotsOn2Filled).to.equal(6);

    console.log("\n========== EVIDENCE ASSERTIONS: ALL PASSED ==========\n");
  });
});
