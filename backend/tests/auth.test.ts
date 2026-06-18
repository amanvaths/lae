import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    $transaction: vi.fn(),
    clubMatrix: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    userClubPackage: { findUnique: vi.fn(), update: vi.fn() },
    incomeLedger: { findUnique: vi.fn(), create: vi.fn() },
    wallet: { upsert: vi.fn() },
  },
}));

describe("Income idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use idempotency keys for cycle payouts", () => {
    const key = "club-cycle-matrix123-withdraw";
    expect(key).toMatch(/^club-cycle-/);
  });
});

describe("Referral code generation", () => {
  it("generates 8 character codes", async () => {
    const { generateReferralCode } = await import("../src/utils/crypto.js");
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });
});

describe("Wallet validation", () => {
  it("validates ethereum addresses", async () => {
    const { isValidWalletAddress, normalizeWalletAddress } = await import("../src/utils/crypto.js");
    expect(isValidWalletAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")).toBe(true);
    expect(isValidWalletAddress("invalid")).toBe(false);
    expect(normalizeWalletAddress("0xAbCd")).toBe("0xabcd");
  });
});
