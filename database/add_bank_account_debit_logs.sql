-- Add bank account debit logs for outgoing vendor and other payments
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS "BankAccountDebitLogs" (
    "Id"            SERIAL          PRIMARY KEY,
    "BankAccountId" INT             NOT NULL REFERENCES "BankAccounts"("Id") ON DELETE RESTRICT,
    "VendorId"      INT             REFERENCES "Vendors"("Id") ON DELETE SET NULL,
    "Amount"        NUMERIC(18, 2)  NOT NULL CHECK ("Amount" > 0),
    "DebitedOn"     DATE            NOT NULL,
    "Remarks"       VARCHAR(500),
    "CreatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"     TIMESTAMPTZ,
    "CreatedById"   INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"   INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE,
    "DeletedOn"     TIMESTAMPTZ,
    "DeletedById"   INT REFERENCES "Users"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_BankAccountDebitLogs_BankAccountId_DebitedOn"
ON "BankAccountDebitLogs" ("BankAccountId", "DebitedOn" DESC);

UPDATE "BankAccounts" a
SET "TotalBalance" = COALESCE(c."CreditTotal", 0) - COALESCE(d."DebitTotal", 0)
FROM (
    SELECT "BankAccountId", SUM("Amount") AS "CreditTotal"
    FROM "BankAccountCreditLogs"
    WHERE NOT "IsDeleted"
    GROUP BY "BankAccountId"
) c
LEFT JOIN (
    SELECT "BankAccountId", SUM("Amount") AS "DebitTotal"
    FROM "BankAccountDebitLogs"
    WHERE NOT "IsDeleted"
    GROUP BY "BankAccountId"
) d ON d."BankAccountId" = c."BankAccountId"
WHERE c."BankAccountId" = a."Id";
