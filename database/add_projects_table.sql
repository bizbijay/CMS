CREATE TABLE IF NOT EXISTS "Projects" (
    "Id"           SERIAL PRIMARY KEY,
    "Name"         VARCHAR(100) NOT NULL,
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMPTZ,
    "CreatedById"  INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"  INT REFERENCES "Users"("Id") ON DELETE SET NULL
);
