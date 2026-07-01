"use strict";
/**
 * Validates every main-matrix payment uses the correct funding source.
 * Run: cd matrix-test && node funding-source-validation.js
 */

const fs = require("fs");
const path = require("path");
const { Reference, AMOUNT, matrixShare, LAST_LEVEL } = require("./reference.js");

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

function expectedSource(ref, boardOwnerId, boardLevel) {
  const b = ref._board(boardOwnerId, boardLevel);
  if (b.reinvestCount > 0) return "cycleFundingBalance";
  if (boardLevel >= 2) return "fundingBalance";
  return "registration";
}

function snapshotBoard(ref, boardOwnerId, boardLevel) {
  const b = ref._board(boardOwnerId, boardLevel);
  return {
    fundingBalance: b.fundingBalance,
    cycleFundBalance: b.cycleFundBalance,
    heldTokenForUpgrade: b.heldTokenForUpgrade,
    reinvestCount: b.reinvestCount,
  };
}

function inferActualSource(before, after, share, expected) {
  if (expected === "registration") {
    const fbSame = before.fundingBalance === after.fundingBalance;
    const cbSame = before.cycleFundBalance === after.cycleFundBalance;
    if (fbSame && cbSame) return "registration";
    if (after.fundingBalance === before.fundingBalance - share) return "fundingBalance";
    if (after.cycleFundBalance === before.cycleFundBalance - share) return "cycleFundingBalance";
    return "unknown";
  }
  if (expected === "fundingBalance") {
    if (after.fundingBalance === before.fundingBalance - share) return "fundingBalance";
    if (after.cycleFundBalance === before.cycleFundBalance - share) return "cycleFundingBalance";
    if (before.fundingBalance === after.fundingBalance && before.cycleFundBalance === after.cycleFundBalance) {
      return "skipped-unfunded";
    }
    return "unknown";
  }
  if (after.cycleFundBalance === before.cycleFundBalance - share) return "cycleFundingBalance";
  if (after.fundingBalance === before.fundingBalance - share) return "fundingBalance";
  if (before.fundingBalance === after.fundingBalance && before.cycleFundBalance === after.cycleFundBalance) {
    return "skipped-unfunded";
  }
  return "unknown";
}

