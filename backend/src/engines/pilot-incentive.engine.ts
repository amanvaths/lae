import type { TransactionClient } from "../lib/prisma.js";
import { PILOT_INCENTIVE_DAI } from "../config/packages.js";
import { creditWallet, appendLedgerEntry } from "./income.engine.js";
import { getPilotIncentiveConfig } from "../services/admin-config.service.js";
import { incomeIdempotencyKey } from "../lib/idempotency.js";

export interface PilotIncentiveInput {
  buyerUserId: string;
  sponsorId: string;
  packageLevel: number;
  isManual: boolean;
  source: "purchase" | "manual_upgrade";
  referenceId: string;
}

/**
 * Route 1 DAI incentive on manual Pilot purchases/upgrades only.
 * Auto-upgrades pass isManual=false and skip incentive.
 */
export async function routePilotIncentive(
  tx: TransactionClient,
  input: PilotIncentiveInput
): Promise<{ routed: boolean; recipientId?: string; amount: number }> {
  if (!input.isManual) {
    return { routed: false, amount: 0 };
  }

  const config = await getPilotIncentiveConfig(tx);
  if (!config.enabled) {
    return { routed: false, amount: 0 };
  }

  let recipientId: string;
  if (config.recipient === "incentive_pool" && config.incentivePoolUserId) {
    recipientId = config.incentivePoolUserId;
  } else {
    recipientId = input.sponsorId;
  }

  const idempotencyKey = incomeIdempotencyKey(
    "PILOT_INCENTIVE",
    input.referenceId,
    `${input.source}-${input.packageLevel}`
  );

  await creditWallet(tx, {
    userId: recipientId,
    amount: PILOT_INCENTIVE_DAI,
    type: "PILOT_INCENTIVE",
    packageLevel: input.packageLevel,
    matrixType: "PILOT",
    sourceUserId: input.buyerUserId,
    idempotencyKey,
  });

  await appendLedgerEntry(tx, {
    userId: recipientId,
    amount: PILOT_INCENTIVE_DAI,
    type: "PILOT_INCENTIVE",
    packageLevel: input.packageLevel,
    matrixType: "PILOT",
    sourceUserId: input.buyerUserId,
    idempotencyKey: `ledger-${idempotencyKey}`,
    metadata: {
      source: input.source,
      isManual: true,
      buyerUserId: input.buyerUserId,
    },
  });

  return { routed: true, recipientId, amount: PILOT_INCENTIVE_DAI };
}
