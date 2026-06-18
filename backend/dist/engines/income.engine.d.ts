import type { Prisma, IncomeType, MatrixType, LedgerDirection } from "@prisma/client";
import type { TransactionClient } from "../lib/prisma.js";
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
export declare function appendLedgerEntry(tx: TransactionClient, input: RecordIncomeInput): Promise<void>;
export declare function creditWallet(tx: TransactionClient, input: CreditWalletInput): Promise<void>;
export declare function debitWithdrawable(tx: TransactionClient, userId: string, amount: number, idempotencyKey?: string): Promise<void>;
/** @deprecated Use appendLedgerEntry — kept for cycle engine compatibility */
export declare function recordIncome(tx: TransactionClient, input: RecordIncomeInput): Promise<void>;
export declare function creditTokens(tx: TransactionClient, userId: string, amount: number, idempotencyKey?: string): Promise<void>;
export declare function lockWalletFunds(tx: TransactionClient, userId: string, amount: number): Promise<void>;
//# sourceMappingURL=income.engine.d.ts.map