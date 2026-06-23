-- =============================================================================
-- Migration: Add TransportedByOther, VehicleOther, Quantity, PerUnitCost
--            to Transportations table.
-- Apply this to any existing CMS database (local or Supabase).
-- Safe to run multiple times — uses IF NOT EXISTS / IF EXISTS guards.
-- =============================================================================

BEGIN;

-- 1. Make TransportedById nullable so manual-entry records don't need a user FK
ALTER TABLE "Transportations"
    ALTER COLUMN "TransportedById" DROP NOT NULL;

-- 2. Add free-text fallback for Transported By
ALTER TABLE "Transportations"
    ADD COLUMN IF NOT EXISTS "TransportedByOther" character varying(200);

-- 3. Add free-text fallback for Vehicle
ALTER TABLE "Transportations"
    ADD COLUMN IF NOT EXISTS "VehicleOther" character varying(200);

-- 4. Drop old RESTRICT FK and replace with SET NULL (column is now nullable)
ALTER TABLE "Transportations"
    DROP CONSTRAINT IF EXISTS "FK_Transportations_Users_TransportedById";

ALTER TABLE "Transportations"
    ADD CONSTRAINT "FK_Transportations_Users_TransportedById"
    FOREIGN KEY ("TransportedById")
    REFERENCES "Users"("Id")
    ON DELETE SET NULL;

-- 5. Add Quantity and PerUnitCost; MaterialCost is computed and stored by the API
ALTER TABLE "Transportations"
    ADD COLUMN IF NOT EXISTS "Quantity"    numeric(18,2);

ALTER TABLE "Transportations"
    ADD COLUMN IF NOT EXISTS "PerUnitCost" numeric(18,2);

-- 6. Register both migrations in EF history so `dotnet ef database update` won't re-run them
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId"    character varying(150) NOT NULL,
    "ProductVersion" character varying(32)  NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260622052740_AddTransportedByOtherAndVehicleOther', '8.0.10')
ON CONFLICT DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260622101002_AddQuantityAndPerUnitCost', '8.0.10')
ON CONFLICT DO NOTHING;

COMMIT;
