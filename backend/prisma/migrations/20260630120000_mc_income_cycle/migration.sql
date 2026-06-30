-- Add cycle to income rows for board context (owner + spot + cycle).
ALTER TABLE "mc_income" ADD COLUMN IF NOT EXISTS "cycle_id" INTEGER;
ALTER TABLE "mc_income" ADD COLUMN IF NOT EXISTS "board_level" INTEGER;
