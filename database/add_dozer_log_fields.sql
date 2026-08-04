-- Migration: Add PartyNameId, Location, PaymentType, CashAmount, and WorkOrderBy to DozerLogs

ALTER TABLE "DozerLogs" 
    ADD COLUMN IF NOT EXISTS "PartyNameId" INT REFERENCES "PartyNames"("Id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "Location" VARCHAR(200),
    ADD COLUMN IF NOT EXISTS "PaymentType" VARCHAR(20) CHECK ("PaymentType" IN ('Cash', 'Credit')),
    ADD COLUMN IF NOT EXISTS "CashAmount" NUMERIC(12, 2) CHECK ("CashAmount" >= 0),
    ADD COLUMN IF NOT EXISTS "WorkOrderBy" VARCHAR(200);

-- Update constraint chk_dozer_project to allow PartyNameId as reference instead of Project
ALTER TABLE "DozerLogs" DROP CONSTRAINT IF EXISTS "chk_dozer_project";

ALTER TABLE "DozerLogs" ADD CONSTRAINT "chk_dozer_project" CHECK (
    ("PartyNameId" IS NOT NULL AND "ProjectId" IS NULL AND "ProjectOther" IS NULL) OR
    ("PartyNameId" IS NULL AND (("ProjectId" IS NOT NULL) <> ("ProjectOther" IS NOT NULL)))
);
