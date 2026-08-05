-- Manual database repair script for bank accounts and permission bootstrap
-- Run this against the CMS PostgreSQL database if the table or permission rows are missing.

CREATE TABLE IF NOT EXISTS "BankAccounts" (
    "Id"              SERIAL          PRIMARY KEY,
    "BankName"        VARCHAR(200)    NOT NULL,
    "AccountHolder"   VARCHAR(200)    NOT NULL,
    "AccountNumber"   VARCHAR(100)    NOT NULL,
    "Branch"          VARCHAR(200),
    "IsPrimary"       BOOLEAN         NOT NULL DEFAULT FALSE,
    "CreatedAt"       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ,
    "CreatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"       BOOLEAN         NOT NULL DEFAULT FALSE,
    "DeletedOn"       TIMESTAMPTZ,
    "DeletedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL
);

INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES
    ('bank_accounts.view', 'View bank accounts', NOW()),
    ('bank_accounts.add', 'Add bank accounts', NOW()),
    ('bank_accounts.edit', 'Edit bank accounts', NOW()),
    ('bank_accounts.delete', 'Delete bank accounts', NOW())
ON CONFLICT ("Name") DO NOTHING;

INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
JOIN "Permissions" p ON p."Name" LIKE 'extra_expenses.%' OR p."Name" LIKE 'bank_accounts.%'
WHERE r."Name" = 'Admin'
ON CONFLICT DO NOTHING;
