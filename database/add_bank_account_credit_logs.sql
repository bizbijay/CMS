-- Add credit logs table for bank account balance tracking
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS "BankAccountCreditLogs" (
    "Id"              SERIAL          PRIMARY KEY,
    "BankAccountId"   INT             NOT NULL REFERENCES "BankAccounts"("Id") ON DELETE RESTRICT,
    "Amount"          NUMERIC(18, 2)  NOT NULL CHECK ("Amount" > 0),
    "LoggedOn"        DATE            NOT NULL,
    "Remarks"         VARCHAR(500),
    "CreatedAt"       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ,
    "CreatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"       BOOLEAN         NOT NULL DEFAULT FALSE,
    "DeletedOn"       TIMESTAMPTZ,
    "DeletedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_BankAccountCreditLogs_BankAccountId_LoggedOn"
ON "BankAccountCreditLogs" ("BankAccountId", "LoggedOn" DESC);

ALTER TABLE "BankAccounts"
ADD COLUMN IF NOT EXISTS "TotalBalance" NUMERIC(18, 2) NOT NULL DEFAULT 0;

UPDATE "BankAccounts" a
SET "TotalBalance" = COALESCE(s."TotalBalance", 0)
FROM (
    SELECT "BankAccountId", SUM("Amount") AS "TotalBalance"
    FROM "BankAccountCreditLogs"
    WHERE NOT "IsDeleted"
    GROUP BY "BankAccountId"
) s
WHERE s."BankAccountId" = a."Id";

INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES
    ('account_management.view', 'Access account management page', NOW())
ON CONFLICT ("Name") DO NOTHING;

INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
JOIN "Permissions" p ON p."Name" = 'account_management.view'
WHERE r."Name" = 'Admin'
ON CONFLICT DO NOTHING;
