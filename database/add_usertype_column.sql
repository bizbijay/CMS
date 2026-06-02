-- =============================================================
-- CMS — Add Type column to Users table
--
-- Run this against the existing "cms" database.
--
-- Option A — psql:
--   psql -U postgres -d cms -f database/add_usertype_column.sql
--
-- Option B — pgAdmin:
--   Open Query Tool on the "cms" database and run this script.
-- =============================================================

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "Type" VARCHAR(20) NOT NULL DEFAULT 'Admin';

ALTER TABLE "Users"
    ADD CONSTRAINT "CK_Users_Type" CHECK ("Type" IN ('Admin', 'Driver'));
