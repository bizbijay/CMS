ALTER TABLE "Transportations"
    ADD COLUMN IF NOT EXISTS "Location" VARCHAR(200),
    ADD COLUMN IF NOT EXISTS "PartyNameId" INT NULL REFERENCES "PartyNames"("Id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "NoOfTip" INT NULL;

ALTER TABLE "Transportations" DROP CONSTRAINT IF EXISTS chk_project;
ALTER TABLE "Transportations" DROP CONSTRAINT IF EXISTS "chk_project";
ALTER TABLE "Transportations" DROP CONSTRAINT IF EXISTS chk_project_reference;
ALTER TABLE "Transportations" DROP CONSTRAINT IF EXISTS "chk_project_reference";

ALTER TABLE "Transportations"
    ADD CONSTRAINT chk_project_reference CHECK (
        "PartyNameId" IS NOT NULL
        OR
        (("ProjectId" IS NOT NULL) <> ("ProjectOther" IS NOT NULL))
    );


