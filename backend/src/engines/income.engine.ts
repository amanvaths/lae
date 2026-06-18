import type { Prisma, IncomeType, MatrixType, LedgerDirection } from "@prisma/client";
import type { TransactionClient } from "../lib/prisma.js";
import { AppError } from "../utils/helpers.js";
import { lockWallet } from "../lib/row-lock.js";
import { incomeIdempotencyKey } from "../lib/idempotency.js";

export interface CreditWalletInput {
  userId: string;
  amount: number;
  type: IncomeType;
  packageLevel?: number;
  matrixType?: MatrixType;
  matrixId?: string;
  sourceUserId?: string;
  idempotencyKey?: string;
}

export interface RecordIncomeInput extends CreditWalletInput {
  tokenAmount?: number;
  txHash?: string;
  direction?: LedgerDirection;
  balanceAfter?: number;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append-only ledger entry. NEVER update existing income_ledger rows.
 * Idempotency key prevents duplicate financial records.
 */
export async function appendLedgerEntry(
  tx: TransactionClient,
  input: RecordIncomeInput
): Promise<void> {
  if (input.idempotencyKey) {
    const existing = await tx.incomeLedger.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return;
  }

  let balanceAfter: number | undefined = input.balanceAfter as number | undefined;

  if (balanceAfter === undefined && input.direction !== "DEBIT" && input.amount > 0) {
    await lockWallet(tx, input.userId);
    const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
    balanceAfter = Number(wallet?.availableBalance ?? 0) + input.amount;
  }

  await tx.incomeLedger.create({
    data: {
      userId: input.userId,
      type: input.type,
      direction: input.direction ?? "CREDIT",
      amount: input.amount,
      tokenAmount: input.tokenAmount,
      balanceAfter,
      packageLevel: input.packageLevel,
      matrixType: input.matrixType,
      sourceUserId: input.sourceUserId,
      matrixId: input.matrixId,
      txHash: input.txHash,
      idempotencyKey: input.idempotencyKey,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function creditWallet(
  tx: TransactionClient,
  input: CreditWalletInput
): Promise<void> {
  const key =
    input.idempotencyKey ??
    (input.matrixId
      ? incomeIdempotencyKey(input.type, input.matrixId, input.userId)
      : undefined);

  if (key) {
    const existing = await tx.incomeLedger.findUnique({ where: { idempotencyKey: key } });
    if (existing) return;
  }

  await lockWallet(tx, input.userId);

  const updated = await tx.wallet.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      availableBalance: input.amount,
      withdrawableBalance: input.amount,
      totalEarned: input.amount,
      version: 1,
    },
    update: {
      availableBalance: { increment: input.amount },
      withdrawableBalance: { increment: input.amount },
      totalEarned: { increment: input.amount },
      version: { increment: 1 },
    },
  });

  await appendLedgerEntry(tx, {
    ...input,
    idempotencyKey: key,
    balanceAfter: Number(updated.availableBalance),
  });
}

export async function debitWithdrawable(
  tx: TransactionClient,
  userId: string,
  amount: number,
  idempotencyKey?: string
): Promise<void> {
  if (idempotencyKey) {
    const existing = await tx.incomeLedger.findUnique({ where: { idempotencyKey } });
    if (existing) return;
  }

  await lockWallet(tx, userId);

  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.withdrawableBalance) < amount) {
    throw new AppError(400, "Insufficient withdrawable balance", "INSUFFICIENT_BALANCE");
  }

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      withdrawableBalance: { decrement: amount },
      availableBalance: { decrement: amount },
      totalWithdrawn: { increment: amount },
      version: { increment: 1 },
    },
  });

  await appendLedgerEntry(tx, {
    userId,
    amount,
    type: "WITHDRAW",
    direction: "DEBIT",
    idempotencyKey,
    balanceAfter: Number(updated.availableBalance),
  });
}

/** @deprecated Use appendLedgerEntry — kept for cycle engine compatibility */
export async function recordIncome(
  tx: TransactionClient,
  input: RecordIncomeInput
): Promise<void> {
  await appendLedgerEntry(tx, input);
}

export async function creditTokens(
  tx: TransactionClient,
  userId: string,
  amount: number,
  idempotencyKey?: string
): Promise<void> {
  if (idempotencyKey) {
    const existing = await tx.tokenReward.findUnique({ where: { idempotencyKey } });
    if (existing) return;
  }

  await lockWallet(tx, userId);

  await tx.wallet.upsert({
    where: { userId },
    create: { userId, tokenBalance: amount },
    update: { tokenBalance: { increment: amount }, version: { increment: 1 } },
  });

  await appendLedgerEntry(tx, {
    userId,
    amount: 0,
    tokenAmount: amount,
    type: "TOKEN_AIRDROP",
    idempotencyKey,
  });
}

export async function lockWalletFunds(
  tx: TransactionClient,
  userId: string,
  amount: number
): Promise<void> {
  await lockWallet(tx, userId);

  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.availableBalance) < amount) {
    throw new AppError(400, "Insufficient balance to lock", "INSUFFICIENT_BALANCE");
  }

  await tx.wallet.update({
    where: { userId },
    data: {
      availableBalance: { decrement: amount },
      lockedBalance: { increment: amount },
      version: { increment: 1 },
    },
  });
}
