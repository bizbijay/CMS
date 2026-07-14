CREATE TABLE IF NOT EXISTS "DozerLogs" (
    "Id"              SERIAL       PRIMARY KEY,
    "DriverId"        INT          NOT NULL REFERENCES "Users"("Id")    ON DELETE RESTRICT,
    "VehicleId"       INT          REFERENCES "Vehicles"("Id")          ON DELETE SET NULL,
    "OperationDate"   DATE         NOT NULL,
    "OperatedTimeMs"  INT          CHECK ("OperatedTimeMs" >= 0),
    "StartMeter"      NUMERIC(10,2) NOT NULL CHECK ("StartMeter" >= 0),
    "EndMeter"        NUMERIC(10,2) NOT NULL CHECK ("EndMeter" > "StartMeter" OR ("StartMeter" = 0 AND "EndMeter" = 0)),
    "TotalMeterRun"   NUMERIC(10,2) NOT NULL DEFAULT 0,
    "ProjectId"       INT          REFERENCES "Projects"("Id")          ON DELETE SET NULL,
    "ProjectOther"    VARCHAR(200),
    "Wages"           NUMERIC(12,2),
    "CreatedAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ,
    "CreatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"       BOOLEAN      DEFAULT FALSE,
    "DeletedOn"       TIMESTAMPTZ,
    "DeletedById"     INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    -- exactly one of ProjectId / ProjectOther must be set
    CONSTRAINT chk_dozer_project CHECK (("ProjectId" IS NOT NULL) <> ("ProjectOther" IS NOT NULL))
);
