#!/usr/bin/env node
/**
 * Reference simulator for the 14 Position Matrix MLM contracts.
 *
 * This is a faithful JavaScript re-implementation of the on-chain logic in
 * MatrixStorage/Placement/Income/Recycle/Core. It is used to run large
 * simulations (100 / 500 / 1000 / 5000 users) and assert the system
 * invariants the audit requires:
 *
 *   - No duplicate placements  (each entrant occupies exactly one position once)
 *   - No payout mismatch       (every position pays per the spec rules)
 *   - No recycle mismatch      (cycles complete exactly at position 14)
 *   - No spillover mismatch     (positions fill in strict BFS / level order)
 *   - No lost funds            (sum of all legs == entries * X)
 *   - No wrong receiver        (independent receiver recomputation matches)
 *
 * Run: node contracts/matrix/simulate.js
 */

const MATRIX_SIZE = 14;
const X = 1000n; // entry amount (chosen so 10% = 100 is integral)
const TREASURY_BPS = 1000n;
const BPS = 10000n;

function newCycle() {
  return { filled: 0, completed: false, slot2Opened: false, positions: new Array(15).fill(0) };
}

class Matrix {
  constructor() {
    this.users = new Map(); // id -> user
    this.userIdOf = new Map(); // wallet -> id
    this.queue = []; // {userId, cycleId}
    this.queueHead = 0;
    this.lastUserId = 0;
    this.ownerId = 0;

    this.totalUserIncome = 0n;
    this.totalTreasuryIncome = 0n;
    this.totalLapsedIncome = 0n;

    // invariant trackers
    this.placedEntrants = new Set(); // entrant ids that have been placed
    this.usedSlots = new Set(); // "M:cycle:pos" keys
    this.placements = []; // ordered placement log
    this.completedCycles = 0;
    this.slotOpenings = 0;
    this.violations = [];
  }

  _err(msg) {
    this.violations.push(msg);
  }

  _mkUser(wallet, sponsorId) {
    this.lastUserId += 1;
    const id = this.lastUserId;
    const u = {
      id,
      wallet,
      sponsorId,
      currentCycle: 1,
      exists: true,
      blocked: false,
      directReferrals: 0,
      highestSlot: 1,
      totalEarned: 0n,
      cycles: new Map([[1, newCycle()]]),
      slotActive: new Set([1]),
      directIds: [],
    };
    this.users.set(id, u);
    this.userIdOf.set(wallet, id);
    if (sponsorId !== 0) {
      const s = this.users.get(sponsorId);
      s.directReferrals += 1;
      s.directIds.push(id);
    }
    return id;
  }

  initRoot(wallet) {
    const id = this._mkUser(wallet, 0);
    this.ownerId = id;
    this.queue.push({ userId: id, cycleId: 1 });
  }

  _cycle(id, cycleId) {
    const u = this.users.get(id);
    if (!u.cycles.has(cycleId)) u.cycles.set(cycleId, newCycle());
    return u.cycles.get(cycleId);
  }

  _isReceivable(id) {
    if (id === 0) return false;
    const u = this.users.get(id);
    return !!u && u.exists && !u.blocked && u.wallet;
  }

  _uplineOf(id, n) {
    let cur = id;
    for (let i = 0; i < n; i++) {
      cur = this.users.get(cur).sponsorId;
      if (cur === 0) return 0;
    }
    return cur;
  }

  _firstChild(id) {
    if (id === 0) return 0;
    const u = this.users.get(id);
    const c1 = u.cycles.get(1);
    return c1 ? c1.positions[1] : 0;
  }

  // ----- income (mirrors MatrixIncome.sol) -----
  _resolveReceiver(M, cycleId, position) {
    if (position === 1) return this._uplineOf(M, 1);
    if (position === 2) return this._uplineOf(M, 2);
    if (position === 7) {
      const d1 = this._cycle(M, cycleId).positions[1];
      return this._isReceivable(d1) ? d1 : M;
    }
    if (position === 10) {
      const d2 = this._cycle(M, cycleId).positions[2];
      return this._isReceivable(d2) ? d2 : M;
    }
    if (position === 13) return this._resolvePos13(M, cycleId);
    return M; // 3,5(c>=2),6,8,9,11,12
  }

