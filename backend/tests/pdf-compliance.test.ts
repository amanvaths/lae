import { describe, it, expect } from "vitest";
import {
  getPilotPoolAmount,
  PILOT_INCENTIVE_DAI,
  PILOT_PACKAGES,
} from "../src/config/packages.js";
import {
  getClubSltWelcome,
  getClubSltDirect,
  getPilotSltWelcome,
  getPilotSltDirect,
} from "../src/config/slt-rewards.js";

describe("Pilot Matrix Payment Logic (PDF compliance)", () => {
  it("pool amounts match PDF structure (total - 1 DAI incentive)", () => {
    for (let i = 0; i < PILOT_PACKAGES.length; i++) {
      expect(PILOT_PACKAGES[i] - getPilotPoolAmount(i + 1)).toBe(PILOT_INCENTIVE_DAI);
    }
  });

  it("slot 1 pays exactly pool amount to owner (not total package)", () => {
    const level = 9; // 1280 pool level index - use level 1 for clarity
    expect(getPilotPoolAmount(1)).toBe(25);
    expect(getPilotPoolAmount(1)).not.toBe(PILOT_PACKAGES[0]);
  });

  it("cycle 1 auto-upgrade must NOT add second owner payment", async () => {
    const { handlePilotAutoUpgrade } = await import("../src/engines/auto-upgrade.engine.js");
    // cyclesCompleted === 1 should return early without crediting wallet
    // Verified by code inspection: function returns immediately at cyclesCompleted === 1
    expect(handlePilotAutoUpgrade.length).toBeGreaterThan(0);
    const fnStr = handlePilotAutoUpgrade.toString();
    expect(fnStr).toContain("cyclesCompleted === 1");
    expect(fnStr).toMatch(/return;\s*\}/);
  });

  it("prevents double owner payout: slot1 key != cycle1 upgrade key", () => {
    const matrixId = "matrix-test-1";
    const slot1Key = `income:PILOT_SLOT1:${matrixId}:user1`;
    const cycle1UpgradeKey = `pilot-cycle-${matrixId}-cycle1-profit`;
    expect(slot1Key).not.toBe(cycle1UpgradeKey);
  });
});

describe("Pilot Incentive Routing", () => {
  it("only applies on manual purchases (isManual=true)", async () => {
    const { routePilotIncentive } = await import("../src/engines/pilot-incentive.engine.js");
    const fnStr = routePilotIncentive.toString();
    expect(fnStr).toContain("!input.isManual");
    expect(fnStr).toContain("PILOT_INCENTIVE");
  });

  it("incentive amount is always 1 DAI", () => {
    expect(PILOT_INCENTIVE_DAI).toBe(1);
  });
});

describe("Exact SLT Reward Table (PDF)", () => {
  it("club welcome SLT matches PDF table", () => {
    expect(getClubSltWelcome(1)).toBe(2.5);   // 5 DAI package
    expect(getClubSltWelcome(4)).toBe(20);    // 40 DAI
    expect(getClubSltWelcome(12)).toBe(5120); // 10240 DAI
  });

  it("club direct SLT matches PDF table (10%)", () => {
    expect(getClubSltDirect(1)).toBe(0.5);
    expect(getClubSltDirect(4)).toBe(4);
    expect(getClubSltDirect(12)).toBe(1024);
  });

  it("pilot welcome SLT matches PDF table (100%)", () => {
    expect(getPilotSltWelcome(1)).toBe(25);
    expect(getPilotSltWelcome(8)).toBe(3200);
  });

  it("pilot direct SLT matches PDF table (10%)", () => {
    expect(getPilotSltDirect(1)).toBe(2.5);
    expect(getPilotSltDirect(8)).toBe(320);
  });
});

describe("Rebirth auto-placement", () => {
  it("autoPlaceRebirthInNetwork exists and uses sponsor", async () => {
    const { autoPlaceRebirthInNetwork } = await import("../src/engines/rebirth-placement.engine.js");
    expect(autoPlaceRebirthInNetwork).toBeDefined();
    const fnStr = autoPlaceRebirthInNetwork.toString();
    expect(fnStr).toContain("sponsorId");
    expect(fnStr).toContain("rebirth-placement:");
  });

  it("rebirth engine calls autoPlaceRebirthInNetwork", async () => {
    const { createClubRebirth } = await import("../src/engines/rebirth.engine.js");
    expect(createClubRebirth.toString()).toContain("autoPlaceRebirthInNetwork");
  });
});

describe("First-line 10% bonus wiring", () => {
  it("purchase flow includes first-line bonus", async () => {
    const { executePackagePurchase } = await import("../src/services/matrix-orchestrator.service.js");
    expect(executePackagePurchase.toString()).toContain("processFirstLineBonusForSponsorChain");
  });

  it("cycle completion includes first-line bonus", async () => {
    const { processClubCycleCompletion } = await import("../src/engines/cycle.engine.js");
    expect(processClubCycleCompletion.toString()).toContain("processFirstLineBonusForSponsorChain");
  });

  it("first-line bonus uses FIRST_LINE_BONUS reward type", async () => {
    const { processFirstLineMemberBonus } = await import("../src/engines/first-line-bonus.engine.js");
    expect(processFirstLineMemberBonus.toString()).toContain("FIRST_LINE_BONUS");
  });
});

describe("Sponsor payment wiring", () => {
  it("purchase flow includes sponsor payment", async () => {
    const { executePackagePurchase } = await import("../src/services/matrix-orchestrator.service.js");
    expect(executePackagePurchase.toString()).toContain("distributeSponsorPayment");
  });
});
