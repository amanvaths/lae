// Compile-check for the modular 14 Position Matrix contracts.
// Resolves @openzeppelin imports from node_modules and verifies the deployable
// MatrixCore stays under the 24,576-byte EVM contract size limit.
const solc = require("solc");
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const repoNodeModules = path.join(dir, "..", "..", "node_modules");

const entryFiles = [
  "MatrixStorage.sol",
  "MatrixIncome.sol",
  "MatrixRecycle.sol",
  "MatrixPlacement.sol",
  "MatrixCore.sol",
];

const sources = {};
for (const f of entryFiles) {
  sources[f] = { content: fs.readFileSync(path.join(dir, f), "utf8") };
}

function findImport(importPath) {
  // local relative imports are already in `sources`; resolve node_modules ones
  try {
    const full = path.join(repoNodeModules, importPath);
    return { contents: fs.readFileSync(full, "utf8") };
  } catch (e) {
    return { error: "File not found: " + importPath };
  }
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    outputSelection: { "*": { "*": ["evm.bytecode.object"] } },
  },
};

const output = JSON.parse(
  solc.compile(JSON.stringify(input), { import: findImport })
);

let hasError = false;
for (const e of output.errors || []) {
  if (e.severity === "error") {
    hasError = true;
    console.error(e.formattedMessage);
  } else if (e.severity === "warning") {
    console.warn(e.formattedMessage);
  }
}
if (hasError) process.exit(1);

const bytes =
  output.contracts["MatrixCore.sol"]["MatrixCore"].evm.bytecode.object.length /
  2;
console.log(
  `MatrixCore: ${bytes} bytes ${bytes <= 24576 ? "OK (under 24576 limit)" : "FAIL (over limit)"}`
);
if (bytes > 24576) process.exit(1);
