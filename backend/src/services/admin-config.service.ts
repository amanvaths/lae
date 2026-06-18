import type { MatrixType } from "@prisma/client";
import type { TransactionClient } from "../lib/prisma.js";
import { prisma } from "../lib/prisma.js";

export type TokenRewardModeType = "FIXED_SLT" | "PERCENTAGE";

export interface SponsorPaymentConfig {
  enabled: boolean;
  clubPercent: number;
  pilotPercent: number;
}

export interface TokenRewardConfig {
  mode: TokenRewardModeType;
  clubWelcomePercent: number;
  clubDirectPercent: number;
  pilotWelcomePercent: number;
  pilotDirectPercent: number;
}

export interface PilotIncentiveConfig {
  enabled: boolean;
  recipient: "sponsor" | "incentive_pool";
  incentivePoolUserId?: string;
}

const DEFAULT_SPONSOR: SponsorPaymentConfig = {
  enabled: true,
  clubPercent: 0,
  pilotPercent: 0,
};

const DEFAULT_TOKEN: TokenRewardConfig = {
  mode: "FIXED_SLT",
  clubWelcomePercent: 0.5,
  clubDirectPercent: 0.1,
  pilotWelcomePercent: 1.0,
  pilotDirectPercent: 0.1,
};

const DEFAULT_PILOT_INCENTIVE: PilotIncentiveConfig = {
  enabled: true,
  recipient: "sponsor",
};

async function readConfig<T>(key: string, fallback: T, tx?: TransactionClient): Promise<T> {
  const db = tx ?? prisma;
  const row = await db.systemConfig.findUnique({ where: { key } });
  if (!row) return fallback;
  return { ...fallback, ...(row.value as object) } as T;
}

export async function getSponsorPaymentConfig(tx?: TransactionClient) {
  return readConfig("sponsor_payment", DEFAULT_SPONSOR, tx);
}

export async function getTokenRewardConfig(tx?: TransactionClient) {
  return readConfig("token_reward", DEFAULT_TOKEN, tx);
}

export async function getPilotIncentiveConfig(tx?: TransactionClient) {
  return readConfig("pilot_incentive", DEFAULT_PILOT_INCENTIVE, tx);
}

export async function setAdminConfig(key: string, value: object) {
  return prisma.systemConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export function calcSponsorPaymentAmount(
  config: SponsorPaymentConfig,
  matrixType: MatrixType,
  packageAmount: number
): number {
  if (!config.enabled) return 0;
  const pct = matrixType === "CLUB" ? config.clubPercent : config.pilotPercent;
  return Math.round(packageAmount * pct * 1e6) / 1e6;
}
