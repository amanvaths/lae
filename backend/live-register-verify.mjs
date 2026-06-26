/**
 * LIVE on-chain test: register N fresh wallets under one sponsor and verify,
 * immediately after EACH registration, the occupant's position in the
 * sponsor's matrix via usersXMatrixReferrals (real storage, no cache).
 *
 * Requirements (env):
 *   BSC_RPC_URL           - BSC testnet RPC (default public)
 *   FUNDER_PRIVATE_KEY    - a wallet with testnet BNB to fund gas for each wallet
 *   SPONSOR_ID            - existing (non-owner, unlocked) user id to register under
 *   COUNT                 - how many wallets to create (default 15)
 *
 * The payment token must expose faucet(uint256) (TestPaymentToken does).
 *
 * Run:  cd backend && FUNDER_PRIVATE_KEY=0x... SPONSOR_ID=2 node live-register-verify.mjs
 */
import { ethers } from "ethers";

const ADDR = "0x6B9e24f2559A2F3007E9c126B3207850A4AF1cFe";
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org";
const FUNDER = process.env.FUNDER_PRIVATE_KEY;
// We create a FRESH sponsor (empty matrix) under SEED_REFERRER, then register
// COUNT wallets under it so positions fill cleanly 1..14 (then recycle).
const SEED_REFERRER = BigInt(process.env.SEED_REFERRER ?? "2");
const COUNT = Number(process.env.COUNT ?? "15");
const FUND_BNB = ethers.parseEther(process.env.FUND_BNB ?? "0.003");

if (!FUNDER) {
  console.error("Set FUNDER_PRIVATE_KEY (a testnet wallet with BNB to fund gas).");
  process.exit(1);
}

const MATRIX_ABI = [
  "function registrationExt(uint256 referrerId) external",
  "function idToAddress(uint256) view returns (address)",
  "function addressToId(address) view returns (uint256)",
  "function levelTokenCost(uint8) view returns (uint256)",
  "function usersXMatrixReferrals(address,uint8) view returns (address[])",
  "function PAYMENT_TOKEN() view returns (address)",
];
const ERC20_ABI = [
  "function faucet(uint256) external",
  "function approve(address,uint256) external returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
];

const provider = new ethers.JsonRpcProvider(RPC, 97, { staticNetwork: true });
const funder = new ethers.Wallet(FUNDER, provider);
const matrix = new ethers.Contract(ADDR, MATRIX_ABI, provider);

const PAY = await matrix.PAYMENT_TOKEN();
const price = await matrix.levelTokenCost(1);
console.log(`Funder=${funder.address}`);
console.log(`Payment token=${PAY} level1 price=${ethers.formatEther(price)}\n`);

function posOf(refs, addr) {
  const i = refs.findIndex((a) => a.toLowerCase() === addr.toLowerCase());
  return i >= 0 ? i + 1 : null;
}

async function fundFaucetApproveRegister(w, referrerId) {
  await (await funder.sendTransaction({ to: w.address, value: FUND_BNB })).wait();
  const token = new ethers.Contract(PAY, ERC20_ABI, w);
  await (await token.faucet(price * 2n)).wait();
  await (await token.approve(ADDR, price)).wait();
  const tx = await matrix.connect(w).registrationExt(referrerId, { gasLimit: 3_000_000n });
  return await tx.wait();
}

// ---- Create a FRESH sponsor with an empty matrix ----
console.log("Creating fresh sponsor...");
const sponsor = ethers.Wallet.createRandom().connect(provider);
await fundFaucetApproveRegister(sponsor, SEED_REFERRER);
const sponsorId = Number(await matrix.addressToId(sponsor.address));
const sponsorWallet = sponsor.address;
console.log(`Fresh sponsor id=${sponsorId} wallet=${sponsorWallet} (registered under id ${SEED_REFERRER})\n`);

const results = [];
for (let n = 1; n <= COUNT; n++) {
  const w = ethers.Wallet.createRandom().connect(provider);
  const rcpt = await fundFaucetApproveRegister(w, BigInt(sponsorId));

  // IMMEDIATELY verify sponsor matrix storage (real on-chain, no cache)
  const refs = await matrix.usersXMatrixReferrals(sponsorWallet, 1);
  const userId = Number(await matrix.addressToId(w.address));
  const pos = posOf(refs, w.address);
  const expected = ((n - 1) % 14) + 1; // sponsor matrix fills 1..14 then recycles
  const match = pos === expected ? "YES" : pos == null ? "SPILLED/RECYCLED" : "NO";
  results.push({ n, userId, wallet: w.address, pos, expected, match, len: refs.length, tx: rcpt.hash });
  console.log(`Reg#${String(n).padStart(2)} | User${userId} | sponsorMatrixPos=${pos ?? "-"} | expected=${expected} | ${match} | len=${refs.length} | ${rcpt.hash}`);
}

console.log("\n=== SUMMARY ===");
console.log("Reg# | UserID | Position | Expected | Match");
for (const r of results) {
  console.log(`${String(r.n).padStart(4)} | ${String(r.userId).padStart(6)} | ${String(r.pos ?? "-").padStart(8)} | ${String(r.expected).padStart(8)} | ${r.match}`);
}
const allOk = results.every((r) => r.match === "YES");
console.log(allOk ? "\nALL POSITIONS SEQUENTIAL & IMMEDIATE ✅" : "\nMISMATCH DETECTED ❌ (see rows above)");
process.exit(0);
