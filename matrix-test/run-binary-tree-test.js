"use strict";
/**
 * Full binary-tree test: owner → 2 directs → each 2 directs → … (BFS)
 * Validates every placement + every income payout up to N users (default 100k).
 * Optionally spot-checks on-chain contract for the first ONCHAIN_N registrations.
 */

const { Reference, AMOUNT, matrixShare, MATRIX_SIZE } = require("./reference.js");
const { roleTarget, resolveWithLapse } = require("./test/helpers/verifier.js");

const N = parseInt(process.env.N || "100000", 10);
const ONCHAIN_N = parseInt(process.env.ONCHAIN_N || "500", 10);

/** BFS binary tree: each id sponsors exactly 2 children in order. */
function buildBinaryTreeSponsors(maxId) {
  const sponsors = [];
  const queue = [1];
  let qi = 0;
  for (let id = 2; id <= maxId; id++) {
    sponsors.push([id, queue[qi]]);
    queue.push(id);
    if (queue.length > 1 && (queue.length - 1) % 2 === 0) qi++;
  }
  return sponsors;
}

function ancestors(ref, id) {
  const set = new Set();
  let cur = ref.users.get(id).referrerId;
  while (cur !== 0) {
    set.add(cur);
    cur = ref.users.get(cur).referrerId;
  }
  return set;
}

function shouldPlaceOnBoard(ref, boardOwnerId, memberId) {
  if (ref.users.get(boardOwnerId).reinvestCount === 0) return true;
  return ref.users.get(memberId).referrerId === boardOwnerId;
}

function validatePlacements(ref) {
  const boardState = new Map();

  for (const p of ref.placements) {
    let cur = ref.users.get(p.fromId).referrerId;
    let isUpline = false;
    while (cur !== 0) {
      if (cur === p.boardOwnerId) {
        isUpline = true;
        break;
      }
      cur = ref.users.get(cur).referrerId;
    }
    if (!isUpline) {
      return failPlacement(p, "Board owner is not an upline of entrant");
    }

    let st = boardState.get(p.boardOwnerId);
    if (!st) {
      st = { cycle: 1, nextSlot: 1, count: 0 };
      boardState.set(p.boardOwnerId, st);
    }

    if (p.cycle !== st.cycle) {
      return failPlacement(p, `Cycle mismatch expected ${st.cycle} got ${p.cycle}`);
    }
    if (p.slot !== st.nextSlot) {
      return failPlacement(p, `Slot order broken expected ${st.nextSlot} got ${p.slot}`);
    }

    st.nextSlot++;
    st.count++;
    if (p.slot === MATRIX_SIZE) {
      st.cycle++;
      st.nextSlot = 1;
    }
  }

  // totalFilled consistency
  for (const [id, u] of ref.users) {
    if (id === ref.ownerId) continue;
    if (u.totalFilled !== ref.placements.filter((x) => x.boardOwnerId === id).length) {
      return {
        ok: false,
        reason: `#${id} totalFilled=${u.totalFilled} != placement count`,
        detail: null,
      };
    }
  }

  return { ok: true };
}

function failPlacement(p, reason) {
  return {
    ok: false,
    reason,
    detail: {
      regId: p.fromId,
      boardOwner: p.boardOwnerId,
      slot: p.slot,
      cycle: p.cycle,
    },
  };
}

