-- Create ProjectExpenses table
CREATE TABLE IF NOT EXISTS "ProjectExpenses" (
    "Id"            serial PRIMARY KEY,
    "ProjectId"     integer        NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "MaterialId"    integer        REFERENCES "Materials"("Id") ON DELETE SET NULL,
    "Quantity"      numeric(18,2),
    "CostPerUnit"   numeric(18,2),
    "TotalCost"     numeric(18,2),
    "VendorId"      integer        REFERENCES "Vendors"("Id") ON DELETE SET NULL,
    "VendorOther"   character varying(200),
    "Date"          date           NOT NULL,
    "Remarks"       character varying(500),
    "CreatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedAt"     timestamp with time zone,
    "CreatedById"   integer        REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"   integer        REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"     boolean        NOT NULL DEFAULT false,
    "DeletedOn"     timestamp with time zone,
    "DeletedById"   integer        REFERENCES "Users"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_ProjectExpenses_ProjectId" ON "ProjectExpenses"("ProjectId");

-- If table was already created without VendorOther, add the column safely
ALTER TABLE "ProjectExpenses" ADD COLUMN IF NOT EXISTS "VendorOther" character varying(200);

-- Permissions for Project Expenses
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_expenses.view',   'View project expenses')         ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_expenses.add',    'Add a project expense')         ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_expenses.edit',   'Edit a project expense')        ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_expenses.delete', 'Delete a project expense')      ON CONFLICT ("Name") DO NOTHING;

-- Assign all new permissions to the Admin role
INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM   "Roles" r
CROSS JOIN "Permissions" p
WHERE  r."Name" = 'Admin'
ON CONFLICT ("RoleId", "PermissionId") DO NOTHING;

-- Register migration in EF history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260623000000_AddProjectExpenses', '8.0.0')
ON CONFLICT DO NOTHING;
