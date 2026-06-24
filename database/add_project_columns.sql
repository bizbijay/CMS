-- Add new columns to Projects table
ALTER TABLE "Projects"
    ADD COLUMN IF NOT EXISTS "Address"        VARCHAR(500),
    ADD COLUMN IF NOT EXISTS "IssuedOfficeId" INT REFERENCES "GovernmentOffices"("Id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "StartDate"      DATE,
    ADD COLUMN IF NOT EXISTS "EndDate"        DATE,
    ADD COLUMN IF NOT EXISTS "ProjectCost"    NUMERIC(18, 2);

CREATE INDEX IF NOT EXISTS "IX_Projects_IssuedOfficeId" ON "Projects"("IssuedOfficeId");
