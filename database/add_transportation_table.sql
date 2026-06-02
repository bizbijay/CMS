CREATE TABLE IF NOT EXISTS "Transportations" (
    "Id"               SERIAL PRIMARY KEY,
    "TransportedById"  INT          NOT NULL REFERENCES "Users"("Id")    ON DELETE RESTRICT,
    "VendorId"         INT          REFERENCES "Vendors"("Id")           ON DELETE SET NULL,
    "VendorOther"      VARCHAR(200),
    "ProjectId"        INT          REFERENCES "Projects"("Id")          ON DELETE SET NULL,
    "ProjectOther"     VARCHAR(200),
    "Date"             DATE         NOT NULL,
    "CreatedAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMPTZ,
    "CreatedById"      INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"      INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    -- exactly one of VendorId / VendorOther must be set
    CONSTRAINT chk_vendor  CHECK (("VendorId"  IS NOT NULL) <> ("VendorOther"  IS NOT NULL)),
    -- exactly one of ProjectId / ProjectOther must be set
    CONSTRAINT chk_project CHECK (("ProjectId" IS NOT NULL) <> ("ProjectOther" IS NOT NULL))
);
