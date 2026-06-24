#!/usr/bin/env node
/**
 * MatrixCore cross-layer verification (100 users).
 *
 * Layers:
 *   1. Contract  — simulate.js (faithful MatrixCore logic)
 *   2. Database  — in-memory projection per contracts/matrix/db/schema.sql
 *   3. API       — MatrixCore tree DTO (intended GET /users/:id/matrix?cycle=)
 *   4. Frontend  — buildSlotsFromApi() ported from lib/lae-club/matrix-slots.ts
 *
 * Also audits production backend MatrixCore wiring.
 *
 * Run: node contracts/matrix/cross-layer-verify.js
 */
const fs = require("fs");
const path = require("path");
const { Matrix, MATRIX_SIZE } = require("./simulate.js");

const OUT = path.join(__dirname, "MATRIX_CORE_CROSS_LAYER_REPORT.md");
const NUM_USERS = 100;
const ZERO = "0x0000000000000000000000000000000000000000";

// ─── Frontend: buildSlotsFromApi (mirror lib/lae-club/matrix-slots.ts) ─────
function buildSlotsFromApi(apiSlots) {
  const byPosition = new Map(apiSlots.map((s) => [s.position, s]));
  const slots = [];
  for (let i = 1; i <= MATRIX_SIZE; i++) {
    const api = byPosition.get(i);
    slots.push({
      spot: i,
      state: api?.state ?? "waiting",
      userId: api?.userId ?? null,
      address: api?.address ?? null,
    });
  }
  return slots;
}

// ─── In-memory DB (schema.sql projection) ───────────────────────────────────
class MatrixDb {
  constructor() {
    this.users = new Map(); // id -> { wallet, sponsorId, currentCycle }
    this.cycles = new Map(); // "ownerId:cycleId" -> { filled, completed, positions[1..14] }
    this.positions = []; // matrix_positions rows
    this.occupantIndex = new Map(); // occupantId -> row
  }

  onUserRegistered(id, wallet, sponsorId) {
    this.users.set(id, { id, wallet, sponsorId, currentCycle: 1 });
  }

  onPositionFilled(matrixOwnerId, cycleId, position, occupantId, txIdx) {
    const key = `${matrixOwnerId}:${cycleId}`;
    if (!this.cycles.has(key)) {
      this.cycles.set(key, { filled: 0, completed: false, positions: {} });
    }
    const cyc = this.cycles.get(key);
    if (cyc.positions[position]) {
      throw new Error(`DB duplicate: ${key} pos ${position}`);
    }
    cyc.positions[position] = occupantId;
    cyc.filled = position;
    if (position === MATRIX_SIZE) cyc.completed = true;

    const row = {
      matrixOwnerId,
      cycleId,
      position,
      occupantId,
      txIdx,
    };
    this.positions.push(row);
    if (this.occupantIndex.has(occupantId)) {
      throw new Error(`DB duplicate occupant ${occupantId}`);
    }
    this.occupantIndex.set(occupantId, row);
  }

  onCycleCompleted(userId, cycleId) {
    const key = `${userId}:${cycleId}`;
    const cyc = this.cycles.get(key);
    if (cyc) cyc.completed = true;
    const u = this.users.get(userId);
    if (u) u.currentCycle = cycleId + 1;
  }

  getOccupantPlacement(occupantId) {
    return this.occupantIndex.get(occupantId) ?? null;
  }

  getCyclePositions(matrixOwnerId, cycleId) {
    const key = `${matrixOwnerId}:${cycleId}`;
    const cyc = this.cycles.get(key) ?? { filled: 0, completed: false, positions: {} };
    const positions = [];
    for (let p = 1; p <= MATRIX_SIZE; p++) positions.push(cyc.positions[p] ?? 0);
    return { positions, filled: cyc.filled, completed: cyc.completed };
  }
}

