-- MatrixCore indexer tables (replaces legacy idx_lae_* tables)

DROP TABLE IF EXISTS idx_lae_matrix_slots;
DROP TABLE IF EXISTS idx_lae_placements;
DROP TABLE IF EXISTS idx_lae_incomes;
DROP TABLE IF EXISTS idx_lae_users;

CREATE TABLE IF NOT EXISTS mc_users (
    user_id          INTEGER PRIMARY KEY,
    wallet_address   TEXT NOT NULL UNIQUE,
    sponsor_id       INTEGER,
    current_cycle    INTEGER NOT NULL DEFAULT 1,
    highest_slot     INTEGER NOT NULL DEFAULT 1,
    direct_referrals INTEGER NOT NULL DEFAULT 0,
    total_earned     DECIMAL(36,18) NOT NULL DEFAULT 0,
    total_cycles     INTEGER NOT NULL DEFAULT 0,
    registered_block BIGINT NOT NULL,
    registered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mc_users_sponsor_idx ON mc_users (sponsor_id);

CREATE TABLE IF NOT EXISTS mc_cycles (
    matrix_owner_id INTEGER NOT NULL,
    cycle_id        INTEGER NOT NULL,
    filled          INTEGER NOT NULL DEFAULT 0,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    slot2_opened    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (matrix_owner_id, cycle_id)
);

CREATE TABLE IF NOT EXISTS mc_positions (
    id              TEXT PRIMARY KEY,
    matrix_owner_id INTEGER NOT NULL,
    cycle_id        INTEGER NOT NULL,
    position        INTEGER NOT NULL,
    occupant_id     INTEGER NOT NULL UNIQUE,
    block_number    BIGINT NOT NULL,
    tx_hash         TEXT NOT NULL,
    log_index       INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (matrix_owner_id, cycle_id, position),
    UNIQUE (tx_hash, log_index)
);
CREATE INDEX IF NOT EXISTS mc_positions_owner_idx ON mc_positions (matrix_owner_id, cycle_id);

CREATE TABLE IF NOT EXISTS mc_income (
    id              TEXT PRIMARY KEY,
    kind            TEXT NOT NULL,
    from_user_id    INTEGER,
    to_user_id      INTEGER,
    matrix_owner_id INTEGER,
    position        INTEGER,
    amount          DECIMAL(36,18) NOT NULL,
    block_number    BIGINT NOT NULL,
    tx_hash         TEXT NOT NULL,
    log_index       INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS mc_recycles (
    id              TEXT PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    completed_cycle INTEGER NOT NULL,
    new_cycle       INTEGER NOT NULL,
    block_number    BIGINT NOT NULL,
    tx_hash         TEXT NOT NULL,
    log_index       INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, completed_cycle),
    UNIQUE (tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS mc_slot_openings (
    id           TEXT PRIMARY KEY,
    user_id      INTEGER NOT NULL,
    slot_id      INTEGER NOT NULL,
    block_number BIGINT NOT NULL,
    tx_hash      TEXT NOT NULL,
    log_index    INTEGER NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, slot_id),
    UNIQUE (tx_hash, log_index)
);
