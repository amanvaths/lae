#!/usr/bin/env node
/**
 * Fresh binary-tree seeding via registrationSys (owner pays).
 *
 * Creates COUNT new wallets and registers them so userId i is placed under
 * sponsor floor(i/2), producing a standard binary tree:
 *   #2,#3 under #1; #4,#5 under #2; #6,#7 under #3; ...
 *
 * Saves created wallets + tx hashes to JSON for later use.
 *
 * Env:
 *   DEPLOYER_PRIVATE_KEY  required, owner wallet private key
 *   COUNT                 number of new users to add (default 64)
 *   OUTPUT_FILE           optional json output path
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org";
const CHAIN_ID = 97;
const COUNT = Number(process.env.COUNT ?? "64");
const OUTPUT_FILE =
  process.env.OUTPUT_FILE ?? path.join(__dirname, `seed-binary-${COUNT}.json`);

const pk = process.env.DEPLOYER_PRIVATE_KEY;
if (!pk) {
  console.error("Set DEPLOYER_PRIVATE_KEY");
  process.exit(1);
}

const deployed = JSON.parse(
  fs.readFileSync(path.join(__dirname, "deployed-bsc-testnet.json"), "utf8")
);
const ADDR = deployed.contracts.LAEClubMatrix;

const MATRIX_ABI = [
  "function registrationSys(uint256 referrerId, address userAddress) external",
  "function levelTokenCost(uint8) view returns (uint256)",
  "function PAYMENT_TOKEN() view returns (address)",
  "function lastUserId() view returns (uint256)",
  "function addressToId(address) view returns (uint256)",
];
const ERC20_ABI = [
  "function faucet(uint256) external",
  "function approve(address,uint256) external returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
const owner = new ethers.Wallet(pk, provider);
const matrix = new ethers.Contract(ADDR, MATRIX_ABI, owner);
const payToken = new ethers.Contract(await matrix.PAYMENT_TOKEN(), ERC20_ABI, owner);

const price = await matrix.levelTokenCost(1);
const totalCost = price * BigInt(COUNT);
const topUp = totalCost * 2n;

console.log(`Contract=${ADDR}`);
console.log(`Owner=${owner.address}`);
console.log(`COUNT=${COUNT} totalCost=${ethers.formatEther(totalCost)} token`);

await (await payToken.faucet(topUp)).wait();
const allowance = await payToken.allowance(owner.address, ADDR);
if (allowance < totalCost) {
  await (await payToken.approve(ADDR, topUp)).wait();
}
console.log(`Token approved for seeding`);

const rows = [];
for (let userId = 2; userId <= COUNT + 1; userId++) {
  const sponsorId = Math.floor(userId / 2);
  const w = ethers.Wallet.createRandom();
  const tx = await matrix.registrationSys(sponsorId, w.address, { gasLimit: 3_000_000n });
  const rcpt = await tx.wait();
  const actualId = Number(await matrix.addressToId(w.address));
  rows.push({
    id: actualId,
    sponsorId,
    wallet: w.address,
    pk: w.privateKey,
    tx: rcpt.hash,
  });
  console.log(`Registered id #${actualId} under #${sponsorId} | ${w.address} | ${rcpt.hash}`);
}

const lastUserId = await matrix.lastUserId();
console.log(`lastUserId=${lastUserId.toString()}`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
  contract: ADDR,
  count: COUNT,
  owner: owner.address,
  rows,
}, null, 2));
console.log(`Saved ${rows.length} rows to ${OUTPUT_FILE}`);
