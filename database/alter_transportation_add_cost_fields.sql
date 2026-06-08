-- Add MaterialCost, Tax, and Wages columns to Transportations table
ALTER TABLE "Transportations"
ADD COLUMN "MaterialCost" NUMERIC(18, 2) NULL,
ADD COLUMN "Tax"          NUMERIC(18, 2) NULL,
ADD COLUMN "Wages"        NUMERIC(18, 2) NULL;

COMMENT ON COLUMN "Transportations"."MaterialCost" IS 'Cost of materials transported (NRS)';
COMMENT ON COLUMN "Transportations"."Tax"          IS 'Tax amount for the transportation entry (NRS)';
COMMENT ON COLUMN "Transportations"."Wages"        IS 'Wages paid for the transportation entry (NRS)';
