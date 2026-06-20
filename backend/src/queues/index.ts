import type { Queue } from "bullmq";
import { Queue as BullQueue } from "bullmq";
import { bullmqConnection } from "../lib/redis.js";

const connection = bullmqConnection;

/**
 * Legacy MLM job queues — disabled. Matrix logic runs on-chain only.
 * Queues are kept as no-op stubs so imports do not break.
 */
export const placementQueue = new BullQueue("placement", { connection });
export const rebirthQueue = new BullQueue("rebirth", { connection });
export const autoUpgradeQueue = new BullQueue("auto-upgrade", { connection });
export const incomeQueue = new BullQueue("income-distribution", { connection });
export const withdrawQueue = new BullQueue("withdrawal", { connection });
export const notificationQueue = new BullQueue("notification", { connection });
export const purchaseQueue = new BullQueue("package-purchase", { connection });

export interface PlacementJob {
  userId: string;
  sponsorId: string;
  packageLevel: number;
  matrixType: "CLUB" | "PILOT";
  idempotencyKey?: string;
}

export interface PurchaseJob {
  userId: string;
  sponsorId: string;
  packageLevel: number;
  matrixType: "CLUB" | "PILOT";
  txHash?: string;
  isManual?: boolean;
}

export interface WithdrawJob {
  withdrawalId: string;
  userId: string;
  amount: number;
  walletAddress: string;
}

export interface NotificationJob {
  userId: string;
  event: string;
  payload: Record<string, unknown>;
}

/** Legacy MLM workers disabled — backend is indexer + analytics only. */
export function startWorkers(): never[] {
  console.warn("[queues] MLM workers disabled — analytics/indexer mode only");
  return [];
}

export const rewardQueue: Queue = purchaseQueue;
