-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');
CREATE TYPE "MatrixType" AS ENUM ('CLUB', 'PILOT');
CREATE TYPE "MatrixPosition" AS ENUM ('ROOT', 'LEFT', 'RIGHT', 'LEFT_CHILD', 'RIGHT_CHILD', 'SLOT_1', 'SLOT_2');
CREATE TYPE "PlacementType" AS ENUM ('DIRECT', 'SPILLOVER');
CREATE TYPE "MatrixEntryStatus" AS ENUM ('ACTIVE', 'CYCLE_COMPLETE', 'REBIRTH', 'UPGRADED');
CREATE TYPE "IncomeType" AS ENUM ('DIRECT', 'SPILLOVER', 'CYCLE', 'REBIRTH', 'UPGRADE', 'BONUS', 'STAKING', 'WITHDRAW', 'DEPOSIT', 'TOKEN_AIRDROP', 'SPIN_REWARD', 'WOM_REWARD', 'PILOT_CYCLE');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');
CREATE TYPE "BlockchainTxType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'REWARD');
CREATE TYPE "SpinRewardType" AS ENUM ('NO_TOKEN', 'TOKEN_10', 'TOKEN_200', 'TOKEN_2000', 'TOKEN_10000', 'TOKEN_100000');
CREATE TYPE "WomSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "StakeStatus" AS ENUM ('ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "IdempotencyStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "sponsor_id" TEXT,
    "referral_code" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "available_balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "locked_balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "withdrawable_balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "total_withdrawn" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "token_balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_club_packages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "package_level" INTEGER NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "cycles_completed" INTEGER NOT NULL DEFAULT 0,
    "tx_hash" TEXT,

    CONSTRAINT "user_club_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "club_matrices" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "package_level" INTEGER NOT NULL,
    "status" "MatrixEntryStatus" NOT NULL DEFAULT 'ACTIVE',
    "cycle_number" INTEGER NOT NULL DEFAULT 1,
    "is_rebirth" BOOLEAN NOT NULL DEFAULT false,
    "parent_matrix_id" TEXT,
    "slots_filled" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "club_matrices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "matrix_placements" (
    "id" TEXT NOT NULL,
    "matrix_id" TEXT NOT NULL,
    "matrix_type" "MatrixType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "position" "MatrixPosition" NOT NULL,
    "placement_type" "PlacementType" NOT NULL,
    "spillover_from" TEXT,
    "sponsor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matrix_placements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_pilot_packages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "package_level" INTEGER NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "cycles_completed" INTEGER NOT NULL DEFAULT 0,
    "tx_hash" TEXT,

    CONSTRAINT "user_pilot_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pilot_matrices" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "package_level" INTEGER NOT NULL,
    "status" "MatrixEntryStatus" NOT NULL DEFAULT 'ACTIVE',
    "cycle_number" INTEGER NOT NULL DEFAULT 1,
    "is_rebirth" BOOLEAN NOT NULL DEFAULT false,
    "parent_matrix_id" TEXT,
    "slots_filled" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "pilot_matrices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pilot_slots" (
    "id" TEXT NOT NULL,
    "matrix_id" TEXT NOT NULL,
    "user_id" TEXT,
    "position" "MatrixPosition" NOT NULL,
    "placement_type" "PlacementType",
    "filled_at" TIMESTAMP(3),

    CONSTRAINT "pilot_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "income_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "IncomeType" NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "token_amount" DECIMAL(36,18),
    "package_level" INTEGER,
    "matrix_type" "MatrixType",
    "source_user_id" TEXT,
    "matrix_id" TEXT,
    "tx_hash" TEXT,
    "idempotency_key" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_ledger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blockchain_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "BlockchainTxType" NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" BIGINT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "package_level" INTEGER,
    "matrix_type" "MatrixType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "tx_hash" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "token_rewards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "reward_type" TEXT NOT NULL,
    "package_level" INTEGER,
    "matrix_type" "MatrixType",
    "source_user_id" TEXT,
    "tx_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_rewards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spin_coupons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spin_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "reward_type" "SpinRewardType" NOT NULL,
    "token_amount" DECIMAL(36,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wom_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "social_link" TEXT NOT NULL,
    "content_link" TEXT,
    "screenshot" TEXT,
    "status" "WomSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wom_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wom_rewards" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "dai_amount" DECIMAL(36,18) NOT NULL,
    "token_amount" DECIMAL(36,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wom_rewards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stakes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "lock_start" TIMESTAMP(3) NOT NULL,
    "lock_end" TIMESTAMP(3) NOT NULL,
    "reward_amount" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "status" "StakeStatus" NOT NULL DEFAULT 'LOCKED',
    "round" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "stakes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");
CREATE INDEX "users_sponsor_id_idx" ON "users"("sponsor_id");
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");
CREATE INDEX "users_status_idx" ON "users"("status");

CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

CREATE UNIQUE INDEX "user_club_packages_user_id_package_level_key" ON "user_club_packages"("user_id", "package_level");
CREATE INDEX "user_club_packages_user_id_idx" ON "user_club_packages"("user_id");
CREATE INDEX "user_club_packages_package_level_idx" ON "user_club_packages"("package_level");

CREATE INDEX "club_matrices_owner_id_idx" ON "club_matrices"("owner_id");
CREATE INDEX "club_matrices_package_level_idx" ON "club_matrices"("package_level");
CREATE INDEX "club_matrices_status_idx" ON "club_matrices"("status");
CREATE INDEX "club_matrices_owner_id_package_level_status_idx" ON "club_matrices"("owner_id", "package_level", "status");

CREATE UNIQUE INDEX "matrix_placements_matrix_id_position_key" ON "matrix_placements"("matrix_id", "position");
CREATE INDEX "matrix_placements_user_id_idx" ON "matrix_placements"("user_id");
CREATE INDEX "matrix_placements_matrix_type_idx" ON "matrix_placements"("matrix_type");
CREATE INDEX "matrix_placements_sponsor_id_idx" ON "matrix_placements"("sponsor_id");

CREATE UNIQUE INDEX "user_pilot_packages_user_id_package_level_key" ON "user_pilot_packages"("user_id", "package_level");
CREATE INDEX "user_pilot_packages_user_id_idx" ON "user_pilot_packages"("user_id");

CREATE INDEX "pilot_matrices_owner_id_idx" ON "pilot_matrices"("owner_id");
CREATE INDEX "pilot_matrices_package_level_idx" ON "pilot_matrices"("package_level");
CREATE INDEX "pilot_matrices_status_idx" ON "pilot_matrices"("status");

CREATE UNIQUE INDEX "pilot_slots_matrix_id_position_key" ON "pilot_slots"("matrix_id", "position");
CREATE INDEX "pilot_slots_user_id_idx" ON "pilot_slots"("user_id");

CREATE UNIQUE INDEX "income_ledger_idempotency_key_key" ON "income_ledger"("idempotency_key");
CREATE INDEX "income_ledger_user_id_idx" ON "income_ledger"("user_id");
CREATE INDEX "income_ledger_type_idx" ON "income_ledger"("type");
CREATE INDEX "income_ledger_created_at_idx" ON "income_ledger"("created_at");
CREATE INDEX "income_ledger_user_id_type_idx" ON "income_ledger"("user_id", "type");

CREATE UNIQUE INDEX "blockchain_transactions_tx_hash_key" ON "blockchain_transactions"("tx_hash");
CREATE INDEX "blockchain_transactions_user_id_idx" ON "blockchain_transactions"("user_id");
CREATE INDEX "blockchain_transactions_status_idx" ON "blockchain_transactions"("status");
CREATE INDEX "blockchain_transactions_type_idx" ON "blockchain_transactions"("type");

CREATE INDEX "withdrawal_requests_user_id_idx" ON "withdrawal_requests"("user_id");
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

CREATE INDEX "token_rewards_user_id_idx" ON "token_rewards"("user_id");
CREATE INDEX "token_rewards_reward_type_idx" ON "token_rewards"("reward_type");

CREATE INDEX "spin_coupons_user_id_used_idx" ON "spin_coupons"("user_id", "used");
CREATE INDEX "spin_history_user_id_idx" ON "spin_history"("user_id");

CREATE INDEX "wom_submissions_user_id_idx" ON "wom_submissions"("user_id");
CREATE INDEX "wom_submissions_status_idx" ON "wom_submissions"("status");
CREATE INDEX "wom_rewards_submission_id_idx" ON "wom_rewards"("submission_id");

CREATE INDEX "stakes_user_id_idx" ON "stakes"("user_id");
CREATE INDEX "stakes_status_idx" ON "stakes"("status");

CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_club_packages" ADD CONSTRAINT "user_club_packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_matrices" ADD CONSTRAINT "club_matrices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_matrices" ADD CONSTRAINT "club_matrices_parent_matrix_id_fkey" FOREIGN KEY ("parent_matrix_id") REFERENCES "club_matrices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matrix_placements" ADD CONSTRAINT "matrix_placements_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "club_matrices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "matrix_placements" ADD CONSTRAINT "matrix_placements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_pilot_packages" ADD CONSTRAINT "user_pilot_packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pilot_matrices" ADD CONSTRAINT "pilot_matrices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pilot_matrices" ADD CONSTRAINT "pilot_matrices_parent_matrix_id_fkey" FOREIGN KEY ("parent_matrix_id") REFERENCES "pilot_matrices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pilot_slots" ADD CONSTRAINT "pilot_slots_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "pilot_matrices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "income_ledger" ADD CONSTRAINT "income_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blockchain_transactions" ADD CONSTRAINT "blockchain_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "token_rewards" ADD CONSTRAINT "token_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spin_coupons" ADD CONSTRAINT "spin_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spin_history" ADD CONSTRAINT "spin_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wom_submissions" ADD CONSTRAINT "wom_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wom_rewards" ADD CONSTRAINT "wom_rewards_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "wom_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stakes" ADD CONSTRAINT "stakes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
