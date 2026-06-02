-- Assign a vehicle to a driver user (nullable FK)
ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "VehicleId" INT REFERENCES "Vehicles"("Id") ON DELETE SET NULL;
