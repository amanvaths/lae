-- Chain events table for decentralized contract indexer
CREATE TABLE IF NOT EXISTS "chain_events" (
    "id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "block_number" BIGINT,
    "event_name" TEXT NOT NULL,
    "wallet_address" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chain_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chain_events_tx_hash_log_index_key" ON "chain_events"("tx_hash", "log_index");
CREATE INDEX IF NOT EXISTS "chain_events_event_name_idx" ON "chain_events"("event_name");
CREATE INDEX IF NOT EXISTS "chain_events_wallet_address_idx" ON "chain_events"("wallet_address");