// ─── API layer (MatrixCore tree DTO) ────────────────────────────────────────
function getMatrixTreeApi(db, userId, cycleId, walletOf) {
  const u = db.users.get(userId);
  if (!u) return { error: "user not found" };
  const { positions, filled, completed } = db.getCyclePositions(userId, cycleId);
  const active = true; // MatrixCore: slot 1 active from registration
  const nextOpen = filled + 1;
  const slots = [];

  for (let p = 1; p <= MATRIX_SIZE; p++) {
    const occ = positions[p - 1];
    if (!active) {
      slots.push({ position: p, state: "locked", userId: null, address: null });
    } else if (occ) {
      slots.push({
        position: p,
        state: "filled",
        userId: occ,
        address: walletOf(occ),
      });
    } else {
      slots.push({
        position: p,
        state: p === nextOpen && !completed ? "open" : "waiting",
        userId: null,
        address: null,
      });
    }
  }

  return {
    userId,
    address: u.wallet,
    cycle: cycleId,
    active,
    filledSpots: filled,
    completed,
    slots,
  };
}

// ─── Index simulation events into DB ────────────────────────────────────────
function indexSimulation(m) {
  const db = new MatrixDb();
  db.onUserRegistered(1, "0xowner", 0);

  let txIdx = 0;
  for (const p of m.placements) {
    txIdx += 1;
    if (!db.users.has(p.entrantId)) {
      const wallet = m.users.get(p.entrantId)?.wallet ?? `0xuser${p.entrantId}`;
      const sponsorId = m.users.get(p.entrantId)?.sponsorId ?? 0;
      db.onUserRegistered(p.entrantId, wallet, sponsorId);
    }
    db.onPositionFilled(p.M, p.c, p.position, p.entrantId, txIdx);
    if (p.position === MATRIX_SIZE) db.onCycleCompleted(p.M, p.c);
  }
  return db;
}

function contractGetCyclePositions(m, ownerId, cycleId) {
  const u = m.users.get(ownerId);
  const cyc = u?.cycles.get(cycleId);
  if (!cyc) return { positions: Array(14).fill(0), filled: 0, completed: false };
  const positions = [];
  for (let p = 1; p <= MATRIX_SIZE; p++) positions.push(cyc.positions[p] ?? 0);
  return { positions, filled: cyc.filled, completed: cyc.completed };
}

function walletOf(m, id) {
  return m.users.get(id)?.wallet ?? `0xuser${id}`;
}

function runLinearSim(n) {
  const m = new Matrix();
  m.initRoot("0xowner");
  let prev = m.ownerId;
  for (let i = 0; i < n; i++) {
    m.register(`0xuser${i + 1}`, prev);
    prev = m.lastUserId;
  }
  return m;
}

function auditProductionWiring() {
  const root = path.join(__dirname, "../..");
  const syncEngine = fs.readFileSync(
    path.join(root, "backend/src/modules/blockchain/sync-engine.ts"),
    "utf8"
  );
  const abis = fs.readFileSync(
    path.join(root, "backend/src/modules/blockchain/abis.ts"),
    "utf8"
  );
  const matrixTree = fs.readFileSync(
    path.join(root, "backend/src/modules/blockchain/matrix-tree.service.ts"),
    "utf8"
  );

  const usesMatrixCore =
    syncEngine.includes("MatrixCore") || abis.includes("PositionFilled");
  const usesLegacyMatrix =
    abis.includes("NewUserPlace") && matrixTree.includes("usersXMatrixReferrals");

  return {
    productionUsesMatrixCore: usesMatrixCore,
    productionUsesLegacyMatrix: usesLegacyMatrix,
    usesGetCyclePositions: matrixTree.includes("getCyclePositions"),
    usesCycleApiRoute: fs
      .readFileSync(path.join(root, "backend/src/modules/analytics/analytics.routes.ts"), "utf8")
      .includes("/matrix/tree/:userId/:cycle"),
    wired: usesMatrixCore && !usesLegacyMatrix,
    rootCause: usesMatrixCore
      ? null
      : "Production backend must index MatrixCore (PositionFilled + getCyclePositions). Legacy referral matrix is not supported.",
  };
}

