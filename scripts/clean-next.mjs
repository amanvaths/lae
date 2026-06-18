#!/usr/bin/env node
/**
 * Remove Next.js build cache.
 * Fixes recurring "Cannot find module './NNNN.js'" when dev + build share stale chunks.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const dir of [".next", path.join("node_modules", ".cache")]) {
  const target = path.join(root, dir);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[clean] removed ${dir}`);
  }
}
