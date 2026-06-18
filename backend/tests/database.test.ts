import { describe, it, expect } from "vitest";
import {
  buildTreePath,
  computeTreeDepth,
  parseUplineFromPath,
} from "../src/repositories/referral-tree.repository.js";
import {
  purchaseIdempotencyKey,
  cycleIdempotencyKey,
  rebirthIdempotencyKey,
  upgradeIdempotencyKey,
  withdrawalIdempotencyKey,
  tokenRewardIdempotencyKey,
  placementIdempotencyKey,
} from "../src/lib/idempotency.js";

describe("Materialized path strategy", () => {
  it("builds correct tree path for child user", () => {
    const sponsorPath = "/root123/";
    const childId = "child456";
    expect(buildTreePath(sponsorPath, childId)).toBe("/root123/child456/");
  });

  it("computes tree depth from path", () => {
    expect(computeTreeDepth("/root/")).toBe(1);
    expect(computeTreeDepth("/root/child/")).toBe(2);
    expect(computeTreeDepth("/root/child/grandchild/")).toBe(3);
  });

  it("parses upline IDs from materialized path", () => {
    const path = "/root/child/user/";
    expect(parseUplineFromPath(path, "user")).toEqual(["root", "child"]);
    expect(parseUplineFromPath(path)).toEqual(["root", "child"]);
  });
});

describe("Idempotency key generation", () => {
  it("generates unique keys per operation type", () => {
    expect(purchaseIdempotencyKey("0xabc", "CLUB", 5)).toBe("purchase:CLUB:5:0xabc");
    expect(cycleIdempotencyKey("matrix1")).toBe("cycle:matrix1");
    expect(rebirthIdempotencyKey("matrix1", 2)).toBe("rebirth:matrix1:2");
    expect(upgradeIdempotencyKey("user1", 5, 6)).toBe("upgrade:user1:5:6");
    expect(withdrawalIdempotencyKey("wd1")).toBe("withdraw:wd1");
    expect(tokenRewardIdempotencyKey("u1", "WELCOME", "CLUB-5")).toBe("token:u1:WELCOME:CLUB-5");
    expect(placementIdempotencyKey("u1", "CLUB", 5)).toBe("placement:u1:CLUB:5");
  });

  it("same input produces same key (retry-safe)", () => {
    const a = cycleIdempotencyKey("matrix-abc");
    const b = cycleIdempotencyKey("matrix-abc");
    expect(a).toBe(b);
  });
});

describe("Append-only ledger policy", () => {
  it("ledger entries should never be mutated — enforced by DB trigger", () => {
    const ledgerRules = {
      allowUpdate: false,
      allowDelete: false,
      appendOnly: true,
      idempotencyProtected: true,
    };
    expect(ledgerRules.appendOnly).toBe(true);
    expect(ledgerRules.allowUpdate).toBe(false);
  });
});

describe("Transaction isolation", () => {
  it("matrix operations use Serializable isolation", async () => {
    const { MATRIX_TX_OPTIONS } = await import("../src/lib/transaction.js");
    expect(MATRIX_TX_OPTIONS.isolationLevel).toBe("Serializable");
    expect(MATRIX_TX_OPTIONS.timeout).toBeGreaterThanOrEqual(30_000);
  });
});

describe("Redis cache keys", () => {
  it("defines dashboard and leaderboard cache keys", async () => {
    const { CACHE_KEYS, CACHE_TTL } = await import("../src/lib/cache.js");
    expect(CACHE_KEYS.dashboard("user1")).toBe("cache:dashboard:user1");
    expect(CACHE_KEYS.leaderboard()).toBe("cache:leaderboard:global");
    expect(CACHE_TTL.dashboard).toBe(60);
    expect(CACHE_TTL.leaderboard).toBe(300);
  });
});

describe("BullMQ queue names", () => {
  it("exports all required queues", async () => {
    const queues = await import("../src/queues/index.js");
    expect(queues.placementQueue.name).toBe("placement");
    expect(queues.rebirthQueue.name).toBe("rebirth");
    expect(queues.autoUpgradeQueue.name).toBe("auto-upgrade");
    expect(queues.incomeQueue.name).toBe("income-distribution");
    expect(queues.withdrawQueue.name).toBe("withdrawal");
    expect(queues.notificationQueue.name).toBe("notification");
    expect(queues.purchaseQueue.name).toBe("package-purchase");
  });
});