function validateIncome(ref) {
  const distributed = matrixShare(AMOUNT) * BigInt(ref.registrations);
  if (ref.payouts.length !== ref.registrations) {
    return { ok: false, reason: `Payout count ${ref.payouts.length} != ${ref.registrations}` };
  }
  if (ref.totalUserIncome + ref.totalTreasuryIncome !== distributed) {
    return { ok: false, reason: "Solvency mismatch" };
  }

  for (const p of ref.payouts) {
    if (p.boardOwnerId !== 0 && !ancestors(ref, p.fromId).has(p.boardOwnerId)) {
      return { ok: false, reason: `#${p.fromId} payment board #${p.boardOwnerId} not in upline chain` };
    }

    const intended = roleTarget(ref, p.boardOwnerId, p.slot, p.recycledAtPay);
    const expected = p.treasury ? 0 : resolveWithLapse(ref, intended, p.directSnap);
    if (!p.treasury && p.receiverId !== expected) {
      return {
        ok: false,
        reason: `Reg #${p.fromId} board #${p.boardOwnerId} slot ${p.slot}: expected #${expected} got #${p.receiverId}`,
      };
    }

    // Owner leak after recycle on downline self/downline slots
    if (
      ref.users.get(1).reinvestCount > 0 &&
      p.boardOwnerId >= 2 &&
      [7, 8, 9].includes(p.slot) &&
      p.receiverId === 1 &&
      intended !== 1
    ) {
      return {
        ok: false,
        reason: `Owner leak reg #${p.fromId} on board #${p.boardOwnerId} slot ${p.slot}`,
      };
    }
  }
  return { ok: true };
}

function collectSummary(ref) {
  const owner = ref.users.get(1);
  const distributed = matrixShare(AMOUNT) * BigInt(ref.registrations);
  const totalOut = ref.totalUserIncome + ref.totalTreasuryIncome;

  const recycleByUser = new Map();
  for (const u of ref.users.values()) {
    if (u.reinvestCount > 0) recycleByUser.set(u.id, u.reinvestCount);
  }

  const topEarners = [...ref.users.values()]
    .filter((u) => u.id !== 1 && u.totalIncome > 0n)
    .sort((a, b) => (a.totalIncome > b.totalIncome ? -1 : 1))
    .slice(0, 10);

  let ownerLeakCount = 0;
  for (const p of ref.payouts) {
    if (
      owner.reinvestCount > 0 &&
      p.boardOwnerId >= 2 &&
      p.receiverId === 1 &&
      p.intendedTarget !== 1
    ) ownerLeakCount++;
  }

  return {
    totalUsers: ref.registrations + 1,
    totalRegistrations: ref.registrations,
    totalPlacements: ref.placements.length,
    totalPayouts: ref.payouts.length,
    totalRecycleEvents: ref.placements.filter((p) => p.slot === MATRIX_SIZE).length,
    usersWithRecycle: recycleByUser.size,
    ownerCycles: owner.reinvestCount,
    ownerIncome: owner.totalIncome,
    ownerDirects: owner.directReferrals.length,
    memberIncome: ref.totalUserIncome,
    treasuryIncome: ref.totalTreasuryIncome,
    distributed,
    solvencyOk: totalOut === distributed,
    ownerLeakCount,
    topEarners: topEarners.map((u) => ({
      id: u.id,
      income: u.totalIncome.toString(),
      cycles: u.reinvestCount,
      directs: u.directReferrals.length,
      teamFilled: u.totalFilled,
    })),
    sampleBoards: [1, 2, 3, 4, 5].map((id) => {
      const u = ref.users.get(id);
      return {
        id,
        reinvestCount: u.reinvestCount,
        currentCycleSlots: u.slots.length,
        totalFilled: u.totalFilled,
        income: u.totalIncome.toString(),
        directs: u.directReferrals.length,
      };
    }),
  };
}

function runBinaryTree(n) {
  const ref = new Reference();
  const sponsors = buildBinaryTreeSponsors(n + 1);
  for (const [, sponsorId] of sponsors) ref.register(sponsorId);
  return ref;
}

async function validateOnChain(n) {
  const hre = require("hardhat");
  const { addrForIndex, deployMatrixHarness, registerAndParse } = require("./test/helpers/harness.js");
  const { matrix } = await deployMatrixHarness();
  const ref = new Reference();
  const sponsors = buildBinaryTreeSponsors(n + 1);

  for (let i = 0; i < n; i++) {
    const [userId, sponsorId] = sponsors[i];
    ref.register(sponsorId);
    await registerAndParse(matrix, sponsorId, addrForIndex(userId));

    if ((i + 1) % 100 === 0 || i === n - 1) {
      for (let id = 1; id <= userId; id++) {
        const refUser = ref.users.get(id);
        const chainDetails = await matrix.getUserDetails(id);
        if (chainDetails[7] !== refUser.totalIncome) {
          return {
            ok: false,
            reason: `Income mismatch id #${id} after reg ${i + 1}: chain=${chainDetails[7]} ref=${refUser.totalIncome}`,
          };
        }
      }
    }
  }
  return { ok: true, checked: n };
}

