-- SalarySetups table
CREATE TABLE IF NOT EXISTS "SalarySetups" (
    "Id"             SERIAL          PRIMARY KEY,
    "UserId"         INT             NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "MonthlySalary"  NUMERIC(12, 2)  NOT NULL,
    "CreatedAt"      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMPTZ,
    "CreatedById"    INT             REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"    INT             REFERENCES "Users"("Id") ON DELETE SET NULL,
    CONSTRAINT "UX_SalarySetups_UserId" UNIQUE ("UserId")
);
