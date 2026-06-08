-- Add PanNumber column to Vendors table
ALTER TABLE "Vendors"
ADD COLUMN "PanNumber" VARCHAR(20) NULL;

-- Add comment for documentation (optional, for PostgreSQL)
COMMENT ON COLUMN "Vendors"."PanNumber" IS 'PAN (Permanent Account Number) of the vendor';
