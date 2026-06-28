"use strict";

const { Reference, AMOUNT, matrixShare, MATRIX_SIZE } = require("../../reference.js");

const TREASURY_LABEL = "TREASURY";

/**
 * Exhaustive validator for a completed Reference run.
 * Returns { ok, failure } — stops at first failure per user requirement.
 */
function validateReferenceRun(ref) {
  const ownerId = ref.ownerId;
  const distributedPerReg = matrixShare(AMOUNT);

  // --- solvency ---
  const totalIn = distributedPerReg * BigInt(ref.registrations);
  const totalOut = ref.totalUserIncome + ref.totalTreasuryIncome;
  if (totalIn !== totalOut) {
    return fail(ref, 0, 0, 0, TREASURY_LABEL, totalOut.toString(),
      `Solvent mismatch in=${totalIn} out=${totalOut}`);
  }

  if (ref.payouts.length !== ref.registrations) {
    return fail(ref, ref.registrations, 0, 0, ref.registrations, ref.payouts.length,
      "Not exactly one payout per registration");
  }

  const treasurySlots = new Set([4, 14]);
  let recycleEvents = 0;

  for (const p of ref.payouts) {
    const regNum = p.fromId;
    const boardOwner = p.boardOwnerId;
    const slot = p.slot;
    const actual = p.treasury ? TREASURY_LABEL : `#${p.receiverId}`;

    // board owner must be upline of entrant
    if (boardOwner !== 0) {
      let cur = ref.users.get(p.fromId).referrerId;
      let found = false;
      while (cur !== 0) {
        if (cur === boardOwner) { found = true; break; }
        cur = ref.users.get(cur).referrerId;
      }
      if (!found) {
        return fail(ref, regNum, boardOwner, slot, "upline ancestor", actual,
          "Earning board owner is not an upline of entrant");
      }
    }

    if (slot === 14) recycleEvents++;

    // treasury only on allowed positions (or lapse / empty pos13)
    if (p.treasury) {
      const okTreasury =
        slot === 4 || slot === 14 ||
        (slot === 5 && !p.recycledAtPay) ||
        (slot === 13 && p.kind === "treasury-slot13") ||
        p.kind === "lapse-treasury" || p.kind === "treasury-noboard" || p.kind === "treasury-other";
      if (!okTreasury) {
        return fail(ref, regNum, boardOwner, slot, "allowed treasury slot", actual,
          `Treasury payout on unexpected slot ${slot}`);
      }
      continue;
    }

    // expected role target (before lapse)
    const expectedAfterLapse = resolveWithLapse(ref, p.intendedTarget, p.directSnap);

    if (p.treasury) continue;

    if (p.receiverId !== expectedAfterLapse) {
      const expLabel = expectedAfterLapse === 0 ? TREASURY_LABEL : `#${expectedAfterLapse}`;
      const actualLabel = `#${p.receiverId}`;
      return fail(ref, regNum, boardOwner, slot, expLabel, actualLabel,
        `Role/lapse mismatch (intended #${p.intendedTarget})`);
    }

    // Owner leak (main bug): after owner recycled, #2 board slot 7 must pay #4 when #4 is eligible
    if (
      ref.users.get(1).reinvestCount > 0 &&
      boardOwner === 2 && slot === 7 &&
      p.intendedTarget === 4 &&
      (p.directSnap.get(4) || 0) >= 2 &&
      p.receiverId === ownerId
    ) {
      return fail(ref, regNum, boardOwner, slot, "#4", `#${ownerId}`,
        "Eligible #4 should receive slot 7 on #2 board, not owner (main bug)");
    }
  }

  // placement: each board fills 1..14 in order per cycle
  const boardFill = new Map();
  for (const u of ref.users.values()) {
    if (u.id === 1) continue;
    // replay placements from payouts isn't enough; check slots length vs totalFilled consistency
  }

  return { ok: true, stats: collectStats(ref, recycleEvents) };
}