  _resolvePos13(M, cycleId) {
    const pos = this._cycle(M, cycleId).positions;
    const order = [3, 5, 4, 6, 7, 8, 9, 10, 11, 12];
    for (const idx of order) {
      const candidate = pos[idx];
      if (this._isReceivable(candidate)) return candidate;
    }
    return M;
  }

  /** Pos-13 search path frozen at fill time. */
  _pos13PathAtFill(M, cycleId) {
    const pos = this._cycle(M, cycleId).positions;
    const order = [
      { idx: 3, label: "1st DL's 1st DL (pos-3 occupant)" },
      { idx: 5, label: "2nd DL's 1st DL (pos-5 occupant)" },
      { idx: 4, label: "Continue: pos-4 occupant (p1 right child)" },
      { idx: 6, label: "Continue: pos-6 occupant (p2 right child)" },
      { idx: 7, label: "Continue: pos-7 occupant" },
      { idx: 8, label: "Continue: pos-8 occupant" },
      { idx: 9, label: "Continue: pos-9 occupant" },
      { idx: 10, label: "Continue: pos-10 occupant" },
      { idx: 11, label: "Continue: pos-11 occupant" },
      { idx: 12, label: "Continue: pos-12 occupant" },
    ];
    const steps = [];
    for (let i = 0; i < order.length; i++) {
      const { idx, label } = order[i];
      const candidate = pos[idx];
      const receivable = this._isReceivable(candidate);
      steps.push({
        step: i + 1,
        matrixPosition: idx,
        occupantId: candidate,
        label,
        receivable,
        selected: receivable,
      });
      if (receivable) break; // search stops at first hit
    }
    return steps;
  }

  _distribute(M, cycleId, position, fromId) {
    if (position === 4 || (position === 5 && cycleId === 1) || position === 14) {
      this.totalTreasuryIncome += X;
      if (position === 5 && cycleId === 1) this._openNextSlot(M);
      return { treasury: X, user: 0n, lapsed: 0n, receiver: 0, mode: "treasury" };
    }
    const receiver = this._resolveReceiver(M, cycleId, position);
    const treasuryCut = (X * TREASURY_BPS) / BPS;
    const userCut = X - treasuryCut;
    this.totalTreasuryIncome += treasuryCut;
    if (this._isReceivable(receiver)) {
      this.users.get(receiver).totalEarned += userCut;
      this.totalUserIncome += userCut;
      return { treasury: treasuryCut, user: userCut, lapsed: 0n, receiver, mode: "user" };
    } else {
      this.users.get(this.ownerId).totalEarned += userCut;
      this.totalLapsedIncome += userCut;
      return { treasury: treasuryCut, user: 0n, lapsed: userCut, receiver, mode: "lapsed" };
    }
  }

  _openNextSlot(id) {
    const u = this.users.get(id);
    const next = u.highestSlot + 1;
    if (u.slotActive.has(next)) return;
    u.slotActive.add(next);
    u.highestSlot = next;
    if (next === 2) this._cycle(id, 1).slot2Opened = true;
    this.slotOpenings += 1;
  }

  // ----- recycle (mirrors MatrixRecycle.sol) -----
  _completeAndRecycle(id, cycleId) {
    const u = this.users.get(id);
    const c = this._cycle(id, cycleId);
    c.completed = true;
    this.completedCycles += 1;
    const newC = cycleId + 1;
    u.currentCycle = newC;
    u.cycles.set(newC, newCycle());
    this.queue.push({ userId: id, cycleId: newC });
  }

