#!/usr/bin/env node
/**
 * Register fresh wallet(s) under a sponsor id on the LIVE testnet contract.
 * Reads the current contract from deployed-bsc-testnet.json.
 *
 * Env:
 *   FUNDER_PRIVATE_KEY  wallet with testnet BNB (pays gas + funds each new wallet)
 *   SPONSOR_ID          sponsor/referrer id to register under (required)
 *   COUNT               how many to register (default 1)
 *
 * Usage:
 *   FUNDER_PRIVATE_KEY=0x... SPONSOR_ID=1 node contracts/place-id.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org";
const CHAIN_ID = 97;

const deployed = JSON.parse(fs.readFileSync(path.join(__dirname, "deployed-bsc-testnet.json"), "utf8"));
const ADDR = deployed.contracts.LAEClubMatrix;

const FUNDER = process.env.FUNDER_PRIVATE_KEY;
const SPONSOR_ID = BigInt(process.env.SPONSOR_ID ?? "0");
const COUNT = Number(process.env.COUNT ?? "1");
const FUND_BNB = ethers.parseEther(process.env.FUND_BNB ?? "0.003");

if (!FUNDER) { console.error("Set FUNDER_PRIVATE_KEY"); process.exit(1); }
if (SPONSOR_ID <= 0n) { console.error("Set SPONSOR_ID"); process.exit(1); }

const MATRIX_ABI = [
  "function registrationExt(uint256 referrerId) external",
  "function idToAddress(uint256) view returns (address)",
  "function addressToId(address) view returns (uint256)",
  "function levelTokenCost(uint8) view returns (uint256)",
  "function lastUserId() view returns (uint256)",
  "function isUserExists(address) view returns (bool)",
  "function PAYMENT_TOKEN() view returns (address)",
];
const ERC20_ABI = [
  "function faucet(uint256) external",
  "function approve(address,uint256) external returns (bool)",
];

const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
const funder = new ethers.Wallet(FUNDER, provider);
const matrix = new ethers.Contract(ADDR, MATRIX_ABI, provider);

const sponsorAddr = await matrix.idToAddress(SPONSOR_ID);
if (sponsorAddr === ethers.ZeroAddress) { console.error(`Sponsor id ${SPONSOR_ID} does not exist`); process.exit(1); }

const PAY = await matrix.PAYMENT_TOKEN();
const price = await matrix.levelTokenCost(1);
console.log(`Contract=${ADDR}`);
console.log(`Funder=${funder.address}`);
console.log(`Sponsor id=${SPONSOR_ID} (${sponsorAddr})`);
console.log(`Registering ${COUNT} wallet(s), level1 price=${ethers.formatEther(price)}\n`);

const created = [];
for (let n = 1; n <= COUNT; n++) {
  const w = ethers.Wallet.createRandom().connect(provider);
  await (await funder.sendTransaction({ to: w.address, value: FUND_BNB })).wait();
  const token = new ethers.Contract(PAY, ERC20_ABI, w);
  await (await token.faucet(price * 2n)).wait();
  await (await token.approve(ADDR, price)).wait();
  const rcpt = await (await matrix.connect(w).registrationExt(SPONSOR_ID, { gasLimit: 3_000_000n })).wait();
  const newId = Number(await matrix.addressToId(w.address));
  created.push({ id: newId, wallet: w.address, pk: w.privateKey, tx: rcpt.hash });
  console.log(`Registered id #${newId} | wallet ${w.address} | tx ${rcpt.hash}`);
}

console.log(`\nlastUserId=${(await matrix.lastUserId()).toString()}`);
console.log(JSON.stringify(created, null, 2));
process.exit(0);
