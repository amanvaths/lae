#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const envPath of [join(__dirname, "../.env"), join(__dirname, "../../.env.local")]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const MATRIX = process.env.LAE_MATRIX_CONTRACT_ADDRESS ?? "0xbb3dE7b61f16A2d6Bab6f19f54e03134105618CF";
const LAECOIN = process.env.LAE_COIN_CONTRACT_ADDRESS ?? "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A";
const PAYMENT = process.env.PAYMENT_TOKEN_ADDRESS ?? "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575";
const FE_MATRIX = process.env.NEXT_PUBLIC_LAE_MATRIX_CONTRACT ?? "0xbb3dE7b61f16A2d6Bab6f19f54e03134105618CF";
const FE_COIN = process.env.NEXT_PUBLIC_LAE_COIN_CONTRACT ?? "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A";
const FE_PAYMENT = process.env.NEXT_PUBLIC_PAYMENT_TOKEN ?? "0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575";
const API = process.env.API_URL ?? "http://localhost:4000";
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org";

const prisma = new PrismaClient();
const p = new ethers.JsonRpcProvider(RPC, 97);
const report = {};

async function main() {
  // Address parity FE vs BE
  report.addressParity = {
    matrix: MATRIX.toLowerCase() === FE_MATRIX.toLowerCase(),
    laeCoin: LAECOIN.toLowerCase() === FE_COIN.toLowerCase(),
    payment: PAYMENT.toLowerCase() === FE_PAYMENT.toLowerCase(),
    backend: { matrix: MATRIX, laeCoin: LAECOIN, payment: PAYMENT },
    frontend: { matrix: FE_MATRIX, laeCoin: FE_COIN, payment: FE_PAYMENT },
  };

  // DB
  const tables = {
    mc_users: await prisma.matrixCoreUser.count(),
    mc_positions: await prisma.matrixCorePosition.count(),
    mc_income: await prisma.matrixCoreIncome.count(),
    mc_recycles: await prisma.matrixCoreRecycle.count(),
    chain_events: await prisma.chainEvent.count(),
    idx_users: Number((await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM idx_users`)[0].c),
    idx_incomes: Number((await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM idx_incomes`)[0].c),
    idx_referrals: Number((await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM idx_referrals`)[0].c),
  };
  const dupUsers = await prisma.$queryRaw`
    SELECT wallet_address, COUNT(*)::int AS c FROM mc_users GROUP BY wallet_address HAVING COUNT(*) > 1
  `;
  const dupPositions = await prisma.$queryRaw`
    SELECT matrix_owner_id, level, cycle_id, position, COUNT(*)::int AS c
    FROM mc_positions GROUP BY 1,2,3,4 HAVING COUNT(*) > 1
  `;
  const orphanPos = Number(
    (
      await prisma.$queryRaw`
      SELECT COUNT(*)::int AS c FROM mc_positions p
      LEFT JOIN mc_users u ON u.user_id = p.matrix_owner_id
      WHERE u.user_id IS NULL
    `
    )[0].c
  );
  report.database = { tables, dupUsers, dupPositions, orphanPos };

  // Indexer
  const state = await prisma.indexerState.findUnique({ where: { id: "main" } });
  const head = await p.getBlockNumber();
  report.indexer = {
    lastBlock: state?.lastBlock?.toString(),
    deployBlock: process.env.LAE_MATRIX_DEPLOY_BLOCK,
    head,
    lag: head - Number(state?.lastBlock ?? 0),
    syncMode: process.env.INDEXER_SYNC_MODE,
    events: await prisma.chainEvent.groupBy({ by: ["eventName"], _count: true }),
  };

  // Contracts
  const m = new ethers.Contract(
    MATRIX,
    [
      "function lastUserId() view returns (uint256)",
      "function PAYMENT_TOKEN() view returns (address)",
      "function LAE_COIN_ADDRESS() view returns (address)",
      "function getUserDetails(uint256) view returns (address,address,uint256,uint256,uint8,uint256,uint256,uint256)",
      "function usersXMatrixReferrals(address,uint8) view returns (address[])",
      "function monthlyReleaseBps(uint256) view returns (uint256)",
      "function directRequirementByMonth(uint256) view returns (uint256)",
      "function matrixDistributionBps() view returns (uint256)",
      "function liquidityAllocationBps() view returns (uint256)",
      "function getLaeRewardSummary(address) view returns (uint256,uint256,uint256,uint256,uint256)",
    ],
    p
  );
  const c = new ethers.Contract(
    LAECOIN,
    [
      "function matrixContract() view returns (address)",
      "function totalSupply() view returns (uint256)",
      "function rewardPoolRemaining() view returns (uint256)",
      "function rewardPoolMinted() view returns (uint256)",
      "function rewardPoolAllocated() view returns (uint256)",
      "function p2pEnabled() view returns (bool)",
      "function p2pPaymentToken() view returns (address)",
      "function nextOrderId() view returns (uint256)",
    ],
    p
  );

  const lastId = Number(await m.lastUserId());
  const u1 = await m.getUserDetails(1);
  const refs = await m.usersXMatrixReferrals(u1[0], 1);
  const owner = u1[0];
  const rewardSummary = await m.getLaeRewardSummary(owner);

  report.contract = {
    lastUserId: lastId,
    paymentOnChain: (await m.PAYMENT_TOKEN()).toLowerCase(),
    paymentMatch: (await m.PAYMENT_TOKEN()).toLowerCase() === PAYMENT.toLowerCase(),
    laeOnMatrix: (await m.LAE_COIN_ADDRESS()).toLowerCase(),
    matrixOnCoin: (await c.matrixContract()).toLowerCase(),
    crossLinked:
      (await m.LAE_COIN_ADDRESS()).toLowerCase() === LAECOIN.toLowerCase() &&
      (await c.matrixContract()).toLowerCase() === MATRIX.toLowerCase(),
    user1: { addr: u1[0], income: u1[7].toString(), directRefs: Number(u1[3]) },
    l1Referrals: refs.length,
    month1Bps: Number(await m.monthlyReleaseBps(0)),
    month20Directs: Number(await m.directRequirementByMonth(19)),
    matrixBps: Number(await m.matrixDistributionBps()),
    liquidityBps: Number(await m.liquidityAllocationBps()),
    totalSupply: (await c.totalSupply()).toString(),
    rewardPoolMinted: (await c.rewardPoolMinted()).toString(),
    rewardPoolRemaining: (await c.rewardPoolRemaining()).toString(),
    rewardPoolAllocated: (await c.rewardPoolAllocated()).toString(),
    rewardSummary: rewardSummary.map((x) => x.toString()),
    p2p: {
      enabled: await c.p2pEnabled(),
      token: await c.p2pPaymentToken(),
      orders: Number(await c.nextOrderId()),
    },
  };

  // Matrix API vs chain
  let firstIncorrectSlot = null;
  let firstIncorrectUser = null;
  const apiRes = await fetch(`${API}/api/matrix/tree/1/1/1`);
  const api = await apiRes.json();
  const chainCount = Number(refs.length ?? 0);
  for (let pos = 1; pos <= chainCount; pos++) {
    const chainAddr = String(refs[pos - 1]).toLowerCase();
    const apiAddr = api.slots?.[pos - 1]?.address?.toLowerCase() ?? null;
    if (chainAddr !== apiAddr) {
      firstIncorrectSlot = { userId: 1, level: 1, cycle: 1, position: pos, chainAddr, apiAddr };
      firstIncorrectUser = 1;
      break;
    }
  }
  report.matrix = {
    apiStatus: apiRes.status,
    apiFilledSpots: api.filledSpots,
    chainRefs: chainCount,
    firstIncorrectSlot,
    firstIncorrectUser,
  };

  // API smoke + timing
  const endpoints = [
    "/health",
    "/api/matrix/tree/1/1/1",
    "/api/matrix/overview/1",
    "/api/matrix/placement/1",
    "/api/indexer/status",
    "/api/dashboard",
    "/api/income",
    "/api/rewards",
    "/api/transactions",
    "/api/team",
    "/api/referrals",
  ];
  report.apis = {};
  for (const ep of endpoints) {
    const t0 = Date.now();
    try {
      const r = await fetch(`${API}${ep}`);
      const body = r.ok ? await r.json() : await r.text();
      report.apis[ep] = {
        status: r.status,
        ms: Date.now() - t0,
        ok: r.ok,
        hasNull: JSON.stringify(body).includes("null") && ep.includes("tree"),
      };
    } catch (e) {
      report.apis[ep] = { error: e.message, ms: Date.now() - t0 };
    }
  }

  // Pass/fail summary
  const supply = BigInt(report.contract.totalSupply);
  const poolMinted = BigInt(report.contract.rewardPoolMinted);
  report.summary = {
    contractPass:
      report.addressParity.matrix &&
      report.addressParity.laeCoin &&
      report.addressParity.payment &&
      report.contract.crossLinked &&
      report.contract.month1Bps === 500 &&
      report.contract.month20Directs === 21,
    databasePass:
      tables.idx_users === 0 &&
      dupUsers.length === 0 &&
      dupPositions.length === 0 &&
      orphanPos === 0,
    indexerPass:
      report.indexer.lag <= 20 &&
      tables.chain_events > 0 &&
      Number(state?.lastBlock ?? 0) >= head - 20,
    backendPass: Object.values(report.apis).every((a) => a.ok || a.status === 200),
    matrixPass: !firstIncorrectSlot && apiRes.ok,
    rewardsPass:
      report.contract.month1Bps === 500 &&
      report.contract.month20Directs === 21 &&
      poolMinted >= 400000000000000000000000n,
    p2pPass: report.contract.p2p.enabled,
    registrationPass: lastId >= 3,
    oldDataRemaining: tables.idx_users > 0 || tables.mc_users > 10,
    btitanRemaining: tables.idx_users > 0,
    ready: false,
  };
  report.summary.ready =
    report.summary.contractPass &&
    report.summary.databasePass &&
    report.summary.indexerPass &&
    report.summary.backendPass &&
    report.summary.matrixPass &&
    report.summary.rewardsPass &&
    report.summary.registrationPass;

  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
  process.exit(report.summary.ready ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
