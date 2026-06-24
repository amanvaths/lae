-- =============================================================================
-- 14 Position Matrix MLM — PostgreSQL schema
-- Target: Node.js + Fastify backend indexing MatrixCore on BSC.
--
-- Design goals:
--   * Mirror on-chain state exactly so the DB is a verifiable projection.
--   * Idempotent event ingestion (chain log identity is unique).
--   * Reorg-safe (every row is tied to block_number / log_index / tx_hash).
--   * Fast reads for dashboards (matrix tree, income history, recycles, slots).
--
-- All token amounts are stored as NUMERIC(78,0) (wei-scale integers).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Indexer bookkeeping
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS indexer_state (
    id              SMALLINT PRIMARY KEY DEFAULT 1,
    contract_addr   TEXT        NOT NULL,
    chain_id        INTEGER     NOT NULL,
    last_block      BIGINT      NOT NULL DEFAULT 0,
    last_log_index  INTEGER     NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT indexer_state_singleton CHECK (id = 1)
);

-- Raw, deduplicated event log. Every processed log lands here first.
-- The (tx_hash, log_index) pair is globally unique => exactly-once ingestion.
CREATE TABLE IF NOT EXISTS chain_events (
    id              BIGSERIAL PRIMARY KEY,
    block_number    BIGINT      NOT NULL,
    block_hash      TEXT        NOT NULL,
    tx_hash         TEXT        NOT NULL,
    log_index       INTEGER     NOT NULL,
    event_name      TEXT        NOT NULL,
    payload         JSONB       NOT NULL,
    processed       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tx_hash, log_index)
);
CREATE INDEX IF NOT EXISTS idx_chain_events_block      ON chain_events (block_number);
CREATE INDEX IF NOT EXISTS idx_chain_events_name       ON chain_events (event_name);
CREATE INDEX IF NOT EXISTS idx_chain_events_unprocessed ON chain_events (processed) WHERE processed = FALSE;

-- ---------------------------------------------------------------------------
-- Users  (UserRegistered)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id          INTEGER PRIMARY KEY,          -- on-chain uint32 id (owner = 1)
    wallet           TEXT    NOT NULL UNIQUE,
    sponsor_id       INTEGER REFERENCES users(user_id),
    current_cycle    INTEGER NOT NULL DEFAULT 1,
    highest_slot     INTEGER NOT NULL DEFAULT 1,
    direct_referrals INTEGER NOT NULL DEFAULT 0,
    total_cycles     INTEGER NOT NULL DEFAULT 0,
    blocked          BOOLEAN NOT NULL DEFAULT FALSE,
    total_earned     NUMERIC(78,0) NOT NULL DEFAULT 0,
    registered_block BIGINT,
    registered_tx    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_sponsor ON users (sponsor_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet  ON users (lower(wallet));

-- ---------------------------------------------------------------------------
-- Cycles  (one row per user per cycle; updated by PositionFilled / CycleCompleted)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matrix_cycles (
    matrix_owner_id INTEGER NOT NULL REFERENCES users(user_id),
    cycle_id        INTEGER NOT NULL,
    filled          SMALLINT NOT NULL DEFAULT 0 CHECK (filled BETWEEN 0 AND 14),
    completed       BOOLEAN  NOT NULL DEFAULT FALSE,
    slot2_opened    BOOLEAN  NOT NULL DEFAULT FALSE,
    completed_block BIGINT,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (matrix_owner_id, cycle_id)
);
CREATE INDEX IF NOT EXISTS idx_cycles_open ON matrix_cycles (matrix_owner_id) WHERE completed = FALSE;

-- ---------------------------------------------------------------------------
-- Positions  (PositionFilled) — the authoritative placement record.
-- One row per (matrix owner, cycle, position). UNIQUE prevents duplicates.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matrix_positions (
    id              BIGSERIAL PRIMARY KEY,
    matrix_owner_id INTEGER  NOT NULL REFERENCES users(user_id),
    cycle_id        INTEGER  NOT NULL,
    position        SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 14),
    occupant_id     INTEGER  NOT NULL REFERENCES users(user_id),
    block_number    BIGINT   NOT NULL,
    tx_hash         TEXT     NOT NULL,
    log_index       INTEGER  NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (matrix_owner_id, cycle_id, position),   -- no duplicate placements
    UNIQUE (tx_hash, log_index)                     -- idempotent ingestion
);
CREATE INDEX IF NOT EXISTS idx_positions_owner    ON matrix_positions (matrix_owner_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_positions_occupant ON matrix_positions (occupant_id);

-- An entrant can only occupy ONE position in the whole system. Enforce it.
CREATE UNIQUE INDEX IF NOT EXISTS uq_positions_occupant_once ON matrix_positions (occupant_id);

-- ---------------------------------------------------------------------------
-- Income ledger  (IncomeDistributed / TreasuryIncome / LapsedIncome)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE income_kind AS ENUM ('user', 'treasury', 'lapsed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS income_events (
    id              BIGSERIAL PRIMARY KEY,
    kind            income_kind NOT NULL,
    from_user_id    INTEGER REFERENCES users(user_id),   -- entrant that funded it
    to_user_id      INTEGER REFERENCES users(user_id),   -- NULL for pure treasury
    matrix_owner_id INTEGER REFERENCES users(user_id),
    position        SMALLINT CHECK (position BETWEEN 1 AND 14),
    amount          NUMERIC(78,0) NOT NULL,
    block_number    BIGINT NOT NULL,
    tx_hash         TEXT   NOT NULL,
    log_index       INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tx_hash, log_index)
);
CREATE INDEX IF NOT EXISTS idx_income_to     ON income_events (to_user_id);
CREATE INDEX IF NOT EXISTS idx_income_from   ON income_events (from_user_id);
CREATE INDEX IF NOT EXISTS idx_income_kind   ON income_events (kind);
CREATE INDEX IF NOT EXISTS idx_income_block  ON income_events (block_number);

