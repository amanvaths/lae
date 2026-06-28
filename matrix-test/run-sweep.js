"use strict";
const { Reference, AMOUNT, matrixShare } = require("./reference.js");

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ancestors(ref, id) {
  const set = new Set();
  let cur = ref.users.get(id).referrerId;
  while (cur !== 0) { set.add(cur); cur = ref.users.get(cur).referrerId; }
  return set;
}

function runRandom(n, seed = 1234) {
  const ref = new Reference();
  const rng = mulberry32(seed);
  const ids = [1];
  for (let i = 0; i < n; i++) ids.push(ref.register(ids[Math.floor(rng() * ids.length)]));
  return ref;
}

function validate(ref, n) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });

  add("One payout per registration", ref.payouts.length === ref.registrations,
    `${ref.payouts.length} / ${ref.registrations}`);

  const distributed = matrixShare(AMOUNT) * BigInt(ref.registrations);
  const out = ref.totalUserIncome + ref.totalTreasuryIncome;
  add("Solvent: in == out (90% leg)", distributed === out, `in=${distributed} out=${out}`);

  let badReceiver = 0, nonUpline = 0, sumAmt = 0n;
  for (const p of ref.payouts) {
    sumAmt += p.amount;
    if (!p.treasury && (p.receiverId === 0 || !ref.users.has(p.receiverId))) badReceiver++;
    if (p.boardOwnerId !== 0 && !ancestors(ref, p.fromId).has(p.boardOwnerId)) nonUpline++;
  }
  add("All receivers exist", badReceiver === 0, `${badReceiver} bad`);
  add("Earning board owner is upline of entrant", nonUpline === 0, `${nonUpline} sideways`);
  add("Sum payouts == distributed", sumAmt === out, `${sumAmt}`);

  const owner = ref.users.get(1);
  const pct = (x) => (out === 0n ? 0 : Number((x * 10000n) / out) / 100);
  const allOk = checks.every((c) => c.ok) && ref.violations.length === 0;
  return {
    n, checks, allOk,
    stats: {
      ownerPct: pct(owner.totalIncome),
      membersPct: pct(ref.totalUserIncome),
      treasuryPct: pct(ref.totalTreasuryIncome),
      ownerCompletedCycles: owner.reinvestCount,
    },
  };
}

function main() {
  const arg = parseInt(process.argv[2] || "0", 10);
  const sizes = arg > 0 ? [100, 1000, 10000, arg] : [100, 1000, 10000, 100000];
  let overall = true;
  for (const n of sizes) {
    const t0 = Date.now();
    const r = validate(runRandom(n), n);
    console.log(`\n=== ${n} users (${Date.now() - t0} ms) ===`);
    for (const c of r.checks) console.log(`  [${c.ok ? "PASS" : "FAIL"}] ${c.name}${c.detail ? " — " + c.detail : ""}`);
    console.log(`  owner ${r.stats.ownerPct}% | members ${r.stats.membersPct}% | treasury ${r.stats.treasuryPct}% | owner cycles ${r.stats.ownerCompletedCycles}`);
    console.log(`  RESULT: ${r.allOk ? "ALL PASS" : "FAILURES"}`);
    overall = overall && r.allOk;
  }
  console.log(`\nOVERALL: ${overall ? "ALL PASSED" : "FAILURES"}`);
  process.exit(overall ? 0 : 1);
}

if (require.main === module) main();
module.exports = { runRandom, validate };
