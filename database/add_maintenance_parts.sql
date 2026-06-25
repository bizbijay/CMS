-- Master list of maintenance part names
CREATE TABLE IF NOT EXISTS "MaintenanceParts" (
    "Id"          SERIAL PRIMARY KEY,
    "Name"        VARCHAR(300) NOT NULL,
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    "CreatedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"   BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedOn"   TIMESTAMPTZ,
    "DeletedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IX_MaintenanceParts_Name" ON "MaintenanceParts"("Name");

-- Permissions
INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES
    ('maintenance_parts.view',   'View maintenance part names',   NOW()),
    ('maintenance_parts.add',    'Add maintenance part names',    NOW()),
    ('maintenance_parts.edit',   'Edit maintenance part names',   NOW()),
    ('maintenance_parts.delete', 'Delete maintenance part names', NOW())
ON CONFLICT ("Name") DO NOTHING;

-- Grant to Admin role
INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
CROSS JOIN "Permissions" p
WHERE r."Name" = 'Admin'
  AND p."Name" IN (
      'maintenance_parts.view',
      'maintenance_parts.add',
      'maintenance_parts.edit',
      'maintenance_parts.delete'
  )
ON CONFLICT DO NOTHING;
