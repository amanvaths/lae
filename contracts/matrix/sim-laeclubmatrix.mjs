/**
 * Faithful JS replica of LAEClubMatrix._processNewPlacement (level 1 placement).
 * Token transfers are omitted because they DO NOT affect placement — only the
 * `referrals.push` + recursion + recycle decide where an entrant sits.
 *
 * Goal: prove whether placement ever SKIPS a position inside any matrix, and
 * show the relationship between "registration number" and "matrix position".
 */

const MATRIX_SIZE = 14;
const LAST_LEVEL = 15;
const OWNER = 1;

/** users[id] = { id, referrerId, l1: { currentReferrer, referrals[], reinvestCount, lastSpillIdx }, directReferrals[], activeL1 } */
const users = new Map();

function mkUser(id, referrerId) {
  users.set(id, {
    id,
    referrerId,
    directReferrals: [],
    activeL1: true,
    l1: { currentReferrer: 0, referrals: [], reinvestCount: 0, lastSpillIdx: 0 },
  });
}

const placements = []; // { reg, occupantId, matrixOwnerId, position, cycle, type }

function isEligibleForSelfPayment(id) {
  return id === OWNER || users.get(id).directReferrals.length >= 2;
}

function findFreeReferrer(userId) {
  let cur = users.get(userId).referrerId;
  while (true) {
    if (cur === 0) return OWNER;
    const u = users.get(cur);
    if (u.activeL1 && u.l1.referrals.length < MATRIX_SIZE) return cur;
    cur = u.referrerId;
  }
}

function findEligibleUplineTarget(referrerId, uplineLevel) {
  let current = referrerId;
  for (let i = 0; i < uplineLevel; i++) {
    current = users.get(current).l1.currentReferrer;
    if (current === 0) return OWNER;
  }
  while (true) {
    if (current === 0 || current === OWNER) return OWNER;
    if (isEligibleForSelfPayment(current) && users.get(current).l1.referrals.length < MATRIX_SIZE) {
      return current;
    }
    current = users.get(current).l1.currentReferrer;
  }
}

function findEligibleDownlineUser(referrerId, downlineLevel) {
  const ref = users.get(referrerId);
  if (downlineLevel === 1) {
    const directs = ref.directReferrals;
    if (directs.length === 0) return OWNER;
    const startIdx = ref.l1.lastSpillIdx;
    for (let i = 0; i < directs.length; i++) {
      const idx = (startIdx + i) % directs.length;
      const cand = directs[idx];
      if (isEligibleForSelfPayment(cand) && users.get(cand).l1.referrals.length < MATRIX_SIZE) {
        ref.l1.lastSpillIdx = (idx + 1) % directs.length;
        return cand;
      }
    }
    return OWNER;
  }
  const firstLevel = ref.directReferrals;
  if (firstLevel.length === 0) return OWNER;
  for (const f of firstLevel) {
    for (const cand of users.get(f).directReferrals) {
      if (isEligibleForSelfPayment(cand) && users.get(cand).l1.referrals.length < MATRIX_SIZE) {
        return cand;
      }
    }
  }
  return OWNER;
}

let recursionGuard = 0;
function processNewPlacement(newUserId, referrerId, regNo) {
  if (++recursionGuard > 5000) throw new Error("runaway recursion");
  const ref = users.get(referrerId);
  const matrix = ref.l1;
  const spotIndex = matrix.referrals.length; // 0-based
  const isOwnerRef = referrerId === OWNER;

  if (spotIndex >= MATRIX_SIZE) throw new Error(`matrix full for ${referrerId}`);

  // *** PLACEMENT: unconditional sequential push ***
  matrix.referrals.push(newUserId);
  const position = spotIndex + 1; // 1-based
  placements.push({ reg: regNo, occupantId: newUserId, matrixOwnerId: referrerId, position, cycle: matrix.reinvestCount + 1 });

  // *** INCOME ROUTING (may recurse to place same user in another matrix) ***
  if (spotIndex === 0) {
    if (isOwnerRef) return;
    return processNewPlacement(newUserId, findEligibleUplineTarget(referrerId, 1), regNo);
  }
  if (spotIndex === 1) {
    if (isOwnerRef) return;
    return processNewPlacement(newUserId, findEligibleUplineTarget(referrerId, 2), regNo);
  }
  if (spotIndex === 3 || spotIndex === 4) return; // reserve / upgrade trigger (no placement recursion at L1 sim)
  if (spotIndex === 2 || spotIndex === 5 || spotIndex === 7 || spotIndex === 8 || spotIndex === 10 || spotIndex === 11) return; // self income
  if (spotIndex === 6 || spotIndex === 9) {
    const dl = findEligibleDownlineUser(referrerId, 1);
    if (dl === OWNER) return;
    return processNewPlacement(newUserId, dl, regNo);
  }
  if (spotIndex === 12) {
    const dl = findEligibleDownlineUser(referrerId, 2);
    if (dl === OWNER) return;
    return processNewPlacement(newUserId, dl, regNo);
  }
  if (spotIndex === 13) {
    // recycle: reset and re-enter
    matrix.referrals = [];
    matrix.reinvestCount++;
    matrix.lastSpillIdx = 0;
    const free = findFreeReferrer(referrerId);
    matrix.currentReferrer = free;
    return processNewPlacement(referrerId, free, regNo);
  }
}

