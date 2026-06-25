/**
 * Simulation of Model B progression (free slot unlock driven by the display board).
 * Mirrors the contract: genealogy placement + _progressUpgrades (a2 pos5 -> upgrade,
 * a3 pos14 -> recycle). Verifies User#2's slot 2 unlocks from spillover (ID#10).
 */
const OWNER = 1;
const U = new Map();
const ensure = (id) => { if (!U.has(id)) U.set(id, { ref: 0, gp: 0, c0: 0, c1: 0, active: { 1: true } }); return U.get(id); };

function place(entrant, sponsor, level = 1) {
  ensure(entrant); ensure(sponsor);
  if (U.get(entrant).gp) return;
  const q = [sponsor]; let h = 0;
  while (h < q.length) {
    const n = q[h++], nn = U.get(n);
    if (!nn.c0) { nn.c0 = entrant; U.get(entrant).gp = n; return; }
    if (!nn.c1) { nn.c1 = entrant; U.get(entrant).gp = n; return; }
    q.push(nn.c0, nn.c1);
  }
}
function genPos(owner, node) {
  const dir = []; let cur = node, depth = 0;
  while (cur !== owner && depth < 3) {
    const par = U.get(cur).gp; if (!par) return 0;
    dir.push(U.get(par).c0 === cur ? 1 : 2); depth++; cur = par;
  }
  if (cur !== owner) return 0;
  let p = 0; for (let i = depth - 1; i >= 0; i--) p = p * 2 + dir[i];
  return p;
}
function progress(entrant) {
  const a1 = U.get(entrant).gp; if (!a1) return;
  const a2 = U.get(a1).gp;
  if (a2) {
    if (genPos(a2, entrant) === 5) upgrade(a2);
    const a3 = U.get(a2).gp;
    if (a3 && genPos(a3, entrant) === 14) console.log(`   ↻ RECYCLE board of U${a3}`);
  }
}
function upgrade(user) {
  const u = U.get(user);
  if (u.active[2]) return;
  u.active[2] = true;
  console.log(`   ⬆️  U${user} SLOT 2 UNLOCKED (free)`);
}
function reg(id, ref) {
  ensure(id).ref = ref;
  place(id, ref);
  console.log(`Reg U${id} (ref U${ref})`);
  progress(id);
}

ensure(OWNER);
const seq = [[2,1],[3,2],[4,1],[5,2],[6,2],[7,4],[8,1],[9,1],[10,1]];
for (const [id, ref] of seq) reg(id, ref);

console.log("\n-- User#2 (ID2) board --");
for (let pos = 1; pos <= 14; pos++) {
  // find node at this pos in U2's board
  let found = 0;
  for (const [id] of U) if (id !== 2 && genPos(2, id) === pos) { found = id; break; }
  console.log(`pos${pos}: ${found ? `ID#${found}` : "EMPTY"}`);
}
console.log("\nU2 slot2 active?", U.get(2).active[2] === true);
