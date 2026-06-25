/**
 * Simulation: income that FOLLOWS the genealogy tree (single-pay), computed in the
 * ENTRANT'S SPONSOR board (original economics, genealogy-correct positions).
 *
 * When R registers under sponsor S, R is placed under S's leg (BFS spillover). R's
 * position in S's board (1..14) decides the single recipient via the role table:
 *   pos 1,2          -> S's upline    (S == owner -> treasury)
 *   pos 3,6,8,9,11,12-> S (self income)
 *   pos 4            -> reserve / club pool
 *   pos 5            -> auto-upgrade S
 *   pos 7,10         -> S's 1st downline
 *   pos 13           -> S's 2nd downline
 *   pos 14           -> recycle credit to S
 * This is single-pay (exactly one recipient per registration, no money lost) and the
 * recipient matches what the dashboard shows.
 */

const MATRIX_SIZE = 14;
const OWNER = 1;

const U = new Map(); // id -> { sponsor, gParent, gChild0, gChild1 }
function ensure(id) {
  if (!U.has(id)) U.set(id, { sponsor: 0, gParent: 0, gChild0: 0, gChild1: 0 });
  return U.get(id);
}

function placeGenealogy(entrant, sponsor) {
  ensure(entrant).sponsor = sponsor;
  ensure(sponsor);
  if (U.get(entrant).gParent !== 0) return;
  const q = [sponsor];
  let h = 0;
  while (h < q.length) {
    const n = q[h++];
    const nn = U.get(n);
    if (nn.gChild0 === 0) { nn.gChild0 = entrant; U.get(entrant).gParent = n; return; }
    if (nn.gChild1 === 0) { nn.gChild1 = entrant; U.get(entrant).gParent = n; return; }
    q.push(nn.gChild0, nn.gChild1);
  }
}

// position (1..14) of node in boardOwner's board, mirrors contract _genPosition (path encode)
function genPosition(boardOwner, node) {
  const dir = [];
  let cur = node, depth = 0;
  while (cur !== boardOwner && depth < 3) {
    const par = U.get(cur).gParent;
    if (par === 0) return 0;
    dir.push(U.get(par).gChild0 === cur ? 1 : 2);
    depth++; cur = par;
  }
  if (cur !== boardOwner) return 0;
  let p = 0;
  for (let i = depth - 1; i >= 0; i--) p = p * 2 + dir[i];
  return p;
}

function roleOf(p) {
  if (p === 1 || p === 2) return "upline";
  if (p === 3 || p === 6 || p === 8 || p === 9 || p === 11 || p === 12) return "self";
  if (p === 4) return "reserve";
  if (p === 5) return "upgrade";
  if (p === 7 || p === 10) return "downline1";
  if (p === 13) return "downline2";
  if (p === 14) return "recycle";
  return "overflow";
}

function income(R) {
  const S = U.get(R).sponsor || OWNER;
  const pos = genPosition(S, R);
  const role = roleOf(pos);
  let recipient;
  if (pos === 0) recipient = "TREASURY(overflow)";
  else if (role === "upline") {
    let up = U.get(S).sponsor;
    if (pos === 2 && up) up = U.get(up).sponsor;
    recipient = (S === OWNER || !up) ? "TREASURY" : `U${up}`;
  } else if (role === "self") recipient = `U${S}`;
  else if (role === "reserve") recipient = "CLUB_POOL";
  else if (role === "upgrade") recipient = `U${S}(upgrade)`;
  else if (role === "downline1" || role === "downline2") recipient = `U${S}-downline`;
  else if (role === "recycle") recipient = `RECYCLE U${S}`;
  return { S, pos, role, recipient };
}

function reg(id, sponsor) {
  placeGenealogy(id, sponsor);
  const inc = income(id);
  console.log(`Reg U${id} (sponsor U${sponsor}) -> in U${inc.S} board pos ${inc.pos} (${inc.role}) => ${inc.recipient}`);
  return inc;
}

console.log("===== USER'S CASE =====");
ensure(OWNER);
reg(2, 1);
reg(3, 2);
console.log("Expect: U2 -> TREASURY ; U3 -> U1 (owner earns as U2's upline)\n");

console.log("===== OWNER gets 6 self-incomes as its own board fills (owner refers 14) =====");
U.clear(); ensure(OWNER);
const tally = {};
for (let id = 2; id <= 15; id++) { const inc = reg(id, 1); tally[inc.recipient] = (tally[inc.recipient]||0)+1; }
console.log("\nTally:", tally);

console.log("\n===== Deeper chain: each sponsor earns self from their spillover =====");
U.clear(); ensure(OWNER);
// owner -> 2 ; 2 -> 3..; build 2's board
reg(2, 1);
for (let id = 3; id <= 16; id++) reg(id, 2); // U2 refers 14 -> U2 should get 6 self
