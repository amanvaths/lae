#!/usr/bin/env node
/** Resume binary-tree seed on existing matrix (skips registered IDs). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";
import solc from "solc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org";
const MATRIX = process.env.MATRIX_ADDRESS ?? "0x57455f4487285d7a826Be6aD88e1C7B5bbF5A229";
const MAX_USERS = Number(process.env.MAX_USERS ?? "250");
const GAS_LIMIT = BigInt(process.env.GAS_LIMIT ?? "7000000");

function addrForUserId(userId) {
  return ethers.getAddress(ethers.zeroPadValue(ethers.toBeHex(BigInt(userId) + 0x100000n), 20));
}

function buildBinaryTreeSponsors(maxId) {
  const sponsors = [];
  const ids = [1];
  let next = 0;
  let childCount = 0;
  for (let id = 2; id <= maxId; id++) {
    sponsors.push([id, ids[next]]);
    ids.push(id);
    childCount++;
    if (childCount === 2) {
      childCount = 0;
      next++;
    }
  }
  return sponsors;
}

function compileAbi() {
  const source = fs.readFileSync(path.join(__dirname, "LAEClubMatrix.sol"), "utf8");
  const output = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources: { "LAEClubMatrix.sol": { content: source } },
        settings: {
          optimizer: { enabled: true, runs: 200 },
          viaIR: true,
          outputSelection: { "*": { "*": ["abi"] } },
        },
      })
    )
  );
  return output.contracts["LAEClubMatrix.sol"].LAEClubMatrix.abi;
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("Set DEPLOYER_PRIVATE_KEY");
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(RPC, 97, { staticNetwork: true });
  const wallet = new ethers.Wallet(pk, provider);
  const bal = await provider.getBalance(wallet.address);
  console.log("Resume seed on", MATRIX);
  console.log("Deployer BNB:", ethers.formatEther(bal));
  if (bal < 500_000_000_000_000n) {
    console.error("Need ~0.0005+ BNB. Fund: https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }

  const abi = compileAbi();
  const matrix = new ethers.Contract(MATRIX, abi, wallet);
  const last = Number(await matrix.lastUserId());
  console.log("lastUserId on chain:", last);

  const sponsors = buildBinaryTreeSponsors(MAX_USERS);
  let done = 0;
  for (const [userId, sponsorId] of sponsors) {
    if (userId <= 3) continue;
    const existing = await matrix.idToAddress(userId);
    if (existing !== ethers.ZeroAddress) continue;
    process.stdout.write(`reg #${userId} under #${sponsorId}... `);
    const userAddr = addrForUserId(userId);
    let gasLimit = GAS_LIMIT;
    try {
      const est = await matrix.registrationSys.estimateGas(sponsorId, userAddr);
      gasLimit = (est * 120n) / 100n + 50_000n;
    } catch {
      /* fallback to GAS_LIMIT */
    }
    const tx = await matrix.registrationSys(sponsorId, userAddr, {
      gasLimit,
    });
    await tx.wait();
    console.log("ok", tx.hash.slice(0, 14));
    done++;
  }
  console.log("Registered", done, "more users. lastUserId:", (await matrix.lastUserId()).toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