  // ----- placement (mirrors MatrixPlacement.sol) -----
  _place(entrantId) {
    const head = this.queue[this.queueHead];
    const M = head.userId;
    const c = head.cycleId;
    const cyc = this._cycle(M, c);
    const position = cyc.filled + 1;

    // INVARIANT: strict sequential BFS fill
    if (position < 1 || position > 14) this._err(`bad position ${position} for ${M}.c${c}`);
    const key = `${M}:${c}:${position}`;
    if (this.usedSlots.has(key)) this._err(`duplicate slot ${key}`);
    this.usedSlots.add(key);
    if (this.placedEntrants.has(entrantId)) this._err(`entrant ${entrantId} placed twice`);
    this.placedEntrants.add(entrantId);

    cyc.positions[position] = entrantId;
    cyc.filled = position;

    const legs = this._distribute(M, c, position, entrantId);

    // INVARIANT: every entry distributes exactly X
    const sum = legs.treasury + legs.user + legs.lapsed;
    if (sum !== X) this._err(`payout mismatch at ${key}: ${sum} != ${X}`);

    // INVARIANT: independent receiver recomputation
    this._verifyReceiver(M, c, position, legs);

    const record = { M, c, position, entrantId, ...legs };
    // Snapshot pos-13 search path at fill time (state changes after later registrations).
    if (position === 13) {
      record.pos13Path = this._pos13PathAtFill(M, c);
    }
    this.placements.push(record);

    if (position === MATRIX_SIZE) {
      this.queueHead += 1;
      this._completeAndRecycle(M, c);
    }
  }

  // Independent receiver verification using an explicit rule table.
  _verifyReceiver(M, c, position, legs) {
    const treasuryPositions = position === 4 || (position === 5 && c === 1) || position === 14;
    if (treasuryPositions) {
      if (legs.mode !== "treasury") this._err(`pos ${position} should be treasury-only`);
      return;
    }
    let expected;
    switch (position) {
      case 1:
        expected = this._uplineOf(M, 1);
        break;
      case 2:
        expected = this._uplineOf(M, 2);
        break;
      case 3:
      case 5:
      case 6:
      case 8:
      case 9:
      case 11:
      case 12:
        expected = M;
        break;
      case 7: {
        const d = this._cycle(M, c).positions[1];
        expected = this._isReceivable(d) ? d : M;
        break;
      }
      case 10: {
        const d = this._cycle(M, c).positions[2];
        expected = this._isReceivable(d) ? d : M;
        break;
      }
      case 13: {
        expected = this._resolvePos13(M, c);
        break;
      }
      default:
        this._err(`unknown position ${position}`);
        return;
    }
    const actual = this._isReceivable(expected) ? expected : 0;
    if (legs.mode === "user") {
      if (legs.receiver !== expected) this._err(`wrong receiver pos ${position}: got ${legs.receiver} want ${expected}`);
      if (actual === 0) this._err(`pos ${position} paid user but receiver unreceivable`);
    } else if (legs.mode === "lapsed") {
      if (this._isReceivable(expected)) this._err(`pos ${position} lapsed but receiver ${expected} was receivable`);
    }
  }

  register(wallet, sponsorId) {
    const id = this._mkUser(wallet, sponsorId);
    this.queue.push({ userId: id, cycleId: 1 });
    this._place(id);
    return id;
  }
}

// Deterministic PRNG for reproducible sponsor selection.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runSim(numUsers, seed = 42) {
  const m = new Matrix();
  m.initRoot("0xowner");
  const rng = mulberry32(seed);
  const registeredIds = [m.ownerId];
  for (let i = 0; i < numUsers; i++) {
    // sponsor = a random already-registered user (exercises deep chains)
    const sponsorId = registeredIds[Math.floor(rng() * registeredIds.length)];
    const wallet = `0xuser${i + 1}`;
    const id = m.register(wallet, sponsorId);
    registeredIds.push(id);
  }
  return validate(m, numUsers);
}

