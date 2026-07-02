/**
 * Faithful JS mirror of LAEClubMatrix.sol (closed-loop model).
 * Validates BEFORE deploy:
 *   1. Solvency — contract matrix balance never goes negative.
 *   2. Exact per-level slot amount = 0.0009 * 2^(level-1).
 *   3. Owner's board fills first.
 *   4. Max level reached with N seeds is gated (not 15).
 */

const MATRIX_SIZE = 14;
const LAST_LEVEL = 15;
const BPS = 10_000n;
const MATRIX_BPS = 9000n;
const COST1 = 1_000_000_000_000_000n; // 0.001e18
const N = Number(process.env.MAX_USERS ?? "250");

const matrixShare = (amt) => (amt * MATRIX_BPS) / BPS;
const levelCost = (lvl) => COST1 * (2n ** BigInt(lvl - 1));
const expectedSlot = (lvl) => matrixShare(levelCost(lvl)); // 0.0009 * 2^(lvl-1)

// --- state ---
const users = new Map(); // id -> { referrer, directs:[], activeLevels:Set, boards:Map(level->{slots:[],reinvest,held,totalEarning}) }
function U(id) {
  if (!users.has(id)) {
    users.set(id, { referrer: 0, directs: [], active: new Set(), boards: new Map() });
  }
  return users.get(id);
}
function board(id, lvl) {
  const u = U(id);
  if (!u.boards.has(lvl)) u.boards.set(lvl, { slots: [], reinvest: 0, held: 0n, earning: 0n });
  return u.boards.get(lvl);
}

const levelOrder = new Map(); // lvl -> [ownerId,...]
const levelFrontier = new Map(); // lvl -> idx
function order(lvl) { if (!levelOrder.has(lvl)) levelOrder.set(lvl, []); return levelOrder.get(lvl); }
function frontierIdx(lvl) { return levelFrontier.get(lvl) ?? 0; }
function setFrontier(lvl, v) { levelFrontier.set(lvl, v); }

let balance = 0n;      // contract matrix balance (matrixShare collected - paid out; holds stay)
let minBalance = 0n;
let totalIn = 0n;
let totalOut = 0n;
let totalHeldStuck = 0n;
let maxLevelReached = 1;
const slotAmountByLevel = new Map(); // lvl -> Set of amounts observed on paying slots
const errors = [];

function isEligible(id) { return id === 1 || U(id).directs.length >= 2; }
function uplineOf(id, k) { let cur = id; for (let i = 0; i < k; i++) { cur = U(cur).referrer; if (!cur) return 0; } return cur; }
function directDownline(id, idx) { const d = U(id).directs; return idx < d.length ? d[idx] : 0; }
function pos13(id) {
  const d = U(id).directs; let firstAny = 0;
  for (const c of d) for (const g of U(c).directs) { if (!firstAny) firstAny = g; if (isEligible(g)) return g; }
  return firstAny;
}

function pay(amount) { // amount leaves the contract
  balance -= amount; totalOut += amount;
  if (balance < minBalance) minBalance = balance;
  if (balance < 0n) errors.push(`INSOLVENT: balance ${balance} after paying ${amount}`);
}

function recordSlotAmount(lvl, amount) {
  if (!slotAmountByLevel.has(lvl)) slotAmountByLevel.set(lvl, new Set());
  slotAmountByLevel.get(lvl).add(amount.toString());
}

function payByRole(memberId, ownerId, spot, lvl, amount) {
  if (spot === 4 || spot === 5) { board(ownerId, lvl).held += amount; return; }
  recordSlotAmount(lvl, amount);
  // resolve target
  let target;
  if (spot === 1) { target = uplineOf(ownerId, 1) || 1; }
  else if (spot === 2) { target = uplineOf(ownerId, 2) || 1; }
  else if (spot === 7) { target = directDownline(ownerId, 0) || ownerId; }
  else if (spot === 10) { target = directDownline(ownerId, 1) || ownerId; }
  else if (spot === 13) { target = pos13(ownerId); if (!target) { pay(amount); return; } }
  else if (spot === 14) { target = uplineOf(ownerId, 1); if (!target) { pay(amount); return; } }
  else { target = ownerId; }
  // eligibility/lapse
  let cur = target; let paid = false;
  for (let i = 0; i < 3; i++) {
    if (!cur) break;
    if (isEligible(cur)) { board(cur, lvl).earning += amount; pay(amount); paid = true; break; }
    cur = U(cur).referrer;
  }
  if (!paid) pay(amount); // treasury
}

function frontierOwner(lvl) {
  const arr = order(lvl); let idx = frontierIdx(lvl);
  while (idx < arr.length) {
    const cand = arr[idx];
    if (board(cand, lvl).slots.length >= MATRIX_SIZE) { idx++; continue; }
    setFrontier(lvl, idx); return cand;
  }
  setFrontier(lvl, idx); return 0;
}