-- ---------------------------------------------------------------------------
-- Slots  (SlotOpened)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS slot_openings (
    id           BIGSERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(user_id),
    slot_id      INTEGER NOT NULL,
    block_number BIGINT  NOT NULL,
    tx_hash      TEXT    NOT NULL,
    log_index    INTEGER NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, slot_id),
    UNIQUE (tx_hash, log_index)
);

-- ---------------------------------------------------------------------------
-- Recycles  (CycleCompleted + RecycleStarted)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recycles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id),
    completed_cycle INTEGER NOT NULL,
    new_cycle       INTEGER NOT NULL,
    block_number    BIGINT  NOT NULL,
    tx_hash         TEXT    NOT NULL,
    log_index       INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, completed_cycle),
    UNIQUE (tx_hash, log_index)
);

-- ---------------------------------------------------------------------------
-- Global running totals (single row, updated transactionally) for reconciliation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS global_stats (
    id                     SMALLINT PRIMARY KEY DEFAULT 1,
    total_users            INTEGER NOT NULL DEFAULT 0,
    total_user_income      NUMERIC(78,0) NOT NULL DEFAULT 0,
    total_treasury_income  NUMERIC(78,0) NOT NULL DEFAULT 0,
    total_lapsed_income    NUMERIC(78,0) NOT NULL DEFAULT 0,
    total_entries          NUMERIC(78,0) NOT NULL DEFAULT 0,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT global_stats_singleton CHECK (id = 1)
);
INSERT INTO global_stats (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Reconciliation view: in == out must always hold
--   total_entries * X == user + treasury + lapsed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_fund_reconciliation AS
SELECT
    total_user_income,
    total_treasury_income,
    total_lapsed_income,
    (total_user_income + total_treasury_income + total_lapsed_income) AS total_out,
    total_entries AS total_in,
    (total_user_income + total_treasury_income + total_lapsed_income) = total_entries AS balanced
FROM global_stats;

COMMIT;
