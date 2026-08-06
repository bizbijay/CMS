CREATE TABLE IF NOT EXISTS "Vendors" (
    "Id"           SERIAL PRIMARY KEY,
    "Name"         VARCHAR(100) NOT NULL,
    "TotalBalance" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMPTZ,
    "CreatedById"  INT REFERENCES "Users"("Id") ON DELETE SET NULL,
    "UpdatedById"  INT REFERENCES "Users"("Id") ON DELETE SET NULL
);
