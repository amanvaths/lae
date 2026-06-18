#!/usr/bin/env node
/**
 * Stable dev server startup:
 * 1. Stop any process on port 3000 (prevents duplicate next dev instances)
 * 2. Clear stale .next chunks (fixes missing ./5611.js webpack errors)
 * 3. Start next dev
 */
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function killPort3000() {
  try {
    execSync("lsof -ti:3000 | xargs kill -9 2>/dev/null", { stdio: "ignore" });
  } catch {
    /* nothing listening */
  }
}

function cleanNext() {
  for (const dir of [".next", path.join("node_modules", ".cache")]) {
    const target = path.join(root, dir);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
  console.log("[dev] cleaned .next cache — fresh compile");
}

killPort3000();
cleanNext();

const child = spawn("npx", ["next", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
