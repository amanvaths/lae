import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { FastifyInstance } from "fastify";

vi.mock("../src/modules/blockchain/sync-engine.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/modules/blockchain/sync-engine.js")>();
  return {
    ...actual,
    replayFromBlock: vi.fn().mockResolvedValue(undefined),
  };
});

import { buildApp } from "../src/app.js";

function hasRoute(app: FastifyInstance, method: string, url: string): boolean {
  return app.hasRoute({ method: method as "GET" | "POST", url });
}

describe("Analytics API — route registry", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health responds", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { status: string; mode: string };
    expect(body.status).toBe("ok");
    expect(body.mode).toBe("indexer-only");
  });

  const analyticsRoutes: Array<{ method: "GET" | "POST"; path: string }> = [
    { method: "GET", path: "/api/dashboard" },
    { method: "GET", path: "/api/wallet" },
    { method: "GET", path: "/api/referrals" },
    { method: "GET", path: "/api/team" },
    { method: "GET", path: "/api/matrices" },
    { method: "GET", path: "/api/income" },
    { method: "GET", path: "/api/rewards" },
    { method: "GET", path: "/api/transactions" },
    { method: "GET", path: "/api/spins" },
    { method: "GET", path: "/api/stakes" },
    { method: "GET", path: "/api/leaderboard" },
    { method: "GET", path: "/api/indexer/status" },
    { method: "POST", path: "/api/indexer/replay" },
  ];

  it.each(analyticsRoutes)("$method $path is registered", ({ method, path }) => {
    expect(hasRoute(app, method, path)).toBe(true);
  });

  it("GET /api/dashboard requires wallet query", async () => {
    const response = await app.inject({ method: "GET", url: "/api/dashboard" });
    expect(response.statusCode).toBe(400);
  });
});

describe("Indexer replay — admin authentication", () => {
  let app: FastifyInstance;
  const originalApiKey = process.env.INDEXER_ADMIN_API_KEY;

  beforeAll(async () => {
    process.env.INDEXER_ADMIN_API_KEY = "test-indexer-admin-key";
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    if (originalApiKey === undefined) {
      delete process.env.INDEXER_ADMIN_API_KEY;
    } else {
      process.env.INDEXER_ADMIN_API_KEY = originalApiKey;
    }
  });

  it("POST /api/indexer/replay returns 403 without credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/indexer/replay",
      payload: { fromBlock: "0" },
    });
    expect(response.statusCode).toBe(403);
  });

  it("POST /api/indexer/replay returns 403 with invalid API key", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/indexer/replay",
      headers: { "x-api-key": "wrong-key" },
      payload: { fromBlock: "0" },
    });
    expect(response.statusCode).toBe(403);
  });

  it("POST /api/indexer/replay accepts valid X-API-Key", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/indexer/replay",
      headers: { "x-api-key": "test-indexer-admin-key" },
      payload: { fromBlock: "0" },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});

describe("Legacy MLM routes removed", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const removedRoutes: Array<{ method: "GET" | "POST"; path: string }> = [
    { method: "POST", path: "/api/auth/register" },
    { method: "POST", path: "/api/auth/login" },
    { method: "POST", path: "/api/transactions/purchase" },
    { method: "GET", path: "/api/cache/dashboard" },
    { method: "GET", path: "/api/cache/leaderboard" },
  ];

  it.each(removedRoutes)("$method $path is not registered", ({ method, path }) => {
    expect(hasRoute(app, method, path)).toBe(false);
  });
});
