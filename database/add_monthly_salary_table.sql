-- MonthlySalaries table
CREATE TABLE IF NOT EXISTS "MonthlySalaries" (
    "Id"          SERIAL          PRIMARY KEY,
    "UserId"      INT             NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Month"       SMALLINT        NOT NULL CHECK ("Month" BETWEEN 1 AND 12),
    "Year"        SMALLINT        NOT NULL,
    "Amount"      NUMERIC(12, 2)  NOT NULL,
    "IsVerified"  BOOLEAN         NOT NULL DEFAULT FALSE,
    "CreatedAt"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    "CreatedById" INT             REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INT             REFERENCES "Users"("Id") ON DELETE SET NULL,
    CONSTRAINT "UX_MonthlySalaries_UserId_Month_Year" UNIQUE ("UserId", "Month", "Year")
);
