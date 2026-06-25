/**
 * Faithful JS mirror of the contract's display-genealogy logic
 * (_placeGenealogy + usersXMatrixReferrals) in LAEClubMatrix.sol.
 *
 * Goal: prove the new placement renders each member under its OWN sponsor's leg,
 * top->bottom / left->right, before deploying (Solidity can't be compiled here).
 */

const MATRIX_SIZE = 14;

// users[id] = { gParent, gChild0, gChild1 } per level (level fixed = 1 here)
const U = new Map();
function ensure(id) {
  if (!U.has(id)) U.set(id, { gParent: 0, gChild0: 0, gChild1: 0 });
  return U.get(id);
}

// Mirror of _placeGenealogy(entrant, sponsor, level)
function placeGenealogy(entrant, sponsor) {
  ensure(entrant);
  ensure(sponsor);
  if (entrant === sponsor) return;
  if (U.get(entrant).gParent !== 0) return; // already placed

  const queue = [];
  queue.push(sponsor);
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    const n = U.get(node);
    if (n.gChild0 === 0) { n.gChild0 = entrant; U.get(entrant).gParent = node; return; }
    if (n.gChild1 === 0) { n.gChild1 = entrant; U.get(entrant).gParent = node; return; }
    queue.push(n.gChild0);
    queue.push(n.gChild1);
  }
}

// Mirror of usersXMatrixReferrals(userAddress, level) -> address[14] (0 = empty)
// Positional level-order fill (matches the gas-light contract view, no queue).
function board(owner) {
  const result = new Array(MATRIX_SIZE).fill(0);
  const o = ensure(owner);
  result[0] = o.gChild0;
  result[1] = o.gChild1;
  for (let p = 2; p < MATRIX_SIZE; p++) {
    const parentAddr = result[(p - 2) >> 1];
    if (parentAddr === 0) continue;
    const pn = ensure(parentAddr);
    result[p] = p % 2 === 0 ? pn.gChild0 : pn.gChild1;
  }
  return result;
}

function show(label, owner) {
  const b = board(owner);
  const c = (p) => (b[p] ? "U" + b[p] : "-");
  console.log(`${label} (owner U${owner}):`);
  console.log("  L1: " + [0, 1].map((p) => `P${p + 1}=${c(p)}`).join("  "));
  console.log("  L2: " + [2, 3, 4, 5].map((p) => `P${p + 1}=${c(p)}`).join("  "));
  console.log("  L3: " + [6, 7, 8, 9, 10, 11, 12, 13].map((p) => `P${p + 1}=${c(p)}`).join("  "));
}

function check(b, expected) {
  let ok = true;
  for (const [p, uid] of Object.entries(expected)) {
    if (b[p - 1] !== uid) { ok = false; console.log(`  MISMATCH P${p}: got ${b[p - 1] ? "U" + b[p - 1] : "-"} expected U${uid}`); }
  }
  return ok;
}

function reset() { U.clear(); }

// ---------- TEST 1: live registration genealogy (balanced) ----------
console.log("===== TEST 1: live data (User8/9/10/11 must sit under correct parent) =====");
reset();
ensure(1); // owner
[[2,1],[3,1],[4,2],[5,2],[6,3],[7,3],[8,4],[9,4],[10,5],[11,5]].forEach(([id, sp]) => placeGenealogy(id, sp));
show("Owner board", 1);
const t1 = check(board(1), { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11 });
console.log(t1 ? "  RESULT: ✅ User9->P8, User10->P9, User11->P10 (was buggy P7/P8 before)" : "  RESULT: ❌");

// ---------- TEST 2: spillover (one sponsor refers 6 directly) ----------
console.log("\n===== TEST 2: spillover top->bottom left->right =====");
reset();
ensure(100);
for (let k = 101; k <= 106; k++) placeGenealogy(k, 100);
show("U100 board", 100);
const t2 = check(board(100), { 1: 101, 2: 102, 3: 103, 4: 104, 5: 105, 6: 106 });
console.log(t2 ? "  RESULT: ✅ 3rd/4th under P1, 5th/6th under P2 (spillover down)" : "  RESULT: ❌");

// ---------- TEST 3: deep spillover (refer 7th -> goes to level 3) ----------
console.log("\n===== TEST 3: 7th direct spills to level 3 =====");
reset();
ensure(200);
for (let k = 201; k <= 207; k++) placeGenealogy(k, 200);
show("U200 board", 200);
// 201,202 -> P1,P2; 203,204 under 201 -> P3,P4; 205,206 under 202 -> P5,P6; 207 under 203 -> P7
const t3 = check(board(200), { 1: 201, 2: 202, 3: 203, 4: 204, 5: 205, 6: 206, 7: 207 });
console.log(t3 ? "  RESULT: ✅ 7th lands at P7 (under P3) — no skipping" : "  RESULT: ❌");

// ---------- TEST 4: sponsor-leg integrity (mixed) ----------
console.log("\n===== TEST 4: every member under its own sponsor's leg =====");
reset();
ensure(1);
const regs = [[2,1],[3,1],[4,2],[5,1],[6,2],[7,5],[8,5],[9,3],[10,3],[11,2]];
regs.forEach(([id, sp]) => placeGenealogy(id, sp));
let t4 = true;
for (const [id, sp] of regs) {
  // walk up gParent from id; the sponsor must be an ancestor (or direct parent)
  let cur = U.get(id).gParent;
  let found = false;
  while (cur !== 0) { if (cur === sp) { found = true; break; } cur = U.get(cur).gParent; }
  if (!found) { t4 = false; console.log(`  U${id} (sponsor U${sp}) NOT under sponsor's leg (parent U${U.get(id).gParent})`); }
}
console.log(t4 ? "  RESULT: ✅ all members under their own sponsor's leg" : "  RESULT: ❌");

console.log("\n" + (t1 && t2 && t3 && t4 ? "ALL TESTS PASSED ✅" : "SOME TESTS FAILED ❌"));
