-- Requires add_maintenance_parts.sql to have been run first.
-- Converts VehicleMaintenanceParts.PartName (free text) to MaintenancePartId (FK).

-- Step 1: Add the FK column (nullable initially to allow backfilling existing rows)
ALTER TABLE "VehicleMaintenanceParts"
    ADD COLUMN IF NOT EXISTS "MaintenancePartId" INTEGER
        REFERENCES "MaintenanceParts"("Id") ON DELETE RESTRICT;

-- Step 2: If there are existing rows, backfill MaintenancePartId here before continuing.
--         Example (insert matching master parts then set the FK):
--   INSERT INTO "MaintenanceParts" ("Name", "CreatedAt")
--     SELECT DISTINCT "PartName", NOW() FROM "VehicleMaintenanceParts" WHERE "IsDeleted" = FALSE
--     ON CONFLICT DO NOTHING;
--   UPDATE "VehicleMaintenanceParts" vmp
--     SET "MaintenancePartId" = mp."Id"
--     FROM "MaintenanceParts" mp
--     WHERE mp."Name" = vmp."PartName";

-- Step 3: Enforce NOT NULL once all rows have a valid MaintenancePartId
ALTER TABLE "VehicleMaintenanceParts"
    ALTER COLUMN "MaintenancePartId" SET NOT NULL;

-- Step 4: Drop the old free-text column
ALTER TABLE "VehicleMaintenanceParts"
    DROP COLUMN IF EXISTS "PartName";

-- Step 5: Index for join performance
CREATE INDEX IF NOT EXISTS "IX_VehicleMaintenanceParts_MaintenancePartId"
    ON "VehicleMaintenanceParts"("MaintenancePartId");
