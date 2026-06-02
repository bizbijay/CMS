CREATE TABLE IF NOT EXISTS "FuelLogs" (
    "Id"          SERIAL PRIMARY KEY,
    "DriverId"    INT             NOT NULL REFERENCES "Users"("Id")    ON DELETE RESTRICT,
    "VehicleId"   INT             NOT NULL REFERENCES "Vehicles"("Id") ON DELETE RESTRICT,
    "FuelTypeId"  INT             NOT NULL REFERENCES "Fuels"("Id")    ON DELETE RESTRICT,
    "Quantity"    NUMERIC(10, 2)  NOT NULL CHECK ("Quantity" > 0),
    "Price"       NUMERIC(10, 2)  NOT NULL CHECK ("Price" > 0),
    "Date"        DATE            NOT NULL,
    "CreatedAt"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    "CreatedById" INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INT REFERENCES "Users"("Id") ON DELETE SET NULL
);
