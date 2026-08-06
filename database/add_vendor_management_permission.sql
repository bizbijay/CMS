-- Add permission for Vendor Management page
-- Safe to run multiple times

INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES
    ('vendor_management.view', 'Access vendor management page', NOW())
ON CONFLICT ("Name") DO NOTHING;

INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
JOIN "Permissions" p ON p."Name" = 'vendor_management.view'
WHERE r."Name" = 'Admin'
ON CONFLICT DO NOTHING;
