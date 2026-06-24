-- Add ProjectCommissions table
CREATE TABLE IF NOT EXISTS "ProjectCommissions" (
    "Id"          SERIAL PRIMARY KEY,
    "ProjectId"   INTEGER NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "OfficeId"    INTEGER REFERENCES "GovernmentOffices"("Id") ON DELETE SET NULL,
    "OtherOption" VARCHAR(200),
    "Amount"      NUMERIC(18, 2) NOT NULL,
    "Remarks"     VARCHAR(500),
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    "CreatedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"   BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedOn"   TIMESTAMPTZ,
    "DeletedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_ProjectCommissions_ProjectId" ON "ProjectCommissions"("ProjectId");

-- Add project_commissions permissions
INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES
    ('project_commissions.view',   'View project commissions',   NOW()),
    ('project_commissions.add',    'Add project commissions',    NOW()),
    ('project_commissions.edit',   'Edit project commissions',   NOW()),
    ('project_commissions.delete', 'Delete project commissions', NOW())
ON CONFLICT ("Name") DO NOTHING;

-- Grant all four permissions to the Admin role (adjust RoleId if needed)
INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
CROSS JOIN "Permissions" p
WHERE r."Name" = 'Admin'
  AND p."Name" IN (
      'project_commissions.view',
      'project_commissions.add',
      'project_commissions.edit',
      'project_commissions.delete'
  )
ON CONFLICT DO NOTHING;
