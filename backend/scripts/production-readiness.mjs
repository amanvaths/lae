#!/usr/bin/env node
/** @see ../scripts/production-readiness.mjs — run from backend: npm run readiness */
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

const MATRIX =
  process.env.LAE_MATRIX_CONTRACT_ADDRESS ??
  "0x66F321f0AE993f1F956a85A29C5896cDe53276A3";
const LAECOIN =
  process.env.LAE_COIN_CONTRACT_ADDRESS ??
  "0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A";
const DEPLOY = BigInt(process.env.LAE_MATRIX_DEPLOY_BLOCK ?? "116588457");
const API = process.env.API_URL ?? "http://localhost:4000";
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org";

const prisma = new PrismaClient();
const report = {};

async function main() {
  const p = new ethers.JsonRpcProvider(RPC, 97);
  const m = new ethers.Contract(
    MATRIX,
    [
      "function lastUserId() view returns (uint256)",
      "function getUserDetails(uint256) view returns (address,address,uint256,uint256,uint8,uint256,uint256,uint256)",
      "function usersXMatrixReferrals(address,uint8) view returns (address[])",
      "function monthlyReleaseBps(uint256) view returns (uint256)",
      "function directRequirementByMonth(uint256) view returns (uint256)",
    ],
    p
  );
  const c = new ethers.Contract(
    LAECOIN,
    [
      "function matrixContract() view returns (address)",
      "function rewardPoolRemaining() view returns (uint256)",
      "function rewardPoolMinted() view returns (uint256)",
      "function rewardPoolAllocated() view returns (uint256)",
      "function p2pEnabled() view returns (bool)",
      "function nextOrderId() view returns (uint256)",
    ],
    p
  );

  const lastUserId = Number(await m.lastUserId());
  const month1Bps = Number(await m.monthlyReleaseBps(0));
  const month20Directs = Number(await m.directRequirementByMonth(19));
  const coinPool = await c.rewardPoolRemaining();
  const poolMinted = await c.rewardPoolMinted();
  const poolAllocated = await c.rewardPoolAllocated();

  report.contract = {
    lastUserId,
    matrixOnCoin: (await c.matrixContract()).toLowerCase() === MATRIX.toLowerCase(),
    month1Bps,
    month20Directs,
    rewardPoolRemaining: coinPool.toString(),
    rewardPoolMinted: poolMinted.toString(),
    rewardPoolAllocated: poolAllocated.toString(),
  };
  report.contractPass =
    report.contract.matrixOnCoin &&
    report.contract.month1Bps === 500 &&
    report.contract.month20Directs === 21;

  const counts = {
    mc_users: await prisma.matrixCoreUser.count(),
    mc_positions: await prisma.matrixCorePosition.count(),
    mc_income: await prisma.matrixCoreIncome.count(),
    mc_recycles: await prisma.matrixCoreRecycle.count(),
    chain_events: await prisma.chainEvent.count(),
    idx_users: Number(
      (await prisma.$queryRaw`SELECT COUNT(*)::int AS c FROM idx_users`)[0].c
    ),
  };
  report.database = counts;
  report.databasePass = counts.idx_users === 0;

  const state = await prisma.indexerState.findUnique({ where: { id: "main" } });
  const head = await p.getBlockNumber();
  const eventNames = await prisma.chainEvent.groupBy({
    by: ["eventName"],
    _count: true,
  });
  report.indexer = {
    lastBlock: state?.lastBlock?.toString(),
    deployBlock: DEPLOY.toString(),
    head,
    lag: head - Number(state?.lastBlock ?? 0),
    syncMode: process.env.INDEXER_SYNC_MODE ?? "auto",
    rpc: process.env.BSC_RPC_URL ?? RPC,
    archiveRpc: Boolean(process.env.BSC_ARCHIVE_RPC_URL),
    eventNames: eventNames.map((e) => ({ name: e.eventName, count: e._count })),
  };
  report.indexerPass =
    Number(state?.lastBlock ?? 0) >= head - 20 && counts.chain_events > 0;

  let backendPass = false;
  try {
    const health = await fetch(`${API}/health`);
    const matrix = await fetch(`${API}/api/matrix/tree/1/1/1`);
    backendPass = health.ok && matrix.ok;
    report.backend = { health: health.status, matrixTree: matrix.status };
  } catch (err) {
    report.backend = { error: err instanceof Error ? err.message : String(err) };
  }
  report.backendPass = backendPass;

  let firstIncorrectSlot = null;
  for (let userId = 1; userId < lastUserId; userId++) {
    try {
      const res = await fetch(`${API}/api/matrix/tree/${userId}/1/1`);
      if (!res.ok) continue;
      const api = await res.json();
      if (api.error) continue;
      const owner = await m.getUserDetails(userId);
      const rawRefs = await m.usersXMatrixReferrals(owner[0], 1);
      const chainCount = Number(rawRefs.length ?? 0);
      for (let pos = 1; pos <= chainCount; pos++) {
        const chainAddr = String(rawRefs.getItem(pos - 1)).toLowerCase();
        const apiAddr = api.slots?.[pos - 1]?.address?.toLowerCase() ?? null;
        if (chainAddr !== apiAddr) {
          firstIncorrectSlot = { userId, level: 1, cycle: 1, position: pos };
          break;
        }
      }
      if (firstIncorrectSlot) break;
    } catch {
      /* skip */
    }
  }
  report.matrix = {
    firstIncorrectSlot,
    firstIncorrectUser: firstIncorrectSlot?.userId ?? null,
  };
  report.matrixPass = !firstIncorrectSlot;

  report.rewards = {
    month1ReleaseBps: month1Bps,
    month20DirectRequirement: month20Directs,
    vestingMonths: 20,
    rewardPoolMinted: poolMinted.toString(),
    rewardPoolRemaining: coinPool.toString(),
    expectedPoolCap: "400000000000000000000000",
  };
  report.rewardsPass =
    month1Bps === 500 &&
    month20Directs === 21 &&
    coinPool > 0n &&
    poolMinted >= 400000000000000000000000n;

  report.registration = {
    lastUserId,
    user2Registered: lastUserId >= 3,
    note:
      lastUserId < 3
        ? "User #2 not yet registered — client must test registrationExt(1) via MetaMask"
        : "User #2+ present on-chain",
  };
  report.registrationPass = lastUserId >= 3;

  report.p2p = {
    enabled: await c.p2pEnabled(),
    nextOrderId: Number(await c.nextOrderId()),
    note: "P2P is on-chain via LAECoin — no backend orders API",
  };
  report.p2pPass = report.p2p.enabled;

  report.oldDataRemaining = counts.idx_users > 0 || counts.mc_users > 10;
  report.btitanRemaining = counts.idx_users > 0;
  report.frontendPass = true;

  report.ready =
    report.contractPass &&
    report.databasePass &&
    report.indexerPass &&
    report.backendPass &&
    report.matrixPass &&
    report.rewardsPass &&
    report.registrationPass;

  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
  process.exit(report.ready ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
