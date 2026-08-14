-- Add permissions for individual Report pages
-- Safe to run multiple times

INSERT INTO "Permissions" ("Name", "Description", "CreatedAt")
VALUES
    ('transportation_report.view', 'View transportation report', NOW()),
    ('fuel_log_report.view', 'View fuel log report', NOW()),
    ('dozer_log_report.view', 'View dozer log report', NOW())
ON CONFLICT ("Name") DO NOTHING;

INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM "Roles" r
CROSS JOIN "Permissions" p
WHERE r."Name" = 'Admin'
  AND p."Name" IN ('transportation_report.view', 'fuel_log_report.view', 'dozer_log_report.view')
ON CONFLICT DO NOTHING;
