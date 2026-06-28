"use strict";
/**
 * Copies the real contracts into ./contracts so Hardhat (v2) can compile them
 * (it refuses sources outside the project root). Run automatically before tests.
 * The exact-match test re-verifies these copies are byte-identical to source.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..", "contracts");
const DST = path.resolve(__dirname, "contracts");
const FILES = ["LAEClubMatrix.sol", "TestPaymentToken.sol"];

fs.mkdirSync(DST, { recursive: true });
for (const f of FILES) {
  const src = fs.readFileSync(path.join(SRC, f), "utf8");
  fs.writeFileSync(path.join(DST, f), src);
  console.log(`copied ${f} (${src.length} bytes)`);
}

module.exports = { SRC, DST, FILES };