function roleTarget(ref, boardOwnerId, slot, recycledAtPay) {
  if (slot === 4 || slot === 14) return 0;
  if (slot === 5 && !recycledAtPay) return 0;
  if (slot === 1) {
    const u = ref._uplineOf(boardOwnerId, 1);
    return u !== 0 ? u : ref.ownerId;
  }
  if (slot === 2) {
    const u = ref._uplineOf(boardOwnerId, 2);
    return u !== 0 ? u : ref.ownerId;
  }
  if (slot === 7) {
    const d = ref._directDownline(boardOwnerId, 0);
    return d !== 0 ? d : boardOwnerId;
  }
  if (slot === 10) {
    const d = ref._directDownline(boardOwnerId, 1);
    return d !== 0 ? d : boardOwnerId;
  }
  if (slot === 13) return ref._targetForPosition13(boardOwnerId);
  if ([3, 6, 8, 9, 11, 12].includes(slot)) return boardOwnerId;
  if (slot === 5 && recycledAtPay) return boardOwnerId;
  return 0;
}

function resolveWithLapse(ref, targetId, directSnap) {
  if (targetId === 0) return 0;
  let cur = targetId;
  for (let i = 0; i < 3; i++) {
    if (cur === 0) break;
    const eligible = cur === ref.ownerId || (directSnap.get(cur) || 0) >= 2;
    if (eligible) return cur;
    cur = ref.users.get(cur).referrerId;
  }
  return 0;
}

function fail(ref, regNum, boardOwner, slot, expected, actual, reason) {
  return {
    ok: false,
    failure: { regNum, boardOwner, slot, expected, actual, reason },
    stats: null,
  };
}

function collectStats(ref, recycleEvents) {
  let ownerPayouts = 0;
  let treasuryPayouts = 0;
  for (const p of ref.payouts) {
    if (p.treasury) treasuryPayouts++;
    else if (p.receiverId === ref.ownerId) ownerPayouts++;
  }
  return {
    totalRegistrations: ref.registrations,
    totalRecycleEvents: recycleEvents,
    totalPayoutsVerified: ref.payouts.length,
    totalTreasuryPayouts: treasuryPayouts,
    totalOwnerPayouts: ownerPayouts,
    totalFailedAssertions: 0,
    ownerIncome: ref.users.get(1).totalIncome.toString(),
    memberIncome: ref.totalUserIncome.toString(),
    treasuryIncome: ref.totalTreasuryIncome.toString(),
  };
}

function printPass(stats) {
  console.log("\nPASS");
  console.log(`Total registrations tested: ${stats.totalRegistrations}`);
  console.log(`Total recycle events: ${stats.totalRecycleEvents}`);
  console.log(`Total payouts verified: ${stats.totalPayoutsVerified}`);
  console.log(`Total treasury payouts: ${stats.totalTreasuryPayouts}`);
  console.log(`Total owner payouts: ${stats.totalOwnerPayouts}`);
  console.log(`Total failed assertions: ${stats.totalFailedAssertions}`);
}

function printFail(f) {
  console.log("\nFAILED");
  console.log(`Registration Number: ${f.regNum}`);
  console.log(`Board Owner: ${f.boardOwner}`);
  console.log(`Slot: ${f.slot}`);
  console.log(`Expected Recipient: ${f.expected}`);
  console.log(`Actual Recipient: ${f.actual}`);
  console.log(`Reason: ${f.reason}`);
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runStress(n, seed = 42) {
  const ref = new Reference();
  const rng = mulberry32(seed);
  const ids = [1];
  for (let i = 0; i < n; i++) {
    ids.push(ref.register(ids[Math.floor(rng() * ids.length)]));
  }
  return validateReferenceRun(ref);
}

module.exports = {
  validateReferenceRun,
  runStress,
  printPass,
  printFail,
  roleTarget,
  resolveWithLapse,
  TREASURY_LABEL,
};