function register(newUserId, referrerId, regNo) {
  mkUser(newUserId, referrerId);
  users.get(referrerId).directReferrals.push(newUserId);
  const free = findFreeReferrer(newUserId);
  users.get(newUserId).l1.currentReferrer = free;
  recursionGuard = 0;
  processNewPlacement(newUserId, free, regNo);
}

// ---- Bootstrap: owner + 2 partners (like initializePartners) ----
mkUser(OWNER, 0);
mkUser(2, OWNER); users.get(OWNER).directReferrals.push(2); users.get(2).l1.currentReferrer = OWNER; recursionGuard = 0; processNewPlacement(2, OWNER, 1);
mkUser(3, OWNER); users.get(OWNER).directReferrals.push(3); users.get(3).l1.currentReferrer = OWNER; recursionGuard = 0; processNewPlacement(3, OWNER, 2);

// ---- Scenario A: 50 users all register under sponsor #2 (user's mental model: one sponsor) ----
let nextId = 4;
const SPONSOR = 2;
const N = 50;
for (let i = 0; i < N; i++) {
  register(nextId, SPONSOR, i + 1);
  nextId++;
}

// ---- AUDIT 1: no gaps inside ANY matrix (push guarantees sequential) ----
let gapFound = null;
for (const [id, u] of users) {
  // referrals currently holds the CURRENT cycle only (recycle clears it)
  if (u.l1.referrals.length > MATRIX_SIZE) gapFound = `matrix ${id} overfilled`;
}
// Reconstruct per-matrix per-cycle fill order from placements and check sequential 1..n
const byMatrixCycle = new Map();
for (const p of placements) {
  const key = `${p.matrixOwnerId}#${p.cycle}`;
  if (!byMatrixCycle.has(key)) byMatrixCycle.set(key, []);
  byMatrixCycle.get(key).push(p.position);
}
let skipFound = null;
for (const [key, positions] of byMatrixCycle) {
  const sorted = [...positions].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) { skipFound = `${key} -> got ${sorted.join(",")}`; break; }
  }
  if (skipFound) break;
}

console.log("=== AUDIT: within-matrix sequential fill ===");
console.log("overfill:", gapFound ?? "none");
console.log("position skip inside any matrix/cycle:", skipFound ?? "NONE — every matrix fills 1..n with no gaps");

// ---- AUDIT 2: focal matrix (sponsor #2) cycle 1 fill table ----
console.log("\n=== Sponsor #2 — Level 1, Cycle 1 occupants (who sits in which position) ===");
const s2c1 = placements.filter((p) => p.matrixOwnerId === SPONSOR && p.cycle === 1).sort((a, b) => a.position - b.position);
console.log("Pos | OccupantUserId | from Registration#");
for (const p of s2c1) console.log(`${String(p.position).padStart(3)} | ${String(p.occupantId).padStart(13)} | #${p.reg}`);

// ---- AUDIT 3: the table the user asked for — Registration vs Position (in sponsor #2's matrix) ----
console.log("\n=== Registration → Position (sponsor #2 matrix, cycle 1) ===");
console.log("Reg# | ActualPos(in #2) | ExpectedPos | Match");
const placedInS2C1 = new Map(); // reg -> position (first landing in S2 c1)
for (const p of s2c1) if (!placedInS2C1.has(p.reg)) placedInS2C1.set(p.reg, p.position);
let regExpected = 0;
for (let reg = 1; reg <= N; reg++) {
  const pos = placedInS2C1.get(reg);
  if (pos == null) continue; // this registration did not land in #2's cycle-1 matrix (spilled elsewhere)
  regExpected++;
  const match = pos === regExpected ? "YES" : "NO";
  console.log(`${String(reg).padStart(4)} | ${String(pos).padStart(15)} | ${String(regExpected).padStart(11)} | ${match}`);
}

// ---- AUDIT 4: how many matrices each registration touched (placement≠1 means spillover) ----
const touchCount = new Map();
for (const p of placements) touchCount.set(p.reg, (touchCount.get(p.reg) ?? 0) + 1);
const multi = [...touchCount.entries()].filter(([, c]) => c > 1);
console.log(`\n=== Spillover note ===`);
console.log(`Registrations that occupied >1 matrix (up/down spillover): ${multi.length} of ${N}`);
console.log("Total placement rows from", N, "registrations:", placements.filter(p => p.reg >= 1).length, "(more than", N, "because of spillover recursion)");
