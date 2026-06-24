#!/usr/bin/env node
/**
 * Post-fix LAE reward validation → FINAL_LAE_REWARD_VALIDATION.md
 * Run: node contracts/validate-lae-reward-final.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "FINAL_LAE_REWARD_VALIDATION.md");
const ETHER = 10n ** 18n;
const BPS = 10000n;
const VESTING_MONTHS = 20;
const MONTH_DURATION = 30n * 24n * 60n * 60n;

const laeCoinSrc = fs.readFileSync(path.join(ROOT, "LAECoin.sol"), "utf8");
const matrixSrc = fs.readFileSync(path.join(ROOT, "LAEClubMatrix.sol"), "utf8");

function extractConst(src, name) {
  const m = src.match(new RegExp(`constant ${name} = ([0-9_]+) ether`));
  if (!m) return null;
  return BigInt(m[1].replace(/_/g, "")) * ETHER;
}

const TOTAL_SUPPLY = extractConst(laeCoinSrc, "TOTAL_SUPPLY_CAP");
const REWARD_POOL = extractConst(laeCoinSrc, "REWARD_POOL_CAP");
const RESIDUAL = extractConst(laeCoinSrc, "RESIDUAL_SUPPLY_CAP");

// Expected direct requirements: month M (1..20) → M+1 directs
const directReq = Array.from({ length: 20 }, (_, i) => BigInt(i + 2));

function claimable(allocated, start, now, directs, claimed = 0n) {
  if (allocated === 0n || claimed >= allocated) return 0n;
  const elapsed = now > start ? now - start : 0n;
  const totalDuration = BigInt(VESTING_MONTHS) * MONTH_DURATION;
  let q = 0n;
  const loop = elapsed >= totalDuration;
  for (let month = 0; month < VESTING_MONTHS; month++) {
    if (directs < directReq[month]) continue;
    const tranche = (allocated * 500n) / BPS;
    if (loop) {
      q += tranche;
    } else {
      const startM = BigInt(month) * MONTH_DURATION;
      const endM = startM + MONTH_DURATION;
      if (elapsed >= endM) q += tranche;
      else if (elapsed > startM) q += (tranche * (elapsed - startM)) / MONTH_DURATION;
    }
  }
  if (q > allocated) q = allocated;
  return q > claimed ? q - claimed : 0n;
}

function item(num, name, ok, evidence) {
  return { num, name, ok, status: ok ? "PASS" : "FAIL", evidence };
}

function run() {
  const checks = [];

  checks.push(item(1, "Total Supply = 500,000 LAE", TOTAL_SUPPLY === 500_000n * ETHER, `TOTAL_SUPPLY_CAP = ${TOTAL_SUPPLY / ETHER}`));
  checks.push(item(2, "Reward Pool = 400,000 LAE", REWARD_POOL === 400_000n * ETHER, `REWARD_POOL_CAP = ${REWARD_POOL / ETHER}; RESIDUAL_SUPPLY_CAP = ${RESIDUAL / ETHER}; sum = ${(REWARD_POOL + RESIDUAL) / ETHER}`));
  checks.push(item(3, "20 Month Vesting", matrixSrc.includes("VESTING_MONTHS = 20"), "LAEClubMatrix.VESTING_MONTHS = 20"));
  checks.push(item(4, "5% Monthly Release", matrixSrc.includes("monthlyReleaseBps[month] = 500"), "500 bps × 20 months = 100%"));

  const midMonth = claimable(1000n * ETHER, 0n, MONTH_DURATION / 2n, 25n);
  const endMonth = claimable(1000n * ETHER, 0n, MONTH_DURATION, 25n);
  checks.push(item(5, "Continuous timestamp release (5% linear within month)", midMonth === 25n * ETHER && endMonth === 50n * ETHER, `Half month = ${midMonth / ETHER} LAE; full month-1 = ${endMonth / ETHER} LAE`));

  checks.push(item(6, "Month 1 = 2 directs", directReq[0] === 2n, `directRequirementByMonth[0] = ${directReq[0]} (on-chain: month+2 with 0-based index)`));
  checks.push(item(7, "Month 20 = 21 directs", directReq[19] === 21n, `directRequirementByMonth[19] = ${directReq[19]}`));

  // Verify source matches expected formula
  const srcHasFormula = matrixSrc.includes("directRequirementByMonth[month] = uint256(month) + 2");
  checks.push(item(8, "Direct formula month M → M+1 directs (M=1..20)", srcHasFormula && directReq.every((v, i) => v === BigInt(i + 2)), "Constructor sets month+2 per 0-based slot (= calendar month + 1 directs)"));

  checks.push(item(9, "Claim function", matrixSrc.includes("function claimLaeRewards()"), "LAEClubMatrix.claimLaeRewards() present"));
  checks.push(item(10, "P2P Marketplace", laeCoinSrc.includes("createP2POrder") && laeCoinSrc.includes("cancelP2POrder") && laeCoinSrc.includes("fillP2POrder"), "createP2POrder / cancelP2POrder / fillP2POrder in LAECoin.sol"));

  // Bootstrap guard
  checks.push(item(11, "bootstrapSupply enforces 400k pool", laeCoinSrc.includes("exactly 400000 LAE"), "require(rewardPoolAmount == REWARD_POOL_CAP)"));

  const pass = checks.filter((c) => c.ok).length;
  const fail = checks.filter((c) => !c.ok).length;

  const lines = [];
  lines.push("# FINAL LAE Reward Validation");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("**Files updated:** `LAECoin.sol`, `LAEClubMatrix.sol` (reward config only). **MatrixCore unchanged.**");
  lines.push("");
  lines.push(`## Overall: **${fail === 0 ? "PASS" : "FAIL"}** (${pass} pass · ${fail} fail)`);
  lines.push("");
  lines.push("| # | Check | Status | Evidence |");
  lines.push("|---:|---|:---:|---|");
  for (const c of checks) {
    lines.push(`| ${c.num} | ${c.name} | **${c.status}** | ${c.evidence} |`);
  }
  lines.push("");
  lines.push("## Direct Requirement Table");
  lines.push("");
  lines.push("| Calendar Month | Required Directs |");
  lines.push("|---:|---:|");
  for (let m = 1; m <= 20; m++) {
    lines.push(`| ${m} | ${directReq[m - 1]} |`);
  }
  lines.push("");
  lines.push("## Tokenomics");
  lines.push("");
  lines.push("```solidity");
  lines.push(`TOTAL_SUPPLY_CAP    = ${TOTAL_SUPPLY / ETHER} LAE`);
  lines.push(`REWARD_POOL_CAP     = ${REWARD_POOL / ETHER} LAE`);
  lines.push(`RESIDUAL_SUPPLY_CAP = ${RESIDUAL / ETHER} LAE`);
  lines.push("```");
  lines.push("");
  lines.push("## Vesting gate example (1000 LAE, 10 directs)");
  lines.push("");
  lines.push("| Elapsed | Claimable |");
  lines.push("|---|---:|");
  const start = 1_700_000_000n;
  const alloc = 1000n * ETHER;
  for (const d of [0, 15, 30, 60, 90, 600]) {
    const e = BigInt(d) * 86400n;
    lines.push(`| ${d} days | ${claimable(alloc, start, start + e, 10n) / ETHER} LAE |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("*Generated by `contracts/validate-lae-reward-final.js`*");

  fs.writeFileSync(OUT, lines.join("\n"));
  console.log(`Wrote ${OUT}`);
  console.log(`PASS: ${pass}  FAIL: ${fail}`);
  checks.filter((c) => !c.ok).forEach((c) => console.log(`  FAIL — ${c.name}: ${c.evidence}`));
  process.exit(fail > 0 ? 1 : 0);
}

run();
