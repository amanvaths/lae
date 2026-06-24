-- LAEClubMatrix: add level dimension to mc_* tables

-- mc_cycles: add level to primary key
ALTER TABLE "mc_cycles" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "mc_cycles" DROP CONSTRAINT IF EXISTS "mc_cycles_pkey";
ALTER TABLE "mc_cycles" ADD PRIMARY KEY ("matrix_owner_id", "level", "cycle_id");

-- mc_positions: add level, drop global occupant unique
ALTER TABLE "mc_positions" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "mc_positions" DROP CONSTRAINT IF EXISTS "mc_positions_occupant_id_key";
DROP INDEX IF EXISTS "mc_positions_matrix_owner_id_cycle_id_idx";
CREATE INDEX IF NOT EXISTS "mc_positions_matrix_owner_id_level_cycle_id_idx"
  ON "mc_positions"("matrix_owner_id", "level", "cycle_id");
CREATE INDEX IF NOT EXISTS "mc_positions_occupant_id_idx" ON "mc_positions"("occupant_id");

-- mc_income: add level
ALTER TABLE "mc_income" ADD COLUMN IF NOT EXISTS "level" INTEGER;

-- mc_recycles: add level, update unique
ALTER TABLE "mc_recycles" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "mc_recycles" DROP CONSTRAINT IF EXISTS "mc_recycles_user_id_completed_cycle_key";
CREATE UNIQUE INDEX IF NOT EXISTS "mc_recycles_user_id_level_completed_cycle_key"
  ON "mc_recycles"("user_id", "level", "completed_cycle");
