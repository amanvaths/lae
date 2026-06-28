"use strict";
/**
 * User's exact bug scenario — genealogy placement + frontier income:
 *   Owner board fills (#2..#15), recycles.
 *   #2 board slot 7 (#16) -> #4 (NOT owner)
 *   #2 board slots 8,9 (#17,#18) -> #2 (NOT owner)
 */

const { Reference } = require("./reference.js");

const TREASURY = "TREASURY";

function run() {
  const ref = new Reference();
  const order = [
    [2, 1], [3, 1],
    [4, 2], [5, 2],
    [6, 3], [7, 3],
    [8, 4], [9, 4],
    [10, 5], [11, 5],
    [12, 6], [13, 6],
    [14, 7], [15, 7],
    [16, 8], [17, 8],
    [18, 9], [19, 9],
  ];
  for (const [, sponsor] of order) ref.register(sponsor);

  const recv = new Map();
  for (const p of ref.payouts) recv.set(p.fromId, p.treasury ? TREASURY : p.receiverId);

  const expected = {
    2: 1, 3: 1, 4: 1, 5: TREASURY, 6: TREASURY, 7: 1,
    8: 2, 9: 1, 10: 1, 11: 3, 12: 1, 13: 1, 14: 4, 15: TREASURY,
    16: 4, 17: 2, 18: 2, 19: 5,
  };

  let fail = 0;
  const lbl = (v) => (v === TREASURY ? "TREASURY" : `#${v}`);
  console.log("Genealogy placement + frontier income — your exact scenario:");
  for (const id of Object.keys(expected).map(Number)) {
    const got = recv.get(id), want = expected[id];
    const ok = got === want;
    if (!ok) fail++;
    console.log(`  #${String(id).padEnd(3)} -> want ${lbl(want).padEnd(9)} | got ${lbl(got).padEnd(9)} ${ok ? "OK" : "FAIL"}`);
  }

  const leak = [16, 17, 18, 19].filter((id) => recv.get(id) === 1);
  console.log(`\nOwner leak on #16..#19: ${leak.length === 0 ? "NONE (fixed)" : "LEAK " + leak.join(",")}`);

  // placement check: #16 should be on #2's board at slot 7
  const b2 = ref.users.get(2);
  const slotOf16 = b2.slots.indexOf(16) + 1;
  console.log(`#16 on #2 board slot: ${slotOf16} (expect 7)`);

  const ok = fail === 0 && leak.length === 0 && slotOf16 === 7;
  console.log(`\nRESULT: ${ok ? "PASS — client-ready" : "FAIL"}`);
  process.exit(ok ? 0 : 1);
}

run();
