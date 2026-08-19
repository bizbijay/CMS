-- Migration: Create ErrorLogs table safely

CREATE TABLE IF NOT EXISTS "ErrorLogs" (
    "Id"            SERIAL          PRIMARY KEY,
    "Message"       TEXT            NOT NULL,
    "ExceptionType" VARCHAR(250),
    "StackTrace"    TEXT,
    "Source"        VARCHAR(250),
    "RequestPath"   VARCHAR(500),
    "RequestMethod" VARCHAR(10),
    "QueryString"   VARCHAR(1000),
    "StatusCode"    INT             NOT NULL DEFAULT 500,
    "UserAgent"     VARCHAR(500),
    "ClientIp"      VARCHAR(50),
    "UserId"        INT,
    "CreatedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Add Foreign Key to Users table if Users table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Users'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_ErrorLogs_Users_UserId'
    ) THEN
        ALTER TABLE "ErrorLogs"
        ADD CONSTRAINT "FK_ErrorLogs_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- Create index on CreatedAt for fast queries and pagination
CREATE INDEX IF NOT EXISTS "IX_ErrorLogs_CreatedAt"
ON "ErrorLogs" ("CreatedAt" DESC);