function validate(m, numUsers) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });

  // 1. No duplicate placements
  add("No duplicate placements", m.placedEntrants.size === numUsers,
    `placed ${m.placedEntrants.size} of ${numUsers} entrants`);

  // 2. No payout mismatch / no lost funds
  const totalIn = X * BigInt(numUsers);
  const totalOut = m.totalUserIncome + m.totalTreasuryIncome + m.totalLapsedIncome;
  add("No lost funds (in == out)", totalIn === totalOut,
    `in=${totalIn} out=${totalOut} (user=${m.totalUserIncome} treasury=${m.totalTreasuryIncome} lapsed=${m.totalLapsedIncome})`);

  // 3. Per-placement payout integrity already checked inline; surface count
  const payoutOk = m.placements.every((p) => p.treasury + p.user + p.lapsed === X);
  add("No payout mismatch (each entry = X)", payoutOk, `${m.placements.length} placements`);

  // 4. No recycle mismatch: completed cycles == count of position-14 fills
  const pos14 = m.placements.filter((p) => p.position === 14).length;
  add("No recycle mismatch", m.completedCycles === pos14,
    `completedCycles=${m.completedCycles} pos14Fills=${pos14}`);

  // 4b. Every completed cycle has exactly 14 filled positions
  let completedOk = true;
  for (const u of m.users.values()) {
    for (const [, c] of u.cycles) {
      if (c.completed && c.filled !== 14) completedOk = false;
    }
  }
  add("Completed cycles have 14 positions", completedOk, "");

  // 5. No spillover mismatch: positions filled in strict BFS order per node.
  //    Reconstruct fill order and ensure each node fills 1..14 contiguously.
  const perNode = new Map();
  let bfsOk = true;
  for (const p of m.placements) {
    const k = `${p.M}:${p.c}`;
    const expected = (perNode.get(k) || 0) + 1;
    if (p.position !== expected) bfsOk = false;
    perNode.set(k, p.position);
  }
  add("No spillover mismatch (BFS order)", bfsOk, "");

  // 6. No wrong receiver (independent recomputation done inline)
  add("No wrong receiver", m.violations.length === 0,
    m.violations.length ? m.violations.slice(0, 5).join("; ") : "all receivers verified");

  // 7. Slot openings sanity: slot2 opens once per user whose cycle1 reached pos5
  let slot2Expected = 0;
  for (const u of m.users.values()) {
    const c1 = u.cycles.get(1);
    if (c1 && c1.filled >= 5) slot2Expected += 1;
  }
  add("Slot-2 openings consistent", m.slotOpenings === slot2Expected,
    `opened=${m.slotOpenings} expected=${slot2Expected}`);

  const allOk = checks.every((c) => c.ok) && m.violations.length === 0;
  return { numUsers, checks, allOk, stats: {
    users: m.lastUserId,
    placements: m.placements.length,
    completedCycles: m.completedCycles,
    slotOpenings: m.slotOpenings,
    totalUserIncome: m.totalUserIncome.toString(),
    totalTreasuryIncome: m.totalTreasuryIncome.toString(),
    totalLapsedIncome: m.totalLapsedIncome.toString(),
  } };
}

function main() {
  const sizes = [100, 500, 1000, 5000];
  const results = [];
  for (const n of sizes) {
    const r = runSim(n);
    results.push(r);
    console.log(`\n=== Simulation: ${n} users ===`);
    for (const c of r.checks) {
      console.log(`  [${c.ok ? "PASS" : "FAIL"}] ${c.name}${c.detail ? " — " + c.detail : ""}`);
    }
    console.log(`  stats: ${JSON.stringify(r.stats)}`);
    console.log(`  RESULT: ${r.allOk ? "ALL PASS" : "FAILURES DETECTED"}`);
  }
  const overall = results.every((r) => r.allOk);
  console.log(`\nOVERALL: ${overall ? "ALL SIMULATIONS PASSED" : "FAILURES DETECTED"}`);
  // emit machine-readable JSON for the audit report generator
  if (process.env.SIM_JSON) {
    require("fs").writeFileSync(process.env.SIM_JSON, JSON.stringify(results, null, 2));
  }
  process.exit(overall ? 0 : 1);
}

if (require.main === module) main();

module.exports = { Matrix, runSim, validate, X, MATRIX_SIZE };
