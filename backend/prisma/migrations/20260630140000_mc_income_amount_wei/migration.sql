-- Store matrix income amounts as wei integers (L12+ slot-14 exceeds Decimal(36,18)).
ALTER TABLE "mc_income" ALTER COLUMN "amount" TYPE DECIMAL(78,0);
