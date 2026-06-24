-- Legacy matrix slot snapshot (superseded by MatrixCore mc_positions)

CREATE TABLE "idx_lae_matrix_slots" (
    "id" TEXT NOT NULL,
    "referrer_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "cycle" INTEGER NOT NULL,
    "spot" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "block_number" BIGINT,
    "tx_hash" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idx_lae_matrix_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idx_lae_matrix_slots_referrer_id_level_cycle_spot_key" ON "idx_lae_matrix_slots"("referrer_id", "level", "cycle", "spot");
CREATE INDEX "idx_lae_matrix_slots_referrer_id_level_idx" ON "idx_lae_matrix_slots"("referrer_id", "level");
CREATE INDEX "idx_lae_matrix_slots_user_id_idx" ON "idx_lae_matrix_slots"("user_id");
