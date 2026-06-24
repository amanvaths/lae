import type { Address } from "viem";
import {
  GOLD_SPOTS,
  LAE_MATRIX_SIZE,
  MATRIX_SPOT_LABELS,
  SILVER_SPOTS,
} from "./constants";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/** Visual tree rows — fixed layout, contract fills by index. */
export const MATRIX_ROWS: readonly (readonly number[])[] = [
  [1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13, 14],
] as const;

export type MatrixSlotState = "locked" | "waiting" | "open" | "filled";

export type MatrixSlot = {
  spot: number;
  state: MatrixSlotState;
  address?: Address;
  userId?: number | null;
  label: string;
  sublabel: string;
  tone: "gold" | "silver";
};

/**
 * Build API slot DTO → 14 UI slots for MatrixVisualizer.
 * Index i in referrals[] = spot (i + 1). Sequential fill only.
 */
export function buildMatrixSlots(
  referrals: readonly Address[],
  levelActive: boolean,
  idByAddress?: Map<string, number>
): MatrixSlot[] {
  const filledCount = referrals.filter(
    (a) => a && a.toLowerCase() !== ZERO
  ).length;
  const nextOpenSpot = filledCount + 1;

  return Array.from({ length: LAE_MATRIX_SIZE }, (_, i) => {
    const spot = i + 1;
    const meta = MATRIX_SPOT_LABELS[spot]!;
    const raw = referrals[i];
    const hasAddress = !!raw && raw.toLowerCase() !== ZERO;

    if (!levelActive) {
      return {
        spot,
        state: "locked" as const,
        label: meta.label,
        sublabel: meta.sublabel,
        tone: meta.tone,
      };
    }

    if (hasAddress) {
      return {
        spot,
        state: "filled" as const,
        address: raw,
        userId: idByAddress?.get(raw.toLowerCase()) ?? null,
        label: meta.label,
        sublabel: meta.sublabel,
        tone: meta.tone,
      };
    }

    if (spot === nextOpenSpot) {
      return {
        spot,
        state: "open" as const,
        label: meta.label,
        sublabel: meta.sublabel,
        tone: meta.tone,
      };
    }

    return {
      spot,
      state: "waiting" as const,
      label: meta.label,
      sublabel: meta.sublabel,
      tone: meta.tone,
    };
  });
}

export function countFilledSlots(referrals: readonly Address[]): number {
  return referrals.filter((a) => a && a.toLowerCase() !== ZERO).length;
}

type ApiSlotInput = {
  position: number;
  state: MatrixSlotState;
  userId?: number | null;
  address?: string | null;
};

/**
 * Map backend matrix-tree API slots → UI slots. The backend (contract source of
 * truth) already decides each slot state; the frontend only attaches labels.
 */
export function buildSlotsFromApi(apiSlots: ApiSlotInput[]): MatrixSlot[] {
  const byPosition = new Map<number, ApiSlotInput>();
  for (const s of apiSlots) byPosition.set(s.position, s);

  return Array.from({ length: LAE_MATRIX_SIZE }, (_, i) => {
    const spot = i + 1;
    const meta = MATRIX_SPOT_LABELS[spot]!;
    const api = byPosition.get(spot);
    const state: MatrixSlotState = api?.state ?? "waiting";
    return {
      spot,
      state,
      address: api?.address ? (api.address as Address) : undefined,
      userId: api?.userId ?? null,
      label: meta.label,
      sublabel: meta.sublabel,
      tone: meta.tone,
    };
  });
}

export function isGoldSpot(spot: number): boolean {
  return (GOLD_SPOTS as readonly number[]).includes(spot);
}

export function isSilverSpot(spot: number): boolean {
  return (SILVER_SPOTS as readonly number[]).includes(spot);
}

/** Dev/QA: compare UI slots vs raw contract referrals array. */
export function validateMatrixMapping(
  referrals: readonly Address[],
  slots: MatrixSlot[],
  levelActive: boolean
): { pass: boolean; firstMismatch?: number; reason?: string } {
  for (let i = 0; i < LAE_MATRIX_SIZE; i++) {
    const spot = i + 1;
    const slot = slots[i];
    const raw = referrals[i];
    const contractFilled = !!raw && raw.toLowerCase() !== ZERO;

    if (!levelActive) {
      if (slot?.state !== "locked") {
        return { pass: false, firstMismatch: spot, reason: "expected locked when level inactive" };
      }
      continue;
    }

    if (contractFilled && slot?.state !== "filled") {
      return {
        pass: false,
        firstMismatch: spot,
        reason: `contract has address but UI state is ${slot?.state}`,
      };
    }
    if (!contractFilled && contractFilled !== (slot?.state === "filled")) {
      if (slot?.state === "filled") {
        return { pass: false, firstMismatch: spot, reason: "UI filled but contract empty" };
      }
    }
    if (contractFilled && slot?.address?.toLowerCase() !== raw?.toLowerCase()) {
      return { pass: false, firstMismatch: spot, reason: "address mismatch" };
    }
  }
  return { pass: true };
}