function printSummary(s, ms) {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  BINARY TREE FULL TEST — PLACEMENT + INCOME SUMMARY");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  Pattern        : Owner → 2 directs → 2 each (BFS)`);
  console.log(`  Total users    : ${s.totalUsers.toLocaleString()}`);
  console.log(`  Registrations  : ${s.totalRegistrations.toLocaleString()}`);
  console.log(`  Runtime        : ${(ms / 1000).toFixed(2)}s`);
  console.log("──────────────────────────────────────────────────────────");
  console.log("  PLACEMENT");
  console.log(`  Total placements on all boards : ${s.totalPlacements.toLocaleString()}`);
  console.log(`  Recycle events (slot 14 fills) : ${s.totalRecycleEvents.toLocaleString()}`);
  console.log(`  Users who recycled             : ${s.usersWithRecycle.toLocaleString()}`);
  console.log("──────────────────────────────────────────────────────────");
  console.log("  INCOME");
  console.log(`  Total distributed (90%)        : ${s.distributed}`);
  console.log(`  Member income                  : ${s.memberIncome}`);
  console.log(`  Treasury income                : ${s.treasuryIncome}`);
  console.log(`  Solvency OK                    : ${s.solvencyOk ? "YES" : "NO"}`);
  console.log(`  Owner income                   : ${s.ownerIncome}`);
  console.log(`  Owner completed cycles         : ${s.ownerCycles}`);
  console.log(`  Owner leak on downline boards  : ${s.ownerLeakCount}`);
  console.log("──────────────────────────────────────────────────────────");
  console.log("  SAMPLE BOARDS (id #1–#5)");
  for (const b of s.sampleBoards) {
    console.log(
      `  #${b.id}: cycles=${b.reinvestCount} slots=${b.currentCycleSlots}/14 filled=${b.totalFilled} income=${b.income} directs=${b.directs}`
    );
  }
  console.log("──────────────────────────────────────────────────────────");
  console.log("  TOP 10 EARNERS (excl. owner)");
  for (const t of s.topEarners) {
    console.log(
      `  #${t.id}: income=${t.income} cycles=${t.cycles} directs=${t.directs} board-fills=${t.teamFilled}`
    );
  }
  console.log("══════════════════════════════════════════════════════════");
}

async function main() {
  console.log(`\nRunning binary-tree test for ${N.toLocaleString()} users...`);
  const t0 = Date.now();
  const ref = runBinaryTree(N);

  const placement = validatePlacements(ref);
  if (!placement.ok) {
    console.error("\n❌ PLACEMENT FAILED:", placement.reason, placement.detail || "");
    process.exit(1);
  }
  console.log(`✓ Placement validated (${ref.placements.length.toLocaleString()} placements)`);

  const income = validateIncome(ref);
  if (!income.ok) {
    console.error("\n❌ INCOME FAILED:", income.reason);
    process.exit(1);
  }
  console.log(`✓ Income validated (${ref.payouts.length.toLocaleString()} payouts)`);

  const summary = collectSummary(ref);
  printSummary(summary, Date.now() - t0);

  if (ONCHAIN_N > 0 && process.env.SKIP_ONCHAIN !== "1") {
    console.log(`\nOn-chain spot check (first ${ONCHAIN_N} registrations)...`);
    require("./prepare-contracts.js");
    const chain = await validateOnChain(ONCHAIN_N);
    if (!chain.ok) {
      console.error("\n❌ ON-CHAIN FAILED:", chain.reason);
      process.exit(1);
    }
    console.log(`✓ On-chain matches reference for ${chain.checked} registrations`);
  }

  console.log("\n✅ ALL CHECKS PASSED\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
