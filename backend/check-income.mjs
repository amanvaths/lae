import { ethers } from "ethers";

const ADDR = "0x3FF40a725dAE1057BC8B8F593CbdFE550b83e36D";
const DEPLOY_BLOCK = 116155086;
const RPCS = process.env.BSC_RPC_URL
  ? [process.env.BSC_RPC_URL]
  : [
      "https://97.rpc.thirdweb.com",
      "https://endpoints.omniatech.io/v1/bsc/testnet/public",
      "https://bsc-testnet.drpc.org",
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
    ];

const TR_TOPIC = ethers.id("TokenReceived(uint256,uint256,address,uint8,uint256)");
const LI_TOPIC = ethers.id("LapseIncome(uint256,uint256,uint8,uint256)");
const pad32 = (n) => "0x" + BigInt(n).toString(16).padStart(64, "0");

async function rpcGetLogs(url, topic0, topic1, from, to) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getLogs",
    params: [
      {
        address: ADDR,
        topics: [topic0, topic1],
        fromBlock: "0x" + BigInt(from).toString(16),
        toBlock: "0x" + BigInt(to).toString(16),
      },
    ],
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const j = await res.json();
    if (j.error) throw new Error(j.error.message);
    return j.result;
  } finally {
    clearTimeout(t);
  }
}
const TARGET = (process.env.TARGET ?? "0x7531aE0c1C4bb6C21c224E6f4409dAC73b85563F").toLowerCase();

const ABI = [
  "function addressToId(address) view returns (uint256)",
  "function idToAddress(uint256) view returns (address)",
  "function getUserDetails(uint256 userId) view returns (address userAddress, address referrerAddress, uint256 referrerId, uint256 partnersCount, uint8 activeSlotsCount, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome)",
  "event TokenReceived(uint256 indexed receiverId, uint256 indexed fromId, address indexed from, uint8 level, uint256 amount)",
  "event LapseIncome(uint256 indexed receiverId, uint256 indexed fromId, uint8 level, uint256 amount)",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function makeProvider() {
  for (const url of RPCS) {
    try {
      const p = new ethers.JsonRpcProvider(url, 97, {
        staticNetwork: true,
        batchMaxCount: 1,
      });
      await p.getBlockNumber();
      console.log(`RPC      : ${url}`);
      return p;
    } catch {
      // try next
    }
  }
  throw new Error("No working RPC");
}

const provider = await makeProvider();
const c = new ethers.Contract(ADDR, ABI, provider);

const myId = await c.addressToId(TARGET);
if (myId === 0n) {
  console.log(`Address ${TARGET} is NOT registered on contract ${ADDR}`);
  process.exit(0);
}
console.log(`Contract : ${ADDR}`);
console.log(`Address  : ${TARGET}`);
console.log(`User ID  : ${myId.toString()}`);
const d = await c.getUserDetails(myId);
console.log(`Directs  : ${d[3].toString()} | Team: ${d[5].toString()} | totalIncome(on-chain): ${ethers.formatEther(d[7])}`);
console.log("");

const head = await provider.getBlockNumber();
const CHUNK = 1000n;
const iface = new ethers.Interface(ABI);

async function scan(topic0, topic1) {
  const out = [];
  const lastErr = new Map();
  for (let from = BigInt(DEPLOY_BLOCK); from <= BigInt(head); from += CHUNK) {
    const to = from + CHUNK - 1n > BigInt(head) ? BigInt(head) : from + CHUNK - 1n;
    let logs = null;
    outer: for (let round = 0; round < 8; round++) {
      for (const url of RPCS) {
        try {
          logs = await rpcGetLogs(url, topic0, topic1, from, to);
          if (logs) break outer;
        } catch (e) {
          lastErr.set(url, String(e.message ?? e).slice(0, 90));
          await sleep(600);
        }
      }
    }
    if (logs === null) {
      for (const [u, m] of lastErr) console.error(`  [${u}] ${m}`);
    }
    if (logs === null) throw new Error(`getLogs failed ${from}-${to} on all RPCs`);
    out.push(...logs);
  }
  return out;
}

function toRows(logs, kind) {
  return logs.map((l) => {
    const p = iface.parseLog({ topics: l.topics, data: l.data });
    return {
      kind,
      fromId: p.args.fromId.toString(),
      level: Number(p.args.level),
      amount: ethers.formatEther(p.args.amount),
      block: parseInt(l.blockNumber, 16),
      tx: l.transactionHash,
    };
  });
}

const recvLogs = await scan(TR_TOPIC, pad32(myId));
const lapseLogs = await scan(LI_TOPIC, pad32(myId));
const rows = [...toRows(recvLogs, "DIRECT"), ...toRows(lapseLogs, "LAPSE")].sort(
  (a, b) => a.block - b.block
);

if (rows.length === 0) {
  console.log("No income received yet (no TokenReceived / LapseIncome events).");
  process.exit(0);
}

console.log("Income received FROM these IDs:");
console.log("KIND   | fromID | level | amount        | block      | tx");
let total = 0;
const byId = {};
for (const r of rows) {
  total += Number(r.amount);
  byId[r.fromId] = (byId[r.fromId] ?? 0) + Number(r.amount);
  console.log(
    `${r.kind.padEnd(6)} | ${r.fromId.padStart(6)} | ${String(r.level).padStart(5)} | ${r.amount.padStart(13)} | ${String(r.block).padStart(10)} | ${r.tx}`
  );
}

console.log("\n=== SUMMARY (per source ID) ===");
for (const [id, amt] of Object.entries(byId).sort((a, b) => b[1] - a[1])) {
  console.log(`From ID ${id.padStart(6)} -> ${amt} (total)`);
}
console.log(`\nTotal events: ${rows.length} | Total income: ${total}`);
process.exit(0);
