import { describe, it, expect } from "vitest";
import { getNextClubPosition, getNextPilotPosition } from "../src/engines/spillover.engine.js";

describe("Position ordering", () => {
  it("fills club positions in correct order", () => {
    expect(getNextClubPosition(0)).toBe("LEFT");
    expect(getNextClubPosition(1)).toBe("RIGHT");
    expect(getNextClubPosition(2)).toBe("LEFT_CHILD");
    expect(getNextClubPosition(3)).toBe("RIGHT_CHILD");
    expect(getNextClubPosition(4)).toBeNull();
  });

  it("fills pilot positions in correct order", () => {
    expect(getNextPilotPosition(0)).toBe("SLOT_1");
    expect(getNextPilotPosition(1)).toBe("SLOT_2");
    expect(getNextPilotPosition(2)).toBeNull();
  });
});

describe("Pilot package pool amounts", () => {
  it("maps 26 DAI to 25 DAI pool", async () => {
    const { getPilotPoolAmount, PILOT_POOL_AMOUNTS } = await import("../src/config/packages.js");
    expect(getPilotPoolAmount(1)).toBe(25);
    expect(PILOT_POOL_AMOUNTS[7]).toBe(3200);
  });
});

describe("Token reward percentages", () => {
  it("club welcome is 50% of package", async () => {
    const { CLUB_TOKEN_WELCOME_PERCENT, getClubPackageAmount } = await import("../src/config/packages.js");
    const pkg = getClubPackageAmount(4);
    expect(pkg * CLUB_TOKEN_WELCOME_PERCENT).toBe(20);
  });

  it("pilot welcome is 100% of package", async () => {
    const { PILOT_TOKEN_WELCOME_PERCENT, getPilotPackageAmount } = await import("../src/config/packages.js");
    const pkg = getPilotPackageAmount(1);
    expect(pkg * PILOT_TOKEN_WELCOME_PERCENT).toBe(26);
  });
});