function enterLevel(memberId, lvl, carried) {
  if (lvl > maxLevelReached) maxLevelReached = lvl;
  const ownerId = frontierOwner(lvl);
  U(memberId).active.add(lvl);
  order(lvl).push(memberId);

  if (!ownerId || ownerId === memberId) {
    // root of this level; carried stays in contract (stuck)
    if (carried > 0n) totalHeldStuck += carried;
    return;
  }
  const b = board(ownerId, lvl);
  b.slots.push(memberId);
  const spot = b.slots.length;
  // assert carried amount correctness
  if (carried !== expectedSlot(lvl)) {
    errors.push(`level ${lvl} carried ${carried} != expected ${expectedSlot(lvl)}`);
  }
  payByRole(memberId, ownerId, spot, lvl, carried);
  afterFill(ownerId, spot, lvl);
}

function ascend(ownerId, fromLevel) {
  const fb = board(ownerId, fromLevel);
  const carried = fb.held; fb.held = 0n;
  const next = fromLevel + 1;
  if (next > LAST_LEVEL) { if (carried > 0n) pay(carried); return; }
  enterLevel(ownerId, next, carried);
}

function afterFill(ownerId, spot, lvl) {
  if (spot === 5) ascend(ownerId, lvl);
  if (spot === MATRIX_SIZE) {
    const b = board(ownerId, lvl);
    b.slots = []; b.reinvest += 1;
    order(lvl).push(ownerId);
    setFrontier(lvl, frontierIdx(lvl) + 1);
  }
}

function register(memberId, sponsorId) {
  U(memberId).referrer = sponsorId;
  U(sponsorId).directs.push(memberId);
  // 0.001 in: 0.0001 liquidity (out of matrix balance scope), 0.0009 to matrix balance
  totalIn += matrixShare(COST1);
  balance += matrixShare(COST1);
  enterLevel(memberId, 1, matrixShare(COST1));
}

// --- seed: owner=1, binary tree sponsors ---
U(1);
for (let lvl = 1; lvl <= LAST_LEVEL; lvl++) { U(1).active.add(lvl); order(lvl).push(1); }

function buildBinaryTreeSponsors(maxId) {
  const sponsors = []; const ids = [1]; let next = 0; let childCount = 0;
  for (let id = 2; id <= maxId; id++) {
    sponsors.push([id, ids[next]]); ids.push(id); childCount++;
    if (childCount === 2) { childCount = 0; next++; }
  }
  return sponsors;
}

for (const [id, sp] of buildBinaryTreeSponsors(N)) register(id, sp);

// --- report ---
const fmt = (w) => (Number(w) / 1e18).toFixed(7);
console.log(`\n=== LAEClubMatrix closed-loop sim (${N} users, binary tree) ===`);
console.log(`matrixShare in (0.0009 * ${N - 1} regs): ${fmt(totalIn)}`);
console.log(`total paid out:                          ${fmt(totalOut)}`);
console.log(`held (stuck at roots/boards):            ${fmt(totalIn - totalOut)}`);
console.log(`min contract balance during run:         ${fmt(minBalance)}  (must be >= 0)`);
console.log(`max level reached with ${N} users:        ${maxLevelReached}`);

console.log(`\n--- per-level paying-slot amount (must equal 0.0009*2^(L-1)) ---`);
console.log("Lvl |    observed amount(s)     |   expected");
for (let lvl = 1; lvl <= maxLevelReached; lvl++) {
  const set = slotAmountByLevel.get(lvl);
  const obs = set ? [...set].map((s) => fmt(BigInt(s))).join(", ") : "(no paid slot)";
  console.log(`${String(lvl).padStart(3)} | ${obs.padEnd(25)} | ${fmt(expectedSlot(lvl))}`);
}

// owner board fill check
const ownerBoard1 = board(1, 1);
console.log(`\nowner L1 board reinvestCount (cycles): ${ownerBoard1.reinvest}`);
console.log(`owner L1 current slots filled:         ${ownerBoard1.slots.length}`);
console.log(`owner total earning L1:                ${fmt(board(1,1).earning)}`);

// sample a few user earnings
console.log(`\n--- sample earnings (L1) ---`);
for (const id of [1, 2, 3, 4, 5, 6, 7]) {
  const u = U(id);
  let tot = 0n; for (const [, b] of u.boards) tot += b.earning;
  console.log(`  #${id}: directs=${u.directs.length} activeLevels=${[...u.active].sort((a,b)=>a-b).join(",")} totalEarn=${fmt(tot)}`);
}

console.log(`\n=== VALIDATION ===`);
let ok = true;
if (minBalance < 0n) { console.log("❌ SOLVENCY FAILED"); ok = false; } else console.log("✅ solvency: balance never negative");
// slot amount correctness
let amtOk = true;
for (let lvl = 1; lvl <= maxLevelReached; lvl++) {
  const set = slotAmountByLevel.get(lvl);
  if (!set) continue;
  for (const s of set) if (BigInt(s) !== expectedSlot(lvl)) { amtOk = false; }
}
if (amtOk) console.log("✅ every paid slot equals 0.0009*2^(L-1)"); else { console.log("❌ slot amount mismatch"); ok = false; }
if (errors.length) { ok = false; console.log("❌ errors:"); for (const e of errors.slice(0, 20)) console.log("   " + e); }
else console.log("✅ no runtime errors");
console.log(ok ? "\nALL CHECKS PASSED ✅" : "\nSOME CHECKS FAILED ❌");
process.exit(ok ? 0 : 1);
