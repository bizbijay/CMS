CREATE TABLE IF NOT EXISTS "SalaryPayments" (
    "Id"          SERIAL          PRIMARY KEY,
    "UserId"      INT             NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Amount"      NUMERIC(12, 2)  NOT NULL,
    "PaidOn"      DATE            NOT NULL,
    "Remarks"     TEXT,
    "CreatedAt"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    "CreatedById" INT             REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INT             REFERENCES "Users"("Id") ON DELETE SET NULL
);
