-- Migration: Create ExtraExpenses table and permissions

CREATE TABLE IF NOT EXISTS "ExtraExpenses" (
    "Id"              SERIAL          PRIMARY KEY,
    "ExpensedById"    INT             REFERENCES "Users"("Id") ON DELETE SET NULL,
    "ExpensedByOther" VARCHAR(200),
    "Item"            VARCHAR(200)    NOT NULL,
    "Quantity"        NUMERIC(18, 2),
    "Cost"            NUMERIC(18, 2),
    "TotalCost"       NUMERIC(18, 2)  NOT NULL,
    "Remarks"         VARCHAR(500),
    "IsVerified"      BOOLEAN         NOT NULL DEFAULT FALSE,
    "VerifiedById"    INT             REFERENCES "Users"("Id") ON DELETE SET NULL,
    "VerifiedAt"      TIMESTAMPTZ,
    "Date"            DATE            NOT NULL,
    "CreatedAt"       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ,
    "CreatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"       BOOLEAN         NOT NULL DEFAULT FALSE,
    "DeletedOn"       TIMESTAMPTZ,
    "DeletedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL
);

-- Seed permissions for Extra Expenses
INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES 
    ('extra_expenses.view', 'View extra expenses', NOW()),
    ('extra_expenses.add', 'Add extra expenses', NOW()),
    ('extra_expenses.edit', 'Edit extra expenses', NOW()),
    ('extra_expenses.delete', 'Delete extra expenses', NOW()),
    ('extra_expenses.verify', 'Verify extra expenses', NOW())
ON CONFLICT ("Name") DO NOTHING;

-- Grant extra_expenses.view and extra_expenses.add to ALL roles
INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
CROSS JOIN "Permissions" p
WHERE p."Name" IN ('extra_expenses.view', 'extra_expenses.add')
ON CONFLICT DO NOTHING;

-- Grant all extra expense permissions to Admin role (RoleId = 1)
INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT 1, "Id" FROM "Permissions" WHERE "Name" LIKE 'extra_expenses.%'
ON CONFLICT DO NOTHING;
