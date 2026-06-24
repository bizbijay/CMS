-- Create GovernmentOffices table
CREATE TABLE IF NOT EXISTS "GovernmentOffices" (
    "Id"          SERIAL PRIMARY KEY,
    "Name"        VARCHAR(200) NOT NULL,
    "CreatedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP,
    "CreatedById" INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"   BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedOn"   TIMESTAMP,
    "DeletedById" INT REFERENCES "Users"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_GovernmentOffices_IsDeleted" ON "GovernmentOffices"("IsDeleted");

-- Insert permissions
INSERT INTO "Permissions" ("Name")
VALUES
    ('govt_offices.view'),
    ('govt_offices.add'),
    ('govt_offices.edit'),
    ('govt_offices.delete')
ON CONFLICT ("Name") DO NOTHING;

-- Assign all govt_offices permissions to the Admin role
INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM   "Roles" r
CROSS JOIN "Permissions" p
WHERE  r."Name" = 'Admin'
  AND  p."Name" LIKE 'govt_offices.%'
ON CONFLICT ("RoleId", "PermissionId") DO NOTHING;
