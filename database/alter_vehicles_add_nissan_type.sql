-- =============================================================
-- CMS — Add Nissan to Vehicles type constraint
--
-- Run this against the existing "cms" database.
--
-- Option A — psql:
--   psql -U postgres -d cms -f database/alter_vehicles_add_nissan_type.sql
--
-- Option B — pgAdmin:
--   Open Query Tool on the "cms" database and run this script.
-- =============================================================

ALTER TABLE "Vehicles"
    DROP CONSTRAINT "CK_Vehicles_Type";

ALTER TABLE "Vehicles"
    ADD CONSTRAINT "CK_Vehicles_Type"
    CHECK ("Type" IN ('Tipper', 'Jcb', 'Nissan'));
