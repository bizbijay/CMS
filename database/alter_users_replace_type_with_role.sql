-- Replace the Type enum column with a RoleId FK referencing the Roles table.
-- Run AFTER add_roles_table.sql has been executed.

ALTER TABLE "Users"
    DROP COLUMN IF EXISTS "Type",
    ADD COLUMN IF NOT EXISTS "RoleId" INT REFERENCES "Roles"("Id") ON DELETE SET NULL;