function verifyCrossLayer(m, db) {
  const entrantResults = [];
  const treeResults = [];
  let firstMismatch = null;

  // ── Per entrant (users 2..101): single placement consistency ──
  for (let userId = 2; userId <= NUM_USERS + 1; userId++) {
    const contractP = m.placements.find((x) => x.entrantId === userId);
    if (!contractP) {
      entrantResults.push({ userId, ok: false, reason: "no contract placement" });
      continue;
    }

    const contractPos = {
      matrixOwnerId: contractP.M,
      cycleId: contractP.c,
      position: contractP.position,
    };

    const dbRow = db.getOccupantPlacement(userId);
    const dbPos = dbRow
      ? { matrixOwnerId: dbRow.matrixOwnerId, cycleId: dbRow.cycleId, position: dbRow.position }
      : null;

    const apiTree = getMatrixTreeApi(db, contractPos.matrixOwnerId, contractPos.cycleId, (id) =>
      walletOf(m, id)
    );
    const apiSlot = apiTree.slots?.find((s) => s.position === contractPos.position);
    const apiPos = apiSlot?.userId
      ? {
          matrixOwnerId: contractPos.matrixOwnerId,
          cycleId: contractPos.cycleId,
          position: contractPos.position,
          occupantId: apiSlot.userId,
        }
      : null;

    const feSlots = buildSlotsFromApi(apiTree.slots ?? []);
    const feSlot = feSlots.find((s) => s.spot === contractPos.position);
    const fePos =
      feSlot?.userId === userId
        ? {
            matrixOwnerId: contractPos.matrixOwnerId,
            cycleId: contractPos.cycleId,
            position: contractPos.position,
            occupantId: feSlot.userId,
          }
        : null;

    const contractOk = !!contractP;
    const dbOk =
      dbPos &&
      dbPos.matrixOwnerId === contractPos.matrixOwnerId &&
      dbPos.cycleId === contractPos.cycleId &&
      dbPos.position === contractPos.position;
    const apiOk = apiPos && apiPos.occupantId === userId;
    const feOk = !!fePos;

    const ok = contractOk && dbOk && apiOk && feOk;
    if (!ok && !firstMismatch) {
      firstMismatch = {
        userId,
        slot: contractPos.position,
        contract: contractPos,
        db: dbPos,
        api: apiPos,
        frontend: feSlot ? { spot: feSlot.spot, userId: feSlot.userId, state: feSlot.state } : null,
        reason: !dbOk
          ? "DB projection mismatch"
          : !apiOk
            ? "API tree slot mismatch"
            : !feOk
              ? "Frontend slot builder mismatch"
              : "unknown",
      };
    }

    entrantResults.push({ userId, ok, contractOk, dbOk, apiOk, feOk, contractPos, dbPos });
  }

  // ── Per matrix tree: all 14 slots contract ↔ DB ↔ API ↔ FE ──
  const seen = new Set();
  for (const p of m.placements) {
    const key = `${p.M}:${p.c}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const contract = contractGetCyclePositions(m, p.M, p.c);
    const dbCycle = db.getCyclePositions(p.M, p.c);
    const api = getMatrixTreeApi(db, p.M, p.c, (id) => walletOf(m, id));
    const fe = buildSlotsFromApi(api.slots ?? []);

    for (let pos = 1; pos <= contract.filled; pos++) {
      const cOcc = contract.positions[pos - 1];
      const dOcc = dbCycle.positions[pos - 1] ?? 0;
      const aSlot = api.slots.find((s) => s.position === pos);
      const fSlot = fe.find((s) => s.spot === pos);

      const ok =
        cOcc === dOcc &&
        (aSlot?.userId ?? 0) === cOcc &&
        (fSlot?.userId ?? 0) === cOcc &&
        aSlot?.state === "filled" &&
        fSlot?.state === "filled";

      treeResults.push({ matrixOwnerId: p.M, cycleId: p.c, position: pos, ok, cOcc, dOcc, api: aSlot?.userId, fe: fSlot?.userId });
      if (!ok && !firstMismatch) {
        firstMismatch = {
          userId: cOcc,
          slot: pos,
          matrixOwnerId: p.M,
          cycleId: p.c,
          contract: cOcc,
          db: dOcc,
          api: aSlot?.userId,
          frontend: fSlot?.userId,
          reason: "Tree slot mismatch across layers",
        };
      }
    }
  }

  const contractPass = entrantResults.every((r) => r.contractOk) && m.placements.length === NUM_USERS;
  const dbPass = entrantResults.every((r) => r.dbOk) && treeResults.every((r) => r.ok);
  const apiPass = entrantResults.every((r) => r.apiOk) && treeResults.every((r) => r.ok);
  const fePass = entrantResults.every((r) => r.feOk) && treeResults.every((r) => r.ok);

  return {
    entrantResults,
    treeResults,
    contractPass,
    dbPass,
    apiPass,
    fePass,
    firstMismatch,
    allPass: contractPass && dbPass && apiPass && fePass,
  };
}

function generateReport(result, prodAudit, m) {
  const lines = [];
  lines.push("# MatrixCore Cross-Layer Verification Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Test users: ${NUM_USERS} (linear sponsor chain, users 2–${NUM_USERS + 1})`);
  lines.push("");

  lines.push("## Deployment Approval");
  lines.push("");
  const prodOk = prodAudit.wired;
  const simOk = result.allPass;
  if (prodOk && simOk) {
    lines.push("**✅ APPROVED** — All layers aligned.");
  } else {
    lines.push("**❌ NOT APPROVED FOR DEPLOYMENT** — Mismatch or missing integration detected.");
  }
  lines.push("");

  lines.push("## Layer Results");
  lines.push("");
  lines.push("| Layer | Status | Detail |");
  lines.push("|---|---|---|");
  lines.push(`| Contract | **${result.contractPass ? "PASS" : "FAIL"}** | ${NUM_USERS} placements, ${m.placements.length} recorded |`);
  lines.push(`| Database | **${result.dbPass ? "PASS" : "FAIL"}** | In-memory projection per schema.sql (${result.entrantResults.filter((r) => r.dbOk).length}/${NUM_USERS} entrants) |`);
  lines.push(`| API | **${result.apiPass ? "PASS" : "FAIL"}** | MatrixCore tree DTO (${result.entrantResults.filter((r) => r.apiOk).length}/${NUM_USERS} entrants) |`);
  lines.push(`| Frontend | **${result.fePass ? "PASS" : "FAIL"}** | buildSlotsFromApi (${result.entrantResults.filter((r) => r.feOk).length}/${NUM_USERS} entrants) |`);
  lines.push(`| Production stack | **${prodOk ? "PASS" : "FAIL"}** | Live backend/API wired to MatrixCore |`);
  lines.push("");

  if (result.firstMismatch) {
    lines.push("## First Mismatch");
    lines.push("");
    lines.push("| Field | Value |");
    lines.push("|---|---|");
    lines.push(`| First incorrect user | User ${result.firstMismatch.userId} |`);
    lines.push(`| First incorrect slot | Position ${result.firstMismatch.slot ?? result.firstMismatch.position ?? "?"} |`);
    if (result.firstMismatch.matrixOwnerId) {
      lines.push(`| Matrix owner | User ${result.firstMismatch.matrixOwnerId} cycle ${result.firstMismatch.cycleId} |`);
    }
    lines.push(`| Root cause | ${result.firstMismatch.reason} |`);
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(result.firstMismatch, null, 2));
    lines.push("```");
    lines.push("");
  } else if (!prodOk) {
    lines.push("## First Mismatch (Production Stack)");
    lines.push("");
    lines.push("| Field | Value |");
    lines.push("|---|---|");
    lines.push("| First incorrect user | N/A (integration not wired) |");
    lines.push("| First incorrect slot | N/A |");
    lines.push(`| Root cause | ${prodAudit.rootCause} |`);
    lines.push("");
  }

  lines.push("## Production Backend Audit");
  lines.push("");
  lines.push(`- MatrixCore events indexed: ${prodAudit.productionUsesMatrixCore ? "Yes" : "**No**"}`);
  lines.push(`- Legacy referral matrix wired: ${prodAudit.productionUsesLegacyMatrix ? "**Yes**" : "No"}`);
  lines.push(`- \`contracts/matrix/db/schema.sql\` in Prisma: **No** (standalone design doc)`);
  lines.push(`- API route \`/api/matrix/tree/:userId/:cycle\` uses \`getCyclePositions\`: ${prodAudit.usesGetCyclePositions && prodAudit.usesCycleApiRoute ? "**Yes**" : "No"}`);
  lines.push("");

  lines.push("## Per-User Placement Sample (first 20 entrants)");
  lines.push("");
  lines.push("| User | Contract (M.c.pos) | DB | API occupant | FE userId | OK |");
  lines.push("|---:|---|---:|---:|---:|:---:|");
  for (const r of result.entrantResults.slice(0, 20)) {
    const c = r.contractPos;
    const cp = c ? `${c.matrixOwnerId}.${c.cycleId}.${c.position}` : "—";
    const dbp = r.dbPos ? `${r.dbPos.matrixOwnerId}.${r.dbPos.cycleId}.${r.dbPos.position}` : "—";
    lines.push(`| ${r.userId} | ${cp} | ${dbp} | ${r.apiOk ? r.userId : "—"} | ${r.feOk ? r.userId : "—"} | ${r.ok ? "✅" : "❌"} |`);
  }
  lines.push("");

  lines.push("## Tree Slot Checks");
  lines.push("");
  const treeFails = result.treeResults.filter((t) => !t.ok);
  lines.push(`- Total filled slots verified: ${result.treeResults.length}`);
  lines.push(`- Mismatches: ${treeFails.length}`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push("### Simulated integration path (Contract → DB → API → Frontend)");
  lines.push("");
  if (simOk) {
    lines.push("When MatrixCore events are indexed per `BACKEND_EVENT_FLOW.md`, all 100 users align across DB, API, and frontend slot rendering.");
  } else {
    lines.push("Mismatch detected in simulated integration — see First Mismatch above.");
  }
  lines.push("");
  lines.push("### Production deployment path");
  lines.push("");
  if (!prodOk) {
    lines.push("**FAIL** — Cannot deploy MatrixCore until backend indexer, Prisma schema, API routes, and frontend contract config are updated for MatrixCore.");
  }
  lines.push("");
  lines.push("---");
  lines.push("*Generated by `contracts/matrix/cross-layer-verify.js`*");

  return lines.join("\n");
}

function main() {
  console.log(`Simulating ${NUM_USERS} users…`);
  const m = runLinearSim(NUM_USERS);
  const db = indexSimulation(m);
  const result = verifyCrossLayer(m, db);
  const prodAudit = auditProductionWiring();

  const report = generateReport(result, prodAudit, m);
  fs.writeFileSync(OUT, report);

  console.log(`\nWrote ${OUT}\n`);
  console.log("Contract:   ", result.contractPass ? "PASS" : "FAIL");
  console.log("Database:   ", result.dbPass ? "PASS" : "FAIL");
  console.log("API:        ", result.apiPass ? "PASS" : "FAIL");
  console.log("Frontend:   ", result.fePass ? "PASS" : "FAIL");
  console.log("Production: ", prodAudit.wired ? "PASS" : "FAIL");

  if (result.firstMismatch) {
    console.log("\nFirst mismatch:", JSON.stringify(result.firstMismatch, null, 2));
  }
  if (!prodAudit.wired) {
    console.log("\nProduction root cause:", prodAudit.rootCause);
  }

  const approved = result.allPass && prodAudit.wired;
  console.log(`\nDeployment approval: ${approved ? "APPROVED" : "NOT APPROVED"}`);
  process.exit(approved ? 0 : 1);
}

main();
