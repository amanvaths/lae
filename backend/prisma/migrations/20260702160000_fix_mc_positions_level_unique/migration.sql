-- Fix mc_positions composite unique to include `level`.
--
-- The original matrix_core migration created:
--     UNIQUE (matrix_owner_id, cycle_id, position)   -- constraint: mc_positions_matrix_owner_id_cycle_id_position_key
-- The later "add level" migration (20260624180000) added the `level` column and
-- dropped the occupant_id unique, but NEVER updated this composite unique to
-- include `level`. Meanwhile the Prisma schema declares
--     @@unique([matrixOwnerId, level, cycleId, position])
-- so every mc_positions upsert emits `ON CONFLICT (matrix_owner_id, level, cycle_id, position)`,
-- which has no matching constraint in the DB → Postgres errors on EVERY insert.
-- The indexer's receipt-sync swallows that error, so mc_positions stayed empty
-- (mc_cycles / mc_income were unaffected because their keys were migrated correctly).
--
-- This migration drops the stale 3-column unique and creates the correct
-- 4-column unique (matching the Prisma-generated constraint name).

ALTER TABLE "mc_positions"
  DROP CONSTRAINT IF EXISTS "mc_positions_matrix_owner_id_cycle_id_position_key";
DROP INDEX IF EXISTS "mc_positions_matrix_owner_id_cycle_id_position_key";

CREATE UNIQUE INDEX IF NOT EXISTS "mc_positions_matrix_owner_id_level_cycle_id_position_key"
  ON "mc_positions" ("matrix_owner_id", "level", "cycle_id", "position");
