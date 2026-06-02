-- =============================================================
-- CMS — Add CreatedById / UpdatedById to Users and Vehicles
--
-- Run against the existing "cms" database.
--
-- Option A — psql:
--   psql -U postgres -d cms -f database/add_created_updated_by.sql
--
-- Option B — pgAdmin:
--   Open Query Tool on the "cms" database and run this script.
-- =============================================================

-- Users table (self-referencing)
ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "CreatedById" INT NULL,
    ADD COLUMN IF NOT EXISTS "UpdatedById" INT NULL;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Users_CreatedById') THEN
        ALTER TABLE "Users"
            ADD CONSTRAINT "FK_Users_CreatedById"
            FOREIGN KEY ("CreatedById") REFERENCES "Users"("Id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Users_UpdatedById') THEN
        ALTER TABLE "Users"
            ADD CONSTRAINT "FK_Users_UpdatedById"
            FOREIGN KEY ("UpdatedById") REFERENCES "Users"("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- Vehicles table
ALTER TABLE "Vehicles"
    ADD COLUMN IF NOT EXISTS "CreatedById" INT NULL,
    ADD COLUMN IF NOT EXISTS "UpdatedById" INT NULL;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Vehicles_CreatedById') THEN
        ALTER TABLE "Vehicles"
            ADD CONSTRAINT "FK_Vehicles_CreatedById"
            FOREIGN KEY ("CreatedById") REFERENCES "Users"("Id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Vehicles_UpdatedById') THEN
        ALTER TABLE "Vehicles"
            ADD CONSTRAINT "FK_Vehicles_UpdatedById"
            FOREIGN KEY ("UpdatedById") REFERENCES "Users"("Id") ON DELETE SET NULL;
    END IF;
END $$;
