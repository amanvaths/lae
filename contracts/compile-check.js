const solc = require("solc");
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const files = ["LAELimitless.sol", "LAEToken.sol", "LAESpin.sol", "LAEStaking.sol"];
const sources = {};
for (const f of files) {
  sources[f] = { content: fs.readFileSync(path.join(dir, f), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    outputSelection: { "*": { "*": ["evm.bytecode"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
for (const e of output.errors || []) {
  if (e.severity === "error") {
    console.error(e.formattedMessage);
    process.exit(1);
  }
}

for (const f of files) {
  const name = f.replace(".sol", "");
  const bytes = output.contracts[f][name].evm.bytecode.object.length / 2;
  console.log(`${name}: ${bytes} bytes ${bytes <= 24576 ? "OK" : "FAIL"}`);
}
