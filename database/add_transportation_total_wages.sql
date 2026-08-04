-- Migration: Add TotalWages column to Transportations table

ALTER TABLE "Transportations" 
    ADD COLUMN IF NOT EXISTS "TotalWages" NUMERIC(18, 2);

-- Populate existing rows where TotalWages is NULL
UPDATE "Transportations"
SET "TotalWages" = COALESCE("Wages", 0) * GREATEST(1, COALESCE("NoOfTip", 1))
WHERE "TotalWages" IS NULL AND "Wages" IS NOT NULL;
