-- Analytics indexer tables (on-chain source of truth)
-- Legacy MLM tables remain but are no longer written by the backend.

CREATE TABLE IF NOT EXISTS "indexer_state" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "chain_id" INTEGER NOT NULL,
    "last_block" BIGINT NOT NULL DEFAULT 0,
    "last_block_hash" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "idx_users" (
    "wallet_address" TEXT NOT NULL,
    "sponsor_address" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL,
    "registered_block" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_users_pkey" PRIMARY KEY ("wallet_address")
);

CREATE TABLE IF NOT EXISTS "idx_referrals" (
    "id" TEXT NOT NULL,
    "sponsor_address" TEXT NOT NULL,
    "referral_address" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_referrals_tx_hash_log_index_key" ON "idx_referrals"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_referrals_sponsor_address_idx" ON "idx_referrals"("sponsor_address");

CREATE TABLE IF NOT EXISTS "idx_club_matrices" (
    "id" TEXT NOT NULL,
    "matrix_id" BIGINT NOT NULL,
    "owner_address" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "event_name" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_club_matrices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_club_matrices_tx_log_key" ON "idx_club_matrices"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_club_matrices_owner_idx" ON "idx_club_matrices"("owner_address");
CREATE INDEX IF NOT EXISTS "idx_club_matrices_matrix_id_idx" ON "idx_club_matrices"("matrix_id");

CREATE TABLE IF NOT EXISTS "idx_pilot_matrices" (
    "id" TEXT NOT NULL,
    "matrix_id" BIGINT NOT NULL,
    "owner_address" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "event_name" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_pilot_matrices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_pilot_matrices_tx_log_key" ON "idx_pilot_matrices"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_pilot_matrices_owner_idx" ON "idx_pilot_matrices"("owner_address");

CREATE TABLE IF NOT EXISTS "idx_transactions" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_transactions_tx_log_key" ON "idx_transactions"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_transactions_wallet_idx" ON "idx_transactions"("wallet_address");

CREATE TABLE IF NOT EXISTS "idx_incomes" (
    "id" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "payer_address" TEXT,
    "income_type" INTEGER NOT NULL,
    "matrix_type" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_incomes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_incomes_tx_log_key" ON "idx_incomes"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_incomes_recipient_idx" ON "idx_incomes"("recipient_address");

CREATE TABLE IF NOT EXISTS "idx_token_rewards" (
    "id" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "source_address" TEXT,
    "reward_type" INTEGER NOT NULL,
    "matrix_type" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "slt_amount" DECIMAL(36,18) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_token_rewards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_token_rewards_tx_log_key" ON "idx_token_rewards"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_token_rewards_recipient_idx" ON "idx_token_rewards"("recipient_address");

CREATE TABLE IF NOT EXISTS "idx_withdrawals" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "withdraw_ref" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_withdrawals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_withdrawals_tx_log_key" ON "idx_withdrawals"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_withdrawals_wallet_idx" ON "idx_withdrawals"("wallet_address");

CREATE TABLE IF NOT EXISTS "idx_spins" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "slt_amount" DECIMAL(36,18) NOT NULL,
    "nonce" BIGINT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_spins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_spins_tx_log_key" ON "idx_spins"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_spins_wallet_idx" ON "idx_spins"("wallet_address");

CREATE TABLE IF NOT EXISTS "idx_stakes" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "stake_index" BIGINT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "lock_end" BIGINT NOT NULL,
    "released" BOOLEAN NOT NULL DEFAULT false,
    "event_name" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idx_stakes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_stakes_tx_log_key" ON "idx_stakes"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "idx_stakes_wallet_idx" ON "idx_stakes"("wallet_address");

-- Rename chain_events view alias: event_logs is served via existing chain_events table
