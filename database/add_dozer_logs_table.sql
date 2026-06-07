CREATE TABLE IF NOT EXISTS "DozerLogs" (
    "Id"              SERIAL       PRIMARY KEY,
    "DriverId"        INT          NOT NULL REFERENCES "Users"("Id")    ON DELETE RESTRICT,
    "VehicleId"       INT          REFERENCES "Vehicles"("Id")          ON DELETE SET NULL,
    "OperationDate"   DATE         NOT NULL,
    "OperatedTimeMs"  INT          NOT NULL CHECK ("OperatedTimeMs" >= 0),
    "ProjectId"       INT          REFERENCES "Projects"("Id")          ON DELETE SET NULL,
    "ProjectOther"    VARCHAR(200),
    "CreatedAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ,
    "CreatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    -- exactly one of ProjectId / ProjectOther must be set
    CONSTRAINT chk_dozer_project CHECK (("ProjectId" IS NOT NULL) <> ("ProjectOther" IS NOT NULL))
);
