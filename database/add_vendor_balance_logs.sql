-- Add vendor running balance and vendor credit/debit logs
-- Safe to run multiple times

ALTER TABLE "Vendors"
ADD COLUMN IF NOT EXISTS "TotalBalance" NUMERIC(18, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "VendorBalanceLogs" (
    "Id"            SERIAL          PRIMARY KEY,
    "VendorId"      INT             NOT NULL REFERENCES "Vendors"("Id") ON DELETE RESTRICT,
    "BankAccountId" INT             REFERENCES "BankAccounts"("Id") ON DELETE SET NULL,
    "EntryType"     VARCHAR(10)     NOT NULL CHECK ("EntryType" IN ('credit', 'debit')),
    "Amount"        NUMERIC(18, 2)  NOT NULL CHECK ("Amount" > 0),
    "LoggedOn"      DATE            NOT NULL,
    "Remarks"       VARCHAR(500),
    "CreatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"     TIMESTAMPTZ,
    "CreatedById"   INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"   INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"     BOOLEAN         NOT NULL DEFAULT FALSE,
    "DeletedOn"     TIMESTAMPTZ,
    "DeletedById"   INT REFERENCES "Users"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_VendorBalanceLogs_VendorId_LoggedOn"
ON "VendorBalanceLogs" ("VendorId", "LoggedOn" DESC);

UPDATE "Vendors" v
SET "TotalBalance" = COALESCE(s."TotalBalance", 0)
FROM (
    SELECT "VendorId",
           SUM(CASE WHEN "EntryType" = 'credit' THEN "Amount" ELSE -"Amount" END) AS "TotalBalance"
    FROM "VendorBalanceLogs"
    WHERE NOT "IsDeleted"
    GROUP BY "VendorId"
) s
WHERE s."VendorId" = v."Id";
