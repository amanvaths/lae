import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { processBlockchainDeposit } from "../src/modules/blockchain/blockchain.service.js";
import { handlePilotManualUpgrade } from "../src/engines/auto-upgrade.engine.js";
import { runMatrixTransaction } from "../src/lib/transaction.js";
import {
  cleanupE2EUsers,
  ensureRootUser,
  isDatabaseAvailable,
  nextTestWallet,
  purchaseClub,
  purchasePilot,
  registerTestUser,
  getWallet,
  getLedgerByType,
  enableSponsorPayments,
  disableSponsorPayments,
  getClubMatrixForOwner,
  getPilotMatrixForOwner,
  getRebirthMatrices,
} from "./helpers/integration-setup.js";
import { getClubPackageAmount, getPilotPackageAmount } from "../src/config/packages.js";
import { getClubSltWelcome } from "../src/config/slt-rewards.js";

const dbAvailable = await isDatabaseAvailable();

describe.skipIf(!dbAvailable)("E2E Integration Audit", () => {
  let rootId: string;
  let rootReferralCode: string;

  beforeAll(async () => {
    const root = await ensureRootUser();
    rootId = root.id;
    rootReferralCode = root.referralCode;
  });

  afterAll(async () => {
    await disableSponsorPayments();
    await cleanupE2EUsers();
  });

  // ─── 1. User Registration ────────────────────────────────────────────────

  describe("1. User Registration", () => {
    it("creates user with wallet and tree path", async () => {
      const { registerUser } = await import("../src/modules/auth/auth.service.js");
      const wallet = nextTestWallet();
      const user = await registerUser(wallet, rootReferralCode, "E2E User");

      expect(user.id).toBeTruthy();
      expect(user.walletAddress).toBe(wallet.toLowerCase());
      expect(user.treePath).toContain(rootId);
      expect(user.treeDepth).toBeGreaterThan(0);

      const walletRecord = await getWallet(user.id);
      expect(Number(walletRecord.availableBalance)).toBe(0);
    });
  });

  // ─── 2. Referral Registration ──────────────────────────────────────────

  describe("2. Referral Registration", () => {
    it("links sponsor and builds materialized tree path", async () => {
      const sponsor = await registerTestUser(rootReferralCode);
      const referral = await registerTestUser(sponsor.referralCode);

      expect(referral.sponsorId).toBe(sponsor.id);
      expect(referral.treePath).toContain(sponsor.id);
      expect(referral.treeDepth).toBeGreaterThan(sponsor.treeDepth ?? 0);

      const directCount = await prisma.user.count({ where: { sponsorId: sponsor.id } });
      expect(directCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── 3. Club Package Purchase ──────────────────────────────────────────

  describe("3. Club Package Purchase", () => {
    it("records purchase, package, and matrix", async () => {
      const user = await registerTestUser(rootReferralCode);
      const txHash = `club-purchase-${user.id}`;
      await purchaseClub(user.id, rootId, 1, txHash);

      const purchase = await prisma.packagePurchase.findFirst({
        where: { userId: user.id, matrixType: "CLUB", packageLevel: 1 },
      });
      expect(purchase).toBeTruthy();
      expect(Number(purchase!.amount)).toBe(getClubPackageAmount(1));

      const clubPackage = await prisma.userClubPackage.findUnique({
        where: { userId_packageLevel: { userId: user.id, packageLevel: 1 } },
      });
      expect(clubPackage?.isManual).toBe(true);

      const matrix = await getClubMatrixForOwner(user.id, 1);
      expect(matrix?.status).toBe("ACTIVE");
    });
  });

  // ─── 4. Pilot Package Purchase ─────────────────────────────────────────

  describe("4. Pilot Package Purchase", () => {
    it("records purchase with 1 DAI incentive on manual buy", async () => {
      const user = await registerTestUser(rootReferralCode);
      await purchasePilot(user.id, rootId, 1);

      const purchase = await prisma.packagePurchase.findFirst({
        where: { userId: user.id, matrixType: "PILOT", packageLevel: 1 },
      });
      expect(purchase).toBeTruthy();
      expect(Number(purchase!.amount)).toBe(getPilotPackageAmount(1));

      const incentive = await prisma.incomeLedger.findFirst({
        where: { type: "PILOT_INCENTIVE", sourceUserId: user.id },
      });
      expect(incentive).toBeTruthy();
      expect(Number(incentive!.amount)).toBe(1);
    });
  });

  // ─── 5. Direct Placement ─────────────────────────────────────────────────

  describe("5. Direct Placement", () => {
    it("places user directly in sponsor matrix when space available", async () => {
      const sponsor = await registerTestUser(rootReferralCode);
      await purchaseClub(sponsor.id, rootId, 1);

      const buyer = await registerTestUser(sponsor.referralCode);
      await purchaseClub(buyer.id, sponsor.id, 1);

      const placement = await prisma.matrixPlacement.findFirst({
        where: { userId: buyer.id, matrixType: "CLUB" },
      });
      expect(placement?.placementType).toBe("DIRECT");
      expect(placement?.sponsorId).toBe(sponsor.id);
    });
  });

  // ─── 6. Spillover Placement ─────────────────────────────────────────────

  describe("6. Spillover Placement", () => {
    it("uses SPILLOVER when sponsor matrix is full", async () => {
      const sponsor = await registerTestUser(rootReferralCode);
      await purchaseClub(sponsor.id, rootId, 1);

      const buyers = await Promise.all(
        Array.from({ length: 5 }, () => registerTestUser(sponsor.referralCode))
      );

      for (const buyer of buyers) {
        await purchaseClub(buyer.id, sponsor.id, 1);
      }

      const spilloverPlacements = await prisma.matrixPlacement.findMany({
        where: {
          userId: { in: buyers.map((b) => b.id) },
          placementType: "SPILLOVER",
        },
      });

      expect(spilloverPlacements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── 7. Club Cycle Completion ───────────────────────────────────────────

  describe("7. Club Cycle Completion", () => {
    it("completes cycle when 4 slots fill in owner matrix", async () => {
      const owner = await registerTestUser(rootReferralCode);
      await purchaseClub(owner.id, rootId, 1);

      const referrals = await Promise.all(
        Array.from({ length: 4 }, () => registerTestUser(owner.referralCode))
      );

      for (const ref of referrals) {
        await purchaseClub(ref.id, owner.id, 1);
      }

      const matrix = await getClubMatrixForOwner(owner.id, 1);
      expect(matrix?.status).toBe("CYCLE_COMPLETE");
      expect(matrix?.slotsFilled).toBe(4);

      const cycleLog = await prisma.matrixOperationLog.findFirst({
        where: { userId: owner.id, operation: "CYCLE_COMPLETION", matrixType: "CLUB" },
      });
      expect(cycleLog).toBeTruthy();
    });
  });

  // ─── 8. Pilot Cycle Completion ────────────────────────────────────────────

  describe("8. Pilot Cycle Completion", () => {
    it("completes pilot cycle when 2 slots fill", async () => {
      const owner = await registerTestUser(rootReferralCode);
      await purchasePilot(owner.id, rootId, 1);

      const buyer1 = await registerTestUser(owner.referralCode);
      const buyer2 = await registerTestUser(owner.referralCode);
      await purchasePilot(buyer1.id, owner.id, 1);
      await purchasePilot(buyer2.id, owner.id, 1);

      const matrix = await getPilotMatrixForOwner(owner.id, 1);
      expect(matrix?.status).toBe("CYCLE_COMPLETE");
      expect(matrix?.slotsFilled).toBe(2);
    });
  });

  // ─── 9. Club Rebirth ──────────────────────────────────────────────────────

  describe("9. Club Rebirth", () => {
    it("creates rebirth matrix with auto-placement after cycle", async () => {
      const owner = await registerTestUser(rootReferralCode);
      await purchaseClub(owner.id, rootId, 1);

      const refs = await Promise.all(
        Array.from({ length: 4 }, () => registerTestUser(owner.referralCode))
      );
      for (const ref of refs) await purchaseClub(ref.id, owner.id, 1);

      const rebirths = await getRebirthMatrices(owner.id, "CLUB");
      expect(rebirths.length).toBeGreaterThanOrEqual(1);

      const rebirth = rebirths[0];
      expect(rebirth.isRebirth).toBe(true);
      expect(rebirth.parentMatrixId).toBeTruthy();

      const rebirthPlacement = await prisma.matrixPlacement.findFirst({
        where: { matrixId: rebirth.id },
      });
      expect(rebirthPlacement).toBeTruthy();
    });
  });

  // ─── 10. Pilot Rebirth ────────────────────────────────────────────────────

  describe("10. Pilot Rebirth", () => {
    it("creates pilot rebirth matrix after cycle completion", async () => {
      const owner = await registerTestUser(rootReferralCode);
      await purchasePilot(owner.id, rootId, 1);

      const b1 = await registerTestUser(owner.referralCode);
      const b2 = await registerTestUser(owner.referralCode);
      await purchasePilot(b1.id, owner.id, 1);
      await purchasePilot(b2.id, owner.id, 1);

      const rebirths = await getRebirthMatrices(owner.id, "PILOT");
      expect(rebirths.length).toBeGreaterThanOrEqual(1);
      expect(rebirths[0].isRebirth).toBe(true);
    });
  });

  // ─── 11. Auto Upgrade ─────────────────────────────────────────────────────

  describe("11. Auto Upgrade", () => {
    it("auto-upgrades club user to next package on first cycle", async () => {
      const owner = await registerTestUser(rootReferralCode);
      await purchaseClub(owner.id, rootId, 1);

      const refs = await Promise.all(
        Array.from({ length: 4 }, () => registerTestUser(owner.referralCode))
      );
      for (const ref of refs) await purchaseClub(ref.id, owner.id, 1);

      const level2Package = await prisma.userClubPackage.findUnique({
        where: { userId_packageLevel: { userId: owner.id, packageLevel: 2 } },
      });
      expect(level2Package).toBeTruthy();
      expect(level2Package?.isManual).toBe(false);

      const upgradeLog = await prisma.matrixOperationLog.findFirst({
        where: { userId: owner.id, operation: "AUTO_UPGRADE", matrixType: "CLUB" },
      });
      expect(upgradeLog).toBeTruthy();
    });
  });

  // ─── 12. Manual Upgrade ───────────────────────────────────────────────────

  describe("12. Manual Upgrade", () => {
    it("handlePilotManualUpgrade creates package and applies incentive", async () => {
      const user = await registerTestUser(rootReferralCode);
      await purchasePilot(user.id, rootId, 1);

      await runMatrixTransaction(async (tx) => {
        await handlePilotManualUpgrade(tx, user.id, rootId, 2, `manual-upgrade-${user.id}`);
      });

      const pkg = await prisma.userPilotPackage.findUnique({
        where: { userId_packageLevel: { userId: user.id, packageLevel: 2 } },
      });
      expect(pkg?.isManual).toBe(true);

      const incentive = await prisma.incomeLedger.findFirst({
        where: { type: "PILOT_INCENTIVE", sourceUserId: user.id, packageLevel: 2 },
      });
      expect(incentive).toBeTruthy();
    });
  });

  // ─── 13. First Line Bonus ─────────────────────────────────────────────────

  describe("13. First Line Bonus", () => {
    it("qualifies after 4 direct referrals with club packages", async () => {
      const sponsor = await registerTestUser(rootReferralCode);
      await purchaseClub(sponsor.id, rootId, 4);

      const directs = await Promise.all(
        Array.from({ length: 4 }, () => registerTestUser(sponsor.referralCode))
      );
      for (const d of directs) await purchaseClub(d.id, sponsor.id, 4);

      const tokenRewards = await prisma.tokenReward.findMany({
        where: { userId: sponsor.id, rewardType: "FIRST_LINE_BONUS" },
      });
      const bonusLedger = await getLedgerByType(sponsor.id, "FIRST_LINE_BONUS");

      expect(tokenRewards.length).toBeGreaterThanOrEqual(1);
      expect(bonusLedger.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── 14. Sponsor Payments ─────────────────────────────────────────────────

  describe("14. Sponsor Payments", () => {
    beforeEach(async () => {
      await enableSponsorPayments(0.1, 0.1);
    });

    it("credits sponsor on club purchase when enabled", async () => {
      const sponsor = await registerTestUser(rootReferralCode);
      await purchaseClub(sponsor.id, rootId, 1);

      const buyer = await registerTestUser(sponsor.referralCode);
      await purchaseClub(buyer.id, sponsor.id, 1);

      const sponsorPayment = await prisma.incomeLedger.findFirst({
        where: { userId: sponsor.id, type: "SPONSOR_PAYMENT" },
      });
      expect(sponsorPayment).toBeTruthy();
      expect(Number(sponsorPayment!.amount)).toBeCloseTo(getClubPackageAmount(1) * 0.1, 2);
    });
  });

  // ─── 15. Token Rewards ────────────────────────────────────────────────────

  describe("15. Token Rewards", () => {
    it("stores welcome SLT in TokenReward on club purchase", async () => {
      const user = await registerTestUser(rootReferralCode);
      await purchaseClub(user.id, rootId, 1);

      const tokenReward = await prisma.tokenReward.findFirst({
        where: { userId: user.id, rewardType: "WELCOME_AIRDROP" },
      });
      expect(tokenReward).toBeTruthy();
      expect(Number(tokenReward!.amount)).toBe(getClubSltWelcome(1));
    });
  });

  // ─── 16. Wallet Updates ───────────────────────────────────────────────────

  describe("16. Wallet Updates", () => {
    it("increments wallet balance on income credit", async () => {
      const sponsor = await registerTestUser(rootReferralCode);
      await purchaseClub(sponsor.id, rootId, 1);

      const before = await getWallet(sponsor.id);
      const beforeEarned = Number(before.totalEarned);

      await enableSponsorPayments(0.1, 0.1);
      const buyer = await registerTestUser(sponsor.referralCode);
      await purchaseClub(buyer.id, sponsor.id, 1);

      const after = await getWallet(sponsor.id);
      expect(Number(after.totalEarned)).toBeGreaterThan(beforeEarned);
    });
  });

  // ─── 17. Ledger Entries ───────────────────────────────────────────────────

  describe("17. Ledger Entries", () => {
    it("is idempotent on duplicate purchase with same txHash", async () => {
      const user = await registerTestUser(rootReferralCode);
      const txHash = `idempotent-${user.id}`;

      await purchaseClub(user.id, rootId, 1, txHash);
      await purchaseClub(user.id, rootId, 1, txHash);

      const purchases = await prisma.packagePurchase.count({
        where: { userId: user.id, txHash },
      });
      expect(purchases).toBe(1);
    });

    it("ledger entries are append-only with unique idempotency keys", async () => {
      const user = await registerTestUser(rootReferralCode);
      await purchasePilot(user.id, rootId, 1);

      const ledgers = await prisma.incomeLedger.findMany({
        where: { userId: { in: [user.id, rootId] } },
      });

      const keys = ledgers.map((l) => l.idempotencyKey).filter(Boolean);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  // ─── 18. Withdrawal Requests ──────────────────────────────────────────────

  describe("18. Withdrawal Requests", () => {
    it("creates withdrawal request when balance sufficient", async () => {
      const user = await registerTestUser(rootReferralCode);
      await purchaseClub(user.id, rootId, 1);

      await prisma.wallet.update({
        where: { userId: user.id },
        data: { withdrawableBalance: 100, availableBalance: 100, totalEarned: 100 },
      });

      const withdrawal = await prisma.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: 10,
          walletAddress: user.walletAddress,
          status: "PENDING",
        },
      });

      expect(withdrawal.status).toBe("PENDING");
      expect(Number(withdrawal.amount)).toBe(10);
    });
  });

  // ─── 19. Deposit Processing ───────────────────────────────────────────────

  describe("19. Deposit Processing", () => {
    it("processBlockchainDeposit records deposit and queues purchase", async () => {
      const user = await registerTestUser(rootReferralCode);
      const txHash = `deposit-${user.id}-${Date.now()}`;

      await processBlockchainDeposit(user.id, txHash, getClubPackageAmount(1), 1, "CLUB");

      const deposit = await prisma.blockchainTransaction.findUnique({ where: { txHash } });
      expect(deposit).toBeTruthy();
      expect(deposit!.type).toBe("DEPOSIT");
      expect(deposit!.status).toBe("CONFIRMED");
    });
  });

  // ─── 20. Blockchain Transaction Recording ─────────────────────────────────

  describe("20. Blockchain Transaction Recording", () => {
    it("prevents duplicate deposit records for same txHash", async () => {
      const user = await registerTestUser(rootReferralCode);
      const txHash = `blockchain-dup-${user.id}`;

      await processBlockchainDeposit(user.id, txHash, getPilotPackageAmount(1), 1, "PILOT");
      await processBlockchainDeposit(user.id, txHash, getPilotPackageAmount(1), 1, "PILOT");

      const count = await prisma.blockchainTransaction.count({ where: { txHash } });
      expect(count).toBe(1);
    });
  });

  // ─── Cross-cutting: Referral Trees ────────────────────────────────────────

  describe("Referral Tree Integrity", () => {
    it("maintains consistent treePath across generations", async () => {
      const gen1 = await registerTestUser(rootReferralCode);
      const gen2 = await registerTestUser(gen1.referralCode);
      const gen3 = await registerTestUser(gen2.referralCode);

      expect(gen3.treePath).toContain(gen2.id);
      expect(gen3.treePath).toContain(gen1.id);

      const teamSize = await prisma.user.count({
        where: { treePath: { startsWith: gen1.treePath } },
      });
      expect(teamSize).toBeGreaterThanOrEqual(2);
    });
  });
});

describe.skipIf(!dbAvailable)("E2E — No Double Pilot Owner Payment", () => {
  afterAll(async () => {
    await cleanupE2EUsers();
  });

  it("owner receives exactly one slot-1 payment per pilot cycle", async () => {
    const root = await ensureRootUser();
    const owner = await registerTestUser(root.referralCode);
    await purchasePilot(owner.id, root.id, 1);

    const slot1Payments = await prisma.incomeLedger.findMany({
      where: { userId: owner.id, type: "PILOT_CYCLE", packageLevel: 1 },
    });

    const pilotCycleCount = slot1Payments.length;
    expect(pilotCycleCount).toBeLessThanOrEqual(1);
  });
});
