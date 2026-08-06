-- =============================================================
-- Permissions & RolePermissions tables + seed data
-- =============================================================

CREATE TABLE IF NOT EXISTS "Permissions" (
    "Id"           SERIAL        PRIMARY KEY,
    "Name"         VARCHAR(100)  NOT NULL,
    "Description"  VARCHAR(255),
    "CreatedAt"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMPTZ,
    "CreatedById"  INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"  INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    CONSTRAINT "UX_Permissions_Name" UNIQUE ("Name")
);

CREATE TABLE IF NOT EXISTS "RolePermissions" (
    "Id"            SERIAL  PRIMARY KEY,
    "RoleId"        INT     NOT NULL REFERENCES "Roles"("Id")       ON DELETE CASCADE,
    "PermissionId"  INT     NOT NULL REFERENCES "Permissions"("Id") ON DELETE CASCADE,
    CONSTRAINT "UX_RolePermissions_RoleId_PermissionId" UNIQUE ("RoleId", "PermissionId")
);

-- =============================================================
-- Seed: all permissions — safe to re-run, skips existing rows
-- =============================================================

-- Dashboard
INSERT INTO "Permissions" ("Name", "Description") VALUES ('dashboard.view',           'View the dashboard')                         ON CONFLICT ("Name") DO NOTHING;

-- Users
INSERT INTO "Permissions" ("Name", "Description") VALUES ('users.view',               'View the users list')                        ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('users.add',                'Create a new user')                          ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('users.edit',               'Edit an existing user')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('users.delete',             'Delete a user')                              ON CONFLICT ("Name") DO NOTHING;

-- Transportation
INSERT INTO "Permissions" ("Name", "Description") VALUES ('transportation.view',      'View transportation records')                 ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('transportation.add',       'Add a transportation record')                 ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('transportation.edit',      'Edit a transportation record')                ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('transportation.delete',    'Delete a transportation record')              ON CONFLICT ("Name") DO NOTHING;

-- Fuel Log
INSERT INTO "Permissions" ("Name", "Description") VALUES ('fuel_log.view',            'View fuel log entries')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('fuel_log.add',             'Add a fuel log entry')                       ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('fuel_log.edit',            'Edit a fuel log entry')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('fuel_log.delete',          'Delete a fuel log entry')                    ON CONFLICT ("Name") DO NOTHING;

-- Dozer Log
INSERT INTO "Permissions" ("Name", "Description") VALUES ('dozer_log.view',           'View dozer log entries')                     ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('dozer_log.add',            'Add a dozer log entry')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('dozer_log.edit',           'Edit a dozer log entry')                     ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('dozer_log.delete',         'Delete a dozer log entry')                   ON CONFLICT ("Name") DO NOTHING;

-- Vehicles
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vehicles.view',            'View the vehicles list')                     ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vehicles.add',             'Add a vehicle')                              ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vehicles.edit',            'Edit a vehicle')                             ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vehicles.delete',          'Delete a vehicle')                           ON CONFLICT ("Name") DO NOTHING;

-- Materials
INSERT INTO "Permissions" ("Name", "Description") VALUES ('materials.view',           'View the materials list')                    ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('materials.add',            'Add a material')                             ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('materials.edit',           'Edit a material')                            ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('materials.delete',         'Delete a material')                          ON CONFLICT ("Name") DO NOTHING;

-- Vendors
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vendors.view',             'View the vendors list')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vendors.add',              'Add a vendor')                               ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vendors.edit',             'Edit a vendor')                              ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vendors.delete',           'Delete a vendor')                            ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vendor_management.view',   'Access vendor management page')              ON CONFLICT ("Name") DO NOTHING;

-- Projects
INSERT INTO "Permissions" ("Name", "Description") VALUES ('projects.view',            'View the projects list')                     ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('projects.add',             'Add a project')                              ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('projects.edit',            'Edit a project')                             ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('projects.delete',          'Delete a project')                           ON CONFLICT ("Name") DO NOTHING;

-- Project Expenses
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_expenses.view',    'View project expenses')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_expenses.add',     'Add project expenses')                       ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_expenses.edit',    'Edit project expenses')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_expenses.delete',  'Delete project expenses')                    ON CONFLICT ("Name") DO NOTHING;

-- Project Wages
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_wages.view',       'View project wages')                         ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_wages.add',        'Add project wages')                          ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_wages.edit',       'Edit project wages')                         ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_wages.delete',     'Delete project wages')                       ON CONFLICT ("Name") DO NOTHING;

