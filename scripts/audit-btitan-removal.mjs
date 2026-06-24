#!/usr/bin/env node
/**
 * BTitan removal audit — scans repo for legacy matrix references.
 * Run: node scripts/audit-btitan-removal.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const REPORT = join(ROOT, "FINAL_BTITAN_REMOVAL_AUDIT.md");

const PATTERNS = [
  { id: "BTitan", re: /BTitan|BTITAN/i },
  { id: "BTitanXMatrix", re: /BTitanXMatrix/i },
  { id: "usersXMatrixReferrals", re: /usersXMatrixReferrals/i },
  { id: "NewUserPlace", re: /NewUserPlace/i },
  { id: "old_matrix_address", re: /0xaDFA4602894c75B52a71728A55fCAeeEcc1D2c9a/i },
  { id: "old_deploy_block", re: /115055888/ },
  { id: "indexedLaeUser", re: /indexedLaeUser|IndexedLaeUser|indexedLaeIncome|indexedLaePlacement|LAE_MATRIX_EVENTS|laeClubMatrixAbi/i },
  { id: "laeClubMatrixAbi", re: /laeClubMatrixAbi/i },
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  ".turbo",
  "coverage",
]);

const SKIP_FILES = new Set([
  "FINAL_BTITAN_REMOVAL_AUDIT.md",
  "audit-btitan-removal.mjs",
]);

const ALLOWLIST = [
  /contracts\/LAEClubMatrix\.sol$/,
  /contracts\/matrix\/cross-layer-verify\.js$/,
  /backend\/prisma\/migrations\//,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

function isTextFile(p) {
  return /\.(ts|tsx|js|mjs|cjs|json|md|sol|sql|env|example|template|yaml|yml|txt|prisma)$/i.test(p);
}

const files = walk(ROOT).filter(isTextFile);
const hits = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  if (SKIP_FILES.has(rel.split("/").pop())) continue;
  if (ALLOWLIST.some((rx) => rx.test(rel))) continue;

  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const pat of PATTERNS) {
    if (pat.re.test(text)) {
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (pat.re.test(line)) {
          hits.push({ file: rel, line: i + 1, pattern: pat.id, snippet: line.trim().slice(0, 120) });
        }
      });
    }
  }
}

function checkIntegration() {
  const checks = [];

  const chains = readFileSync(join(ROOT, "backend/src/config/chains.ts"), "utf8");
  checks.push({
    name: "Backend chains.ts uses matrixCore",
    pass: chains.includes("matrixCore") && !chains.includes("0xaDFA4602894c75B52a71728A55fCAeeEcc1D2c9a"),
  });

  const abis = readFileSync(join(ROOT, "backend/src/modules/blockchain/abis.ts"), "utf8");
  checks.push({
    name: "Backend abis exports MATRIX_CORE_EVENTS",
    pass: abis.includes("MATRIX_CORE_EVENTS") && !abis.includes("NewUserPlace"),
  });

  const treeSvc = readFileSync(join(ROOT, "backend/src/modules/blockchain/matrix-tree.service.ts"), "utf8");
  checks.push({
    name: "matrix-tree.service uses getCyclePositions",
    pass: treeSvc.includes("getCyclePositions") && !treeSvc.includes("usersXMatrixReferrals"),
  });

  const routes = readFileSync(join(ROOT, "backend/src/modules/analytics/analytics.routes.ts"), "utf8");
  checks.push({
    name: "API /matrix/tree/:cycle",
    pass: routes.includes("/matrix/tree/:userId/:cycle") && !routes.includes("/matrix/tree/:userId/:level"),
  });

  const schema = readFileSync(join(ROOT, "backend/prisma/schema.prisma"), "utf8");
  checks.push({
    name: "Prisma MatrixCore tables",
    pass: schema.includes("MatrixCoreUser") && !schema.includes("IndexedLaeUser"),
  });

  const matrixPage = readFileSync(join(ROOT, "app/dashboard/matrix/page.tsx"), "utf8");
  checks.push({
    name: "Frontend matrix page API-only",
    pass:
      matrixPage.includes("useMatrixCoreTreeApi") &&
      !matrixPage.includes("usersXMatrixReferrals") &&
      !matrixPage.includes("laeClubMatrixAbi"),
  });

  const hooks = readFileSync(join(ROOT, "lib/lae-club/hooks.ts"), "utf8");
  checks.push({
    name: "Frontend hooks use matrixCoreAbi",
    pass: hooks.includes("matrixCoreAbi") && !hooks.includes("laeClubMatrixAbi"),
  });

  const contracts = readFileSync(join(ROOT, "lib/lae-club/contracts.ts"), "utf8");
  checks.push({
    name: "Frontend contract config — no old address",
    pass: !contracts.includes("0xaDFA4602894c75B52a71728A55fCAeeEcc1D2c9a"),
  });

  return checks;
}

const integration = checkIntegration();
const btitanRefsFound = hits.length;
const oldAddressHits = hits.filter((h) => h.pattern === "old_matrix_address");
const ready =
  btitanRefsFound === 0 && integration.every((c) => c.pass) && oldAddressHits.length === 0;

const lines = [
  "# Final BTitan Removal Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `| Metric | Value |`,
  `|--------|-------|`,
  `| BTitan References Found | **${btitanRefsFound}** |`,
  `| BTitan References Removed | N/A (audit pass = 0 remaining) |`,
  `| Old Addresses Remaining | **${oldAddressHits.length}** |`,
  `| MatrixCore Integration | **${integration.every((c) => c.pass) ? "PASS" : "FAIL"}** |`,
  `| Frontend | **${integration.filter((c) => c.name.includes("Frontend")).every((c) => c.pass) ? "PASS" : "FAIL"}** |`,
  `| Backend | **${integration.filter((c) => c.name.startsWith("Backend") || c.name.includes("API") || c.name.includes("matrix-tree") || c.name.includes("Prisma")).every((c) => c.pass) ? "PASS" : "FAIL"}** |`,
  `| Indexer | **${integration.filter((c) => c.name.includes("abis") || c.name.includes("chains")).every((c) => c.pass) ? "PASS" : "FAIL"}** |`,
  `| Ready For Production | **${ready ? "YES" : "NO"}** |`,
  "",
  "## Integration Checks",
  "",
  ...integration.map((c) => `- [${c.pass ? "x" : " "}] ${c.name}`),
  "",
];

if (hits.length) {
  lines.push("## Remaining References", "");
  for (const h of hits) {
    lines.push(`- \`${h.file}:${h.line}\` (${h.pattern}) — ${h.snippet}`);
  }
  lines.push("");
} else {
  lines.push("## Remaining References", "", "_None — zero BTitan references in scanned files._", "");
}

writeFileSync(REPORT, lines.join("\n"));
console.log(lines.join("\n"));
process.exit(ready ? 0 : 1);
