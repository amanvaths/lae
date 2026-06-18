import type { TransactionClient } from "./prisma.js";
import { AppError } from "../utils/helpers.js";

/** Row-level lock: club matrix — prevents concurrent placement / cycle race */
export async function lockClubMatrix(tx: TransactionClient, matrixId: string): Promise<void> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM club_matrices
    WHERE id = ${matrixId} AND deleted_at IS NULL
    FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new AppError(404, "Club matrix not found", "MATRIX_NOT_FOUND");
  }
}

/** Row-level lock: pilot matrix */
export async function lockPilotMatrix(tx: TransactionClient, matrixId: string): Promise<void> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM pilot_matrices
    WHERE id = ${matrixId} AND deleted_at IS NULL
    FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new AppError(404, "Pilot matrix not found", "MATRIX_NOT_FOUND");
  }
}

/** Row-level lock: user wallet — prevents double payout / double withdraw */
export async function lockWallet(tx: TransactionClient, userId: string): Promise<void> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM wallets WHERE user_id = ${userId} FOR UPDATE
  `;
  if (rows.length === 0) {
    await tx.wallet.create({ data: { userId } });
    await tx.$queryRaw`SELECT id FROM wallets WHERE user_id = ${userId} FOR UPDATE`;
  }
}

/** Row-level lock: user club package */
export async function lockClubPackage(
  tx: TransactionClient,
  userId: string,
  packageLevel: number
): Promise<void> {
  await tx.$queryRaw`
    SELECT id FROM user_club_packages
    WHERE user_id = ${userId} AND package_level = ${packageLevel} AND deleted_at IS NULL
    FOR UPDATE
  `;
}

/** Row-level lock: withdrawal request */
export async function lockWithdrawal(tx: TransactionClient, withdrawalId: string): Promise<void> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM withdrawal_requests WHERE id = ${withdrawalId} FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new AppError(404, "Withdrawal not found", "WITHDRAWAL_NOT_FOUND");
  }
}
