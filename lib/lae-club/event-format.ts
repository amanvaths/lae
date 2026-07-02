import type { MatrixUserEvent } from "./matrix-events";
import { eventBlockNumber } from "./event-utils";

export type EventCategory =
  | "income"
  | "lapse"
  | "treasury"
  | "placement"
  | "recycle"
  | "upgrade"
  | "registration"
  | "missed"
  | "reward"
  | "other";

export type EventChip = { label: string };

export type MatrixEventView = {
  key: string;
  /** raw contract event name */
  name: string;
  /** human-friendly label */
  label: string;
  category: EventCategory;
  /** wei amount if the event carries value */
  amount?: bigint;
  /** true when the amount is money credited TO the subject user */
  isCredit: boolean;
  /** short one-line context, e.g. "From #12 · Board #3" */
  description: string;
  /** small badges: Level / Cycle / Slot */
  chips: string[];
  /** counterparties for search/filtering */
  fromId?: number;
  toId?: number;
  boardOwnerId?: number;
  level?: number;
  cycle?: number;
  slot?: number;
  txHash: string;
  logIndex?: number;
  blockNumber?: bigint;
  createdAt?: string;
};

function toNum(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && /^-?\d+$/.test(v)) return Number(v);
  return undefined;
}

function toBig(v: unknown): bigint | undefined {
  if (typeof v === "bigint") return v;
  if (typeof v === "number" && Number.isFinite(v)) return BigInt(Math.trunc(v));
  if (typeof v === "string") {
    const int = v.includes(".") ? v.split(".")[0] : v;
    if (/^-?\d+$/.test(int)) return BigInt(int);
  }
  return undefined;
}

const META: Record<string, { label: string; category: EventCategory }> = {
  TokenReceived: { label: "Income received", category: "income" },
  LapseIncome: { label: "Lapse income", category: "lapse" },
  ClubPoolPayment: { label: "Treasury / liquidity", category: "treasury" },
  NewUserPlace: { label: "Matrix placement", category: "placement" },
  Reinvest: { label: "Board recycle", category: "recycle" },
  Upgrade: { label: "Level upgrade", category: "upgrade" },
  UpgradeHold: { label: "Upgrade hold", category: "upgrade" },
  Registration: { label: "Registration", category: "registration" },
  MissedIncome: { label: "Missed income", category: "missed" },
  LaeRewardAllocated: { label: "LAE reward allocated", category: "reward" },
  LaeRewardClaimed: { label: "LAE reward claimed", category: "reward" },
};

/**
 * Decode a raw matrix event (from the indexer API or on-chain) into a
 * presentation-ready view. Handles both the events-API payload keys (matching
 * the Solidity event args) and the income-API normalized keys.
 */
export function describeMatrixEvent(e: MatrixUserEvent): MatrixEventView {
  const name = (e.eventName as string) ?? "Event";
  const meta = META[name] ?? { label: name, category: "other" as EventCategory };
  const a = (e.args ?? {}) as Record<string, unknown>;

  const amount = toBig(a.amount);
  const level = toNum(a.level) ?? toNum(a.boardLevel);
  const cycle = toNum(a.cycle) ?? toNum(a.cycleId);
  const slot = toNum(a.spot) ?? toNum(a.position);

  // payer / source id across the various event shapes
  const fromId =
    toNum(a.fromId) ??
    toNum(a.fromUserId) ??
    (name === "MissedIncome" ? toNum(a.userId) : undefined);
  const receiverId = toNum(a.receiverId) ?? toNum(a.toUserId);
  const boardOwnerId =
    toNum(a.matrixOwnerId) ??
    toNum(a.referrer) ??
    toNum(a.boardOwnerId);
  const subjectId = toNum(a.user) ?? toNum(a.userId);
  const sponsorId = toNum(a.referrerId) ?? toNum(a.newReferrerId);

  const chips: string[] = [];
  if (level != null) chips.push(`Level ${level}`);
  if (cycle != null && cycle > 0) chips.push(`Cycle ${cycle}`);
  if (slot != null && slot > 0) chips.push(`Slot ${slot}`);

  let description = "";
  switch (meta.category) {
    case "income":
    case "lapse": {
      const parts: string[] = [];
      if (fromId != null) parts.push(`From #${fromId}`);
      if (boardOwnerId != null && boardOwnerId !== fromId) parts.push(`Board #${boardOwnerId}`);
      description = parts.join(" · ") || "Matrix income";
      break;
    }
    case "treasury":
      description = "Registration split to treasury / liquidity";
      break;
    case "placement":
      description =
        subjectId != null
          ? `User #${subjectId} placed${boardOwnerId != null ? ` on #${boardOwnerId}'s board` : ""}`
          : "New placement";
      break;
    case "recycle":
      description = subjectId != null ? `Board #${subjectId} completed & recycled` : "Board recycled";
      break;
    case "upgrade":
      description =
        name === "UpgradeHold"
          ? `Held for next level${boardOwnerId != null ? ` · board #${boardOwnerId}` : ""}`
          : subjectId != null
            ? `User #${subjectId} advanced a level`
            : "Level upgraded";
      break;
    case "registration":
      description =
        subjectId != null
          ? `User #${subjectId} joined${sponsorId != null ? ` · sponsor #${sponsorId}` : ""}`
          : "New registration";
      break;
    case "missed":
      description = fromId != null ? `Skipped — from #${fromId}` : "Income skipped (not eligible)";
      break;
    case "reward":
      description = "LAE token reward";
      break;
    default:
      description = "";
  }

  const isCredit =
    (meta.category === "income" || meta.category === "lapse" || meta.category === "reward") &&
    amount != null &&
    amount > 0n;

  const createdAt =
    typeof (e as { createdAt?: unknown }).createdAt === "string"
      ? (e as { createdAt?: string }).createdAt
      : undefined;

  return {
    key: `${e.transactionHash}-${e.logIndex ?? ""}-${name}`,
    name,
    label: meta.label,
    category: meta.category,
    amount,
    isCredit,
    description,
    chips,
    fromId,
    toId: receiverId ?? subjectId,
    boardOwnerId,
    level,
    cycle,
    slot,
    txHash: e.transactionHash as string,
    logIndex: e.logIndex ?? undefined,
    blockNumber: eventBlockNumber(e) || undefined,
    createdAt,
  };
}

/** Category → display tone/label used by the feed and filters. */
export const CATEGORY_STYLE: Record<
  EventCategory,
  { label: string; tone: "emerald" | "gold" | "brand" | "violet" | "red" | "slate" }
> = {
  income: { label: "Income", tone: "emerald" },
  lapse: { label: "Lapse", tone: "emerald" },
  treasury: { label: "Treasury", tone: "violet" },
  placement: { label: "Placement", tone: "brand" },
  recycle: { label: "Recycle", tone: "gold" },
  upgrade: { label: "Upgrade", tone: "gold" },
  registration: { label: "Registration", tone: "brand" },
  missed: { label: "Missed", tone: "red" },
  reward: { label: "Reward", tone: "emerald" },
  other: { label: "Other", tone: "slate" },
};
