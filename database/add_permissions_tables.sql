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
-- Seed: all permissions (insert, skip if already exists)
-- =============================================================

INSERT INTO "Permissions" ("Name", "Description") VALUES

    -- Dashboard
    ('dashboard.view',              'View the dashboard'),

    -- Users
    ('users.view',                  'View the users list'),
    ('users.add',                   'Create a new user'),
    ('users.edit',                  'Edit an existing user'),
    ('users.delete',                'Delete a user'),

    -- Transportation
    ('transportation.view',         'View transportation records'),
    ('transportation.add',          'Add a transportation record'),
    ('transportation.edit',         'Edit a transportation record'),
    ('transportation.delete',       'Delete a transportation record'),

    -- Fuel Log
    ('fuel_log.view',               'View fuel log entries'),
    ('fuel_log.add',                'Add a fuel log entry'),
    ('fuel_log.edit',               'Edit a fuel log entry'),
    ('fuel_log.delete',             'Delete a fuel log entry'),

    -- Vehicles
    ('vehicles.view',               'View the vehicles list'),
    ('vehicles.add',                'Add a vehicle'),
    ('vehicles.edit',               'Edit a vehicle'),
    ('vehicles.delete',             'Delete a vehicle'),

    -- Materials
    ('materials.view',              'View the materials list'),
    ('materials.add',               'Add a material'),
    ('materials.edit',              'Edit a material'),
    ('materials.delete',            'Delete a material'),

    -- Vendors
    ('vendors.view',                'View the vendors list'),
    ('vendors.add',                 'Add a vendor'),
    ('vendors.edit',                'Edit a vendor'),
    ('vendors.delete',              'Delete a vendor'),

    -- Projects
    ('projects.view',               'View the projects list'),
    ('projects.add',                'Add a project'),
    ('projects.edit',               'Edit a project'),
    ('projects.delete',             'Delete a project'),

    -- Fuel Types
    ('fuel_types.view',             'View the fuel types list'),
    ('fuel_types.add',              'Add a fuel type'),
    ('fuel_types.edit',             'Edit a fuel type'),
    ('fuel_types.delete',           'Delete a fuel type'),

    -- Roles
    ('roles.view',                  'View the roles list'),
    ('roles.add',                   'Create a new role'),
    ('roles.edit',                  'Edit an existing role'),
    ('roles.delete',                'Delete a role'),

    -- Permissions
    ('permissions.view',            'View the permissions list'),
    ('permissions.add',             'Create a new permission'),
    ('permissions.edit',            'Edit an existing permission'),
    ('permissions.delete',          'Delete a permission'),

    -- Role Permissions
    ('role_permissions.view',       'View permissions assigned to roles'),
    ('role_permissions.edit',       'Assign or remove permissions from a role')

ON CONFLICT ("Name") DO NOTHING;

-- =============================================================
-- Seed: Admin role → assign every permission
-- =============================================================

INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM   "Roles" r
CROSS JOIN "Permissions" p
WHERE  r."Name" = 'Admin'
ON CONFLICT ("RoleId", "PermissionId") DO NOTHING;
