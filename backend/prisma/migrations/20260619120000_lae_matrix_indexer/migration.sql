-- LAE Club / BTitan matrix indexer tables

CREATE TABLE "idx_lae_users" (
    "wallet_address" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sponsor_id" INTEGER,
    "team_size" INTEGER NOT NULL DEFAULT 0,
    "total_income" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "registered_at" TIMESTAMP(3) NOT NULL,
    "registered_block" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idx_lae_users_pkey" PRIMARY KEY ("wallet_address")
);

CREATE UNIQUE INDEX "idx_lae_users_user_id_key" ON "idx_lae_users"("user_id");
CREATE INDEX "idx_lae_users_sponsor_id_idx" ON "idx_lae_users"("sponsor_id");

CREATE TABLE "idx_lae_incomes" (
    "id" TEXT NOT NULL,
    "receiver_user_id" INTEGER NOT NULL,
    "receiver_address" TEXT,
    "from_user_id" INTEGER,
    "level" INTEGER NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "income_kind" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idx_lae_incomes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idx_lae_incomes_tx_hash_log_index_key" ON "idx_lae_incomes"("tx_hash", "log_index");
CREATE INDEX "idx_lae_incomes_receiver_user_id_idx" ON "idx_lae_incomes"("receiver_user_id");
CREATE INDEX "idx_lae_incomes_receiver_address_idx" ON "idx_lae_incomes"("receiver_address");
CREATE INDEX "idx_lae_incomes_income_kind_idx" ON "idx_lae_incomes"("income_kind");

CREATE TABLE "idx_lae_placements" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "referrer_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "cycle" INTEGER NOT NULL,
    "spot" INTEGER NOT NULL,
    "block_number" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idx_lae_placements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idx_lae_placements_tx_hash_log_index_key" ON "idx_lae_placements"("tx_hash", "log_index");
CREATE INDEX "idx_lae_placements_user_id_idx" ON "idx_lae_placements"("user_id");
CREATE INDEX "idx_lae_placements_referrer_id_idx" ON "idx_lae_placements"("referrer_id");
CREATE INDEX "idx_lae_placements_level_idx" ON "idx_lae_placements"("level");
