-- Vehicle Maintenance Logs (parent record per maintenance event)
CREATE TABLE IF NOT EXISTS "VehicleMaintenanceLogs" (
    "Id"          SERIAL PRIMARY KEY,
    "VehicleId"   INTEGER NOT NULL REFERENCES "Vehicles"("Id") ON DELETE CASCADE,
    "Date"        DATE NOT NULL,
    "Remarks"     VARCHAR(500),
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    "CreatedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"   BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedOn"   TIMESTAMPTZ,
    "DeletedById" INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IX_VehicleMaintenanceLogs_VehicleId" ON "VehicleMaintenanceLogs"("VehicleId");

-- Individual parts used in a maintenance event
-- Requires MaintenanceParts table (add_maintenance_parts.sql) to exist first
CREATE TABLE IF NOT EXISTS "VehicleMaintenanceParts" (
    "Id"                  SERIAL PRIMARY KEY,
    "MaintenanceLogId"    INTEGER NOT NULL REFERENCES "VehicleMaintenanceLogs"("Id") ON DELETE CASCADE,
    "MaintenancePartId"   INTEGER NOT NULL REFERENCES "MaintenanceParts"("Id") ON DELETE RESTRICT,
    "Quantity"            NUMERIC(18, 2),
    "UnitCost"            NUMERIC(18, 2),
    "TotalCost"           NUMERIC(18, 2),
    "Remarks"             VARCHAR(500),
    "CreatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"           TIMESTAMPTZ,
    "CreatedById"         INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"         INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"           BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedOn"           TIMESTAMPTZ,
    "DeletedById"         INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IX_VehicleMaintenanceParts_MaintenanceLogId"  ON "VehicleMaintenanceParts"("MaintenanceLogId");
CREATE INDEX IF NOT EXISTS "IX_VehicleMaintenanceParts_MaintenancePartId" ON "VehicleMaintenanceParts"("MaintenancePartId");

-- Wages paid during a maintenance event
CREATE TABLE IF NOT EXISTS "VehicleMaintenanceWages" (
    "Id"               SERIAL PRIMARY KEY,
    "MaintenanceLogId" INTEGER NOT NULL REFERENCES "VehicleMaintenanceLogs"("Id") ON DELETE CASCADE,
    "NumberOfWorkers"  INTEGER NOT NULL,
    "Rate"             NUMERIC(18, 2) NOT NULL,
    "TotalAmount"      NUMERIC(18, 2) NOT NULL,
    "Remarks"          VARCHAR(500),
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMPTZ,
    "CreatedById"      INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"      INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"        BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedOn"        TIMESTAMPTZ,
    "DeletedById"      INTEGER REFERENCES "Users"("Id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IX_VehicleMaintenanceWages_MaintenanceLogId" ON "VehicleMaintenanceWages"("MaintenanceLogId");

-- Permissions
INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES
    ('vehicle_maintenance.view',   'View vehicle maintenance logs',   NOW()),
    ('vehicle_maintenance.add',    'Add vehicle maintenance records',  NOW()),
    ('vehicle_maintenance.edit',   'Edit vehicle maintenance records', NOW()),
    ('vehicle_maintenance.delete', 'Delete vehicle maintenance records', NOW())
ON CONFLICT ("Name") DO NOTHING;

-- Grant to Admin role
INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
CROSS JOIN "Permissions" p
WHERE r."Name" = 'Admin'
  AND p."Name" IN (
      'vehicle_maintenance.view',
      'vehicle_maintenance.add',
      'vehicle_maintenance.edit',
      'vehicle_maintenance.delete'
  )
ON CONFLICT DO NOTHING;