-- Government Offices
INSERT INTO "Permissions" ("Name", "Description") VALUES ('govt_offices.view',        'View government offices')                    ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('govt_offices.add',         'Add government offices')                     ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('govt_offices.edit',        'Edit government offices')                    ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('govt_offices.delete',      'Delete government offices')                  ON CONFLICT ("Name") DO NOTHING;

-- Project Commissions
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_commissions.view', 'View project commissions')                   ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_commissions.add',  'Add project commissions')                    ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_commissions.edit', 'Edit project commissions')                   ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_commissions.delete','Delete project commissions')                 ON CONFLICT ("Name") DO NOTHING;

-- Vehicle Maintenance
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vehicle_maintenance.view', 'View vehicle maintenance')                  ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vehicle_maintenance.add',  'Add vehicle maintenance')                   ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vehicle_maintenance.edit', 'Edit vehicle maintenance')                  ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('vehicle_maintenance.delete','Delete vehicle maintenance')                ON CONFLICT ("Name") DO NOTHING;

-- Maintenance Parts
INSERT INTO "Permissions" ("Name", "Description") VALUES ('maintenance_parts.view',  'View maintenance parts')                     ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('maintenance_parts.add',   'Add maintenance parts')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('maintenance_parts.edit',  'Edit maintenance parts')                     ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('maintenance_parts.delete','Delete maintenance parts')                   ON CONFLICT ("Name") DO NOTHING;

-- Fuel Types
INSERT INTO "Permissions" ("Name", "Description") VALUES ('fuel_types.view',          'View the fuel types list')                   ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('fuel_types.add',           'Add a fuel type')                            ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('fuel_types.edit',          'Edit a fuel type')                           ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('fuel_types.delete',        'Delete a fuel type')                         ON CONFLICT ("Name") DO NOTHING;

-- Roles
INSERT INTO "Permissions" ("Name", "Description") VALUES ('roles.view',               'View the roles list')                        ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('roles.add',                'Create a new role')                          ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('roles.edit',               'Edit an existing role')                      ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('roles.delete',             'Delete a role')                              ON CONFLICT ("Name") DO NOTHING;

-- Permissions
INSERT INTO "Permissions" ("Name", "Description") VALUES ('permissions.view',         'View the permissions list')                  ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('permissions.add',          'Create a new permission')                    ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('permissions.edit',         'Edit an existing permission')                ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('permissions.delete',       'Delete a permission')                        ON CONFLICT ("Name") DO NOTHING;

-- Party Names
INSERT INTO "Permissions" ("Name", "Description") VALUES ('party_names.view',         'View party names')                           ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('party_names.add',          'Add party names')                            ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('party_names.edit',         'Edit party names')                           ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('party_names.delete',       'Delete party names')                         ON CONFLICT ("Name") DO NOTHING;

-- Role Permissions
INSERT INTO "Permissions" ("Name", "Description") VALUES ('role_permissions.view',    'View permissions assigned to roles')         ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('role_permissions.edit',    'Assign or remove permissions from a role')   ON CONFLICT ("Name") DO NOTHING;

-- Monthly Salary
INSERT INTO "Permissions" ("Name", "Description") VALUES ('monthly_salary.view',       'View monthly salary records')                ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('monthly_salary.edit',       'Save or verify a monthly salary record')     ON CONFLICT ("Name") DO NOTHING;

-- Salary Payments
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_payment.view',      'View salary payment records')                ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_payment.add',       'Record a salary payment')                    ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_payment.edit',      'Edit a salary payment record')               ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_payment.delete',    'Delete a salary payment record')             ON CONFLICT ("Name") DO NOTHING;

-- Salary Details
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_detail.view',    'View salary detail summary')                 ON CONFLICT ("Name") DO NOTHING;

-- Salary Setup
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_setup.view',        'View salary setup entries')                  ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_setup.add',         'Add a salary entry')                         ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_setup.edit',        'Edit a salary entry')                        ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('salary_setup.delete',      'Delete a salary entry')                      ON CONFLICT ("Name") DO NOTHING;

-- =============================================================
-- Seed: Admin role → assign every permission
-- =============================================================

INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM   "Roles" r
CROSS JOIN "Permissions" p
WHERE  r."Name" = 'Admin'
ON CONFLICT ("RoleId", "PermissionId") DO NOTHING;
