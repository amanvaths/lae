-- Migration: production hardening — materialized path, audit fields, append-only ledger, idempotency

-- New enums
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "IdempotencyOperation" AS ENUM (
  'PACKAGE_PURCHASE', 'CYCLE_COMPLETION', 'INCOME_DISTRIBUTION',
  'REBIRTH_CREATION', 'AUTO_UPGRADE', 'WITHDRAWAL', 'TOKEN_REWARD', 'PLACEMENT'
);
CREATE TYPE "MatrixOperationType" AS ENUM (
  'PLACEMENT', 'CYCLE_COMPLETION', 'INCOME_DISTRIBUTION', 'REBIRTH', 'AUTO_UPGRADE', 'SPILLOVER'
);

-- Users: materialized path + soft delete + audit
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tree_path" TEXT NOT NULL DEFAULT '/';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tree_depth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_by" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_by" TEXT;
CREATE INDEX IF NOT EXISTS "users_tree_path_idx" ON "users"("tree_path");
CREATE INDEX IF NOT EXISTS "users_tree_depth_idx" ON "users"("tree_depth");
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX IF NOT EXISTS "users_sponsor_id_deleted_at_idx" ON "users"("sponsor_id", "deleted_at");

-- Wallets: optimistic locking version
ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;

-- Package purchases (idempotent)
CREATE TABLE IF NOT EXISTS "package_purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "package_level" INTEGER NOT NULL,
    "matrix_type" "MatrixType" NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "tx_hash" TEXT,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "package_purchases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "package_purchases_idempotency_key_key" ON "package_purchases"("idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "package_purchases_user_id_package_level_matrix_type_key" ON "package_purchases"("user_id", "package_level", "matrix_type");
CREATE INDEX IF NOT EXISTS "package_purchases_user_id_idx" ON "package_purchases"("user_id");
ALTER TABLE "package_purchases" ADD CONSTRAINT "package_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Soft delete + audit on packages
ALTER TABLE "user_club_packages" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_club_packages" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_club_packages" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "user_pilot_packages" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_pilot_packages" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_pilot_packages" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Matrices: version + soft delete + audit
ALTER TABLE "club_matrices" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "club_matrices" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "club_matrices" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "pilot_matrices" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pilot_matrices" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "pilot_matrices" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Placements: idempotency
ALTER TABLE "matrix_placements" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "matrix_placements_idempotency_key_key" ON "matrix_placements"("idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "matrix_placements_user_id_matrix_type_matrix_id_key" ON "matrix_placements"("user_id", "matrix_type", "matrix_id");

ALTER TABLE "pilot_slots" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
ALTER TABLE "pilot_slots" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS "pilot_slots_idempotency_key_key" ON "pilot_slots"("idempotency_key");

-- Append-only ledger enhancements
ALTER TABLE "income_ledger" ADD COLUMN IF NOT EXISTS "sequence_num" BIGSERIAL;
ALTER TABLE "income_ledger" ADD COLUMN IF NOT EXISTS "direction" "LedgerDirection" NOT NULL DEFAULT 'CREDIT';
ALTER TABLE "income_ledger" ADD COLUMN IF NOT EXISTS "balance_after" DECIMAL(36,18);
CREATE INDEX IF NOT EXISTS "income_ledger_sequence_num_idx" ON "income_ledger"("sequence_num");
CREATE INDEX IF NOT EXISTS "income_ledger_user_id_sequence_num_idx" ON "income_ledger"("user_id", "sequence_num");

-- Matrix operation audit log
CREATE TABLE IF NOT EXISTS "matrix_operation_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "operation" "MatrixOperationType" NOT NULL,
    "matrix_type" "MatrixType" NOT NULL,
    "matrix_id" TEXT,
    "package_level" INTEGER,
    "idempotency_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matrix_operation_logs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "matrix_operation_logs_idempotency_key_key" ON "matrix_operation_logs"("idempotency_key");
CREATE INDEX IF NOT EXISTS "matrix_operation_logs_user_id_idx" ON "matrix_operation_logs"("user_id");
CREATE INDEX IF NOT EXISTS "matrix_operation_logs_operation_idx" ON "matrix_operation_logs"("operation");
ALTER TABLE "matrix_operation_logs" ADD CONSTRAINT "matrix_operation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Idempotency keys: operation type
ALTER TABLE "idempotency_keys" ADD COLUMN IF NOT EXISTS "operation" "IdempotencyOperation" NOT NULL DEFAULT 'PACKAGE_PURCHASE';
CREATE INDEX IF NOT EXISTS "idempotency_keys_operation_status_idx" ON "idempotency_keys"("operation", "status");

-- Token rewards + withdrawals idempotency
ALTER TABLE "token_rewards" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "token_rewards_idempotency_key_key" ON "token_rewards"("idempotency_key");
ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS "withdrawal_requests_idempotency_key_key" ON "withdrawal_requests"("idempotency_key");
ALTER TABLE "blockchain_transactions" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "blockchain_transactions_idempotency_key_key" ON "blockchain_transactions"("idempotency_key");
ALTER TABLE "spin_history" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "spin_history_idempotency_key_key" ON "spin_history"("idempotency_key");
ALTER TABLE "wom_rewards" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "wom_rewards_idempotency_key_key" ON "wom_rewards"("idempotency_key");

-- Leaderboard materialized cache table
CREATE TABLE IF NOT EXISTS "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_earned" DECIMAL(36,18) NOT NULL,
    "direct_count" INTEGER NOT NULL DEFAULT 0,
    "team_size" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "leaderboard_entries_user_id_key" ON "leaderboard_entries"("user_id");
CREATE INDEX IF NOT EXISTS "leaderboard_entries_rank_idx" ON "leaderboard_entries"("rank");
CREATE INDEX IF NOT EXISTS "leaderboard_entries_total_earned_idx" ON "leaderboard_entries"("total_earned" DESC);

-- Stakes audit
ALTER TABLE "stakes" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "wom_submissions" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Prevent updates/deletes on immutable ledger (append-only enforcement)
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'income_ledger is append-only: updates and deletes are forbidden';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS income_ledger_immutable ON income_ledger;
CREATE TRIGGER income_ledger_immutable
  BEFORE UPDATE OR DELETE ON income_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
