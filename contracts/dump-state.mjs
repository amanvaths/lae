#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "../backend/node_modules/ethers/lib.esm/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPC = process.env.BSC_RPC_URL ?? "https://bsc-testnet.bnbchain.org";
const deployed = JSON.parse(fs.readFileSync(path.join(__dirname, "deployed-bsc-testnet.json"), "utf8"));
const ADDR = deployed.contracts.LAEClubMatrix;

const ABI = [
  "function lastUserId() view returns (uint256)",
  "function idToAddress(uint256) view returns (address)",
  "function addressToId(address) view returns (uint256)",
  "function isUserSlotActive(uint256 userId, uint8 slot) view returns (bool)",
  "function usersXMatrixReferrals(address,uint8) view returns (address[])",
  "function usersXMatrix(address,uint8) view returns (address currentReferrer,uint256 reinvestCount,uint256 heldTokenForUpgrade,uint256 lastSpill,uint256 totalTeamSize,uint256 totalEarning)",
  "function getUserDetails(uint256) view returns (address,address,uint256,uint256,uint8,uint256,uint256,uint256)",
];

const provider = new ethers.JsonRpcProvider(RPC, 97, { staticNetwork: true });
const m = new ethers.Contract(ADDR, ABI, provider);
const last = Number(await m.lastUserId());

const idOf = new Map();
for (let i = 1; i < last; i++) idOf.set((await m.idToAddress(i)).toLowerCase(), i);
const ids = (arr) => arr.filter((a) => a !== ethers.ZeroAddress).map((a) => idOf.get(a.toLowerCase()) ?? "?");

console.log(`Contract ${ADDR}  lastUserId=${last}\n`);
for (let i = 1; i < last; i++) {
  const addr = await m.idToAddress(i);
  const d = await m.getUserDetails(i);
  const inc = ethers.formatEther(d[7]);
  let line = `#${i}  income=${inc}`;
  for (let lvl = 1; lvl <= 3; lvl++) {
    const active = await m.isUserSlotActive(i, lvl);
    if (!active) continue;
    const info = await m.usersXMatrix(addr, lvl);
    const slots = ids(await m.usersXMatrixReferrals(addr, lvl));
    line += `\n     L${lvl} cyc${Number(info[1]) + 1} held=${ethers.formatEther(info[2])} slots[${slots.join(",")}]`;
  }
  console.log(line);
}
process.exit(0);
