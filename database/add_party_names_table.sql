CREATE TABLE IF NOT EXISTS "PartyNames" (
    "Id"          SERIAL PRIMARY KEY,
    "Name"        VARCHAR(200) NOT NULL,
    "TotalBalance" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    "CreatedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"   BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedOn"   TIMESTAMPTZ,
    "DeletedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IX_PartyNames_Name" ON "PartyNames"("Name");

INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES
    ('party_names.view',   'View party names',   NOW()),
    ('party_names.add',    'Add party names',    NOW()),
    ('party_names.edit',   'Edit party names',   NOW()),
    ('party_names.delete', 'Delete party names', NOW())
ON CONFLICT ("Name") DO NOTHING;

INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
CROSS JOIN "Permissions" p
WHERE r."Name" = 'Admin'
  AND p."Name" IN (
      'party_names.view',
      'party_names.add',
      'party_names.edit',
      'party_names.delete'
  )
ON CONFLICT DO NOTHING;
