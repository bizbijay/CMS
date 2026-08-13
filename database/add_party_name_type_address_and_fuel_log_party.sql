-- =============================================================================
-- Migration: Add Type and Address to PartyNames, and PartyNameId / PartyNameOther
--            to FuelLogs.
-- Apply this to any existing CMS database (local or Supabase).
-- Safe to run multiple times — uses IF NOT EXISTS / IF EXISTS guards.
-- =============================================================================

BEGIN;

-- 1. Add Type (petrol_pump | other) and Address to PartyNames
ALTER TABLE "PartyNames"
    ADD COLUMN IF NOT EXISTS "Type" character varying(50) NOT NULL DEFAULT 'other';

ALTER TABLE "PartyNames"
    ADD COLUMN IF NOT EXISTS "Address" character varying(500);

-- 2. Backfill any legacy rows that were created before the Type column existed
UPDATE "PartyNames"
SET "Type" = 'other'
WHERE "Type" IS NULL OR "Type" = '';

-- 3. Add free-text fallback for Party Name on FuelLogs
ALTER TABLE "FuelLogs"
    ADD COLUMN IF NOT EXISTS "PartyNameOther" character varying(200);

-- 4. Add PartyNameId FK on FuelLogs (nullable; either the FK or free text is set)
ALTER TABLE "FuelLogs"
    ADD COLUMN IF NOT EXISTS "PartyNameId" INT;

ALTER TABLE "FuelLogs"
    DROP CONSTRAINT IF EXISTS "FK_FuelLogs_PartyNames_PartyNameId";

ALTER TABLE "FuelLogs"
    ADD CONSTRAINT "FK_FuelLogs_PartyNames_PartyNameId"
    FOREIGN KEY ("PartyNameId")
    REFERENCES "PartyNames"("Id")
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "IX_FuelLogs_PartyNameId"
    ON "FuelLogs" ("PartyNameId");

-- 5. Register the migration in EF history so `dotnet ef database update` won't re-run it
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId"    character varying(150) NOT NULL,
    "ProductVersion" character varying(32)  NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260813000001_AddPartyNameTypeAddress', '8.0.10')
ON CONFLICT DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260813000002_AddPartyNameToFuelLogs', '8.0.10')
ON CONFLICT DO NOTHING;

COMMIT;
