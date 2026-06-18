import { describe, it, expect } from "vitest";
import {
  CLUB_PACKAGES,
  PILOT_PACKAGES,
  getClubCycleReward,
  getClubWithdrawAmount,
  getClubReinvestAmount,
  getClubPackageAmount,
} from "../src/config/packages.js";
import { findNextAvailablePosition } from "../src/engines/spillover.engine.js";
import type { MatrixPosition } from "@prisma/client";

describe("Club Package Constants", () => {
  it("has 12 club packages", () => {
    expect(CLUB_PACKAGES).toHaveLength(12);
    expect(CLUB_PACKAGES[0]).toBe(5);
    expect(CLUB_PACKAGES[11]).toBe(10240);
  });

  it("has 8 pilot packages", () => {
    expect(PILOT_PACKAGES).toHaveLength(8);
    expect(PILOT_PACKAGES[0]).toBe(26);
  });

  it("calculates 1280 DAI cycle correctly", () => {
    expect(getClubCycleReward(9)).toBe(3840);
    expect(getClubWithdrawAmount(9)).toBe(2560);
    expect(getClubReinvestAmount(9)).toBe(1280);
  });

  it("calculates 5 DAI cycle correctly", () => {
    expect(getClubCycleReward(1)).toBe(15);
    expect(getClubWithdrawAmount(1)).toBe(10);
    expect(getClubReinvestAmount(1)).toBe(5);
  });
});

describe("Spillover Engine", () => {
  it("finds first available LEFT position", () => {
    const result = findNextAvailablePosition([
      {
        matrixId: "m1",
        ownerId: "u1",
        filledPositions: new Set<MatrixPosition>(),
      },
    ]);
    expect(result?.position).toBe("LEFT");
    expect(result?.matrixId).toBe("m1");
  });

  it("skips filled positions in order", () => {
    const result = findNextAvailablePosition([
      {
        matrixId: "m1",
        ownerId: "u1",
        filledPositions: new Set<MatrixPosition>(["LEFT", "RIGHT"]),
      },
    ]);
    expect(result?.position).toBe("LEFT_CHILD");
  });

  it("returns null when matrix is full", () => {
    const result = findNextAvailablePosition([
      {
        matrixId: "m1",
        ownerId: "u1",
        filledPositions: new Set<MatrixPosition>([
          "LEFT",
          "RIGHT",
          "LEFT_CHILD",
          "RIGHT_CHILD",
        ]),
      },
    ]);
    expect(result).toBeNull();
  });
});

describe("Package amounts", () => {
  it("throws on invalid level", () => {
    expect(() => getClubPackageAmount(99)).toThrow();
  });
});