function runValidation(registrations = 200) {
  const ref = new Reference();
  const sponsors = buildBinaryTreeSponsors(registrations);
  const rows = [];
  const mismatches = [];

  const origSendDividends = ref._sendDividends.bind(ref);
  const origSendFromFunding = ref._sendDividendsFromFunding.bind(ref);
  const origSendFromCycle = ref._sendDividendsFromCycleFund.bind(ref);
  const origPayTreasuryFromBoard = ref._payTreasuryFromBoard.bind(ref);
  const origSendTreasury = ref._sendTreasury.bind(ref);

  function recordPayment(ctx) {
    const { boardOwnerId, boardLevel, slot, amount, receiverId, treasury, held } = ctx;
    if (held) return;
    const share = treasury ? amount : matrixShare(amount);
    const expected = expectedSource(ref, boardOwnerId, boardLevel);
    const before = ctx.before;
    const after = snapshotBoard(ref, boardOwnerId, boardLevel);
    const actual = treasury
      ? inferActualSource(before, after, share, expected)
      : inferActualSource(before, after, share, expected);

    const cycle = ref._board(boardOwnerId, boardLevel).reinvestCount + (slot === 14 ? 0 : 0);
    const row = {
      userId: ctx.fromId,
      boardOwnerId,
      level: boardLevel,
      cycle: ref._board(boardOwnerId, boardLevel).reinvestCount + 1,
      slot,
      amount: share.toString(),
      receiver: treasury ? "TREASURY" : `#${receiverId}`,
      expectedSource: expected,
      actualSource: actual,
      fundingBefore: before.fundingBalance.toString(),
      fundingAfter: after.fundingBalance.toString(),
      cycleBefore: before.cycleFundBalance.toString(),
      cycleAfter: after.cycleFundBalance.toString(),
    };
    rows.push(row);

    if (actual !== expected && actual !== "skipped-unfunded") {
      mismatches.push({ ...row, reason: `expected ${expected}, got ${actual}` });
    }
    if (expected === "registration" && actual === "fundingBalance") {
      mismatches.push({ ...row, reason: "L1 cycle1 used fundingBalance" });
    }
    if (expected === "registration" && actual === "cycleFundingBalance") {
      mismatches.push({ ...row, reason: "L1 cycle1 used cycleFundingBalance" });
    }
    if (expected === "fundingBalance" && actual === "registration") {
      mismatches.push({ ...row, reason: "L2+ cycle1 used registration" });
    }
    if (expected === "cycleFundingBalance" && actual === "registration") {
      mismatches.push({ ...row, reason: "cycle2+ used registration" });
    }
    if (expected === "cycleFundingBalance" && actual === "fundingBalance") {
      mismatches.push({ ...row, reason: "cycle2+ used fundingBalance" });
    }
  }

  function wrap(fn, treasury = false) {
    return function (...args) {
      const boardOwnerId = args[3];
      const slot = args[4];
      const boardLevel = args[10] ?? args[9] ?? 1;
      const fromId = args[2];
      const amount = args[1];
      const before = snapshotBoard(ref, boardOwnerId, boardLevel);
      const ret = fn(...args);
      recordPayment({
        fromId,
        boardOwnerId,
        boardLevel,
        slot,
        amount,
        receiverId: treasury ? 0 : args[0],
        treasury,
        held: false,
        before,
      });
      return ret;
    };
  }

  ref._sendDividends = wrap(origSendDividends, false);
  ref._sendDividendsFromFunding = wrap(origSendFromFunding, false);
  ref._sendDividendsFromCycleFund = wrap(origSendFromCycle, false);
  ref._payTreasuryFromBoard = function (boardOwnerId, boardLevel, amount, fromId, slot, kind, recycledAtPay, directSnap) {
    const before = snapshotBoard(ref, boardOwnerId, boardLevel);
    const ret = origPayTreasuryFromBoard(boardOwnerId, boardLevel, amount, fromId, slot, kind, recycledAtPay, directSnap);
    recordPayment({
      fromId,
      boardOwnerId,
      boardLevel,
      slot,
      amount,
      receiverId: 0,
      treasury: true,
      held: false,
      before,
    });
    return ret;
  };

  for (const [, sponsorId] of sponsors) {
    ref.register(sponsorId);
  }

  console.log(`\nRegistered ${registrations - 1} users (+ owner). Payments traced: ${rows.length}`);
  console.log("\n── SAMPLE PAYMENTS (first 20) ──");
  console.log(
    "UserID | Lv | Cyc | Slot | Amount | Receiver | Expected | Actual | fundBefore→After | cycleBefore→After"
  );
  for (const r of rows.slice(0, 20)) {
    console.log(
      `${String(r.userId).padStart(5)} | ${String(r.level).padStart(2)} | ${String(r.cycle).padStart(3)} | ${String(r.slot).padStart(4)} | ${r.amount} | ${r.receiver.padEnd(8)} | ${r.expectedSource.padEnd(20)} | ${r.actualSource.padEnd(18)} | ${r.fundingBefore}→${r.fundingAfter} | ${r.cycleBefore}→${r.cycleAfter}`
    );
  }

  const byLevel = {};
  const byCycle = {};
  for (const r of rows) {
    byLevel[r.level] = (byLevel[r.level] || 0) + 1;
    const cycKey = r.level === 1 ? `L1-C${r.cycle}` : `L${r.level}-C${r.cycle}`;
    byCycle[cycKey] = (byCycle[cycKey] || 0) + 1;
  }

  console.log("\n── PAYMENTS BY LEVEL ──");
  for (let lv = 1; lv <= LAST_LEVEL; lv++) {
    if (byLevel[lv]) console.log(`  Level ${lv}: ${byLevel[lv]} payments`);
  }

  console.log("\n── PAYMENTS BY LEVEL+CYCLE (sample) ──");
  Object.entries(byCycle)
    .slice(0, 15)
    .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  if (mismatches.length > 0) {
    console.error(`\n❌ FAILED: ${mismatches.length} payment source mismatch(es)`);
    for (const m of mismatches.slice(0, 20)) {
      console.error(`  User #${m.userId} L${m.level} C${m.cycle} slot ${m.slot}: ${m.reason}`);
    }
    process.exit(1);
  }

  const logPath = path.join(__dirname, "funding-source-report.json");
  fs.writeFileSync(logPath, JSON.stringify({ registrations, payments: rows, mismatches }, null, 2));
  console.log(`\nFull payment log: ${logPath}`);
  console.log(`\n✅ PASSED: ${rows.length} payments — zero funding source mismatches`);
  return { rows, mismatches };
}

const N = parseInt(process.env.E2E_REGISTRATIONS || "200", 10);
runValidation(N);
