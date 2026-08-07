-- Add party running balance and party credit/debit logs
-- Safe to run multiple times

ALTER TABLE "PartyNames"
ADD COLUMN IF NOT EXISTS "TotalBalance" NUMERIC(18, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PartyBalanceLogs" (
    "Id"          SERIAL          PRIMARY KEY,
    "PartyNameId" INT             NOT NULL REFERENCES "PartyNames"("Id") ON DELETE RESTRICT,
    "EntryType"   VARCHAR(10)     NOT NULL CHECK ("EntryType" IN ('credit', 'debit')),
    "Amount"      NUMERIC(18, 2)  NOT NULL CHECK ("Amount" > 0),
    "LoggedOn"    DATE            NOT NULL,
    "Remarks"     VARCHAR(500),
    "CreatedAt"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    "CreatedById" INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"   BOOLEAN         NOT NULL DEFAULT FALSE,
    "DeletedOn"   TIMESTAMPTZ,
    "DeletedById" INT REFERENCES "Users"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_PartyBalanceLogs_PartyNameId_LoggedOn"
ON "PartyBalanceLogs" ("PartyNameId", "LoggedOn" DESC);

UPDATE "PartyNames" p
SET "TotalBalance" = COALESCE(s."TotalBalance", 0)
FROM (
    SELECT "PartyNameId",
           SUM(CASE WHEN "EntryType" = 'credit' THEN "Amount" ELSE -"Amount" END) AS "TotalBalance"
    FROM "PartyBalanceLogs"
    WHERE NOT "IsDeleted"
    GROUP BY "PartyNameId"
) s
WHERE s."PartyNameId" = p."Id";
