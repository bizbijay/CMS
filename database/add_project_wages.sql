-- Create ProjectWages table
CREATE TABLE IF NOT EXISTS "ProjectWages" (
    "Id"              serial PRIMARY KEY,
    "ProjectId"       integer        NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "NumberOfWorkers" integer        NOT NULL,
    "Rate"            numeric(18,2)  NOT NULL,
    "TotalAmount"     numeric(18,2)  NOT NULL,
    "Date"            date           NOT NULL,
    "Remarks"         character varying(500),
    "CreatedAt"       timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedAt"       timestamp with time zone,
    "CreatedById"     integer        REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"     integer        REFERENCES "Users"("Id") ON DELETE SET NULL,
    "IsDeleted"       boolean        NOT NULL DEFAULT false,
    "DeletedOn"       timestamp with time zone,
    "DeletedById"     integer        REFERENCES "Users"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_ProjectWages_ProjectId" ON "ProjectWages"("ProjectId");

-- Permissions
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_wages.view',   'View project wages')    ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_wages.add',    'Add a project wage')    ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_wages.edit',   'Edit a project wage')   ON CONFLICT ("Name") DO NOTHING;
INSERT INTO "Permissions" ("Name", "Description") VALUES ('project_wages.delete', 'Delete a project wage') ON CONFLICT ("Name") DO NOTHING;

-- Assign all new permissions to the Admin role
INSERT INTO "RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id"
FROM   "Roles" r
CROSS JOIN "Permissions" p
WHERE  r."Name" = 'Admin'
ON CONFLICT ("RoleId", "PermissionId") DO NOTHING;

-- Register migration in EF history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260623000001_AddProjectWages', '8.0.0')
ON CONFLICT DO NOTHING;
