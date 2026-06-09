CREATE TABLE IF NOT EXISTS "SalaryDetails" (
    "Id"          SERIAL          PRIMARY KEY,
    "UserId"      INT             NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "TotalSalary" NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    "Paid"        NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    "Remaining"   NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    CONSTRAINT "UX_SalaryDetails_UserId" UNIQUE ("UserId")
);
