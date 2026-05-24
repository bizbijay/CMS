-- =============================================================
-- CMS — Azure SQL Database setup
-- Run AFTER creating the "CMS" database in the Azure portal,
-- with the Query Editor connected to that database (NOT master).
--
-- This script only creates the Users table; on Azure SQL you
-- create the database itself through the portal (or T-SQL on
-- master), and `USE <db>` and `CREATE DATABASE` are not
-- supported inside ad-hoc query editor sessions like they are
-- on a local SQL Server instance.
-- =============================================================

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Users...';
    CREATE TABLE dbo.Users
    (
        Id              INT             IDENTITY(1,1) NOT NULL,
        Username        NVARCHAR(50)    NOT NULL,
        Email           NVARCHAR(256)   NOT NULL,
        PasswordHash    NVARCHAR(500)   NOT NULL,
        FirstName       NVARCHAR(100)   NULL,
        LastName        NVARCHAR(100)   NULL,
        IsActive        BIT             NOT NULL CONSTRAINT DF_Users_IsActive       DEFAULT (1),
        CreatedAt       DATETIME2(0)    NOT NULL CONSTRAINT DF_Users_CreatedAt      DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(0)    NULL,
        LastLoginAt     DATETIME2(0)    NULL,
        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id)
    );

    CREATE UNIQUE INDEX UX_Users_Username ON dbo.Users (Username);
    CREATE UNIQUE INDEX UX_Users_Email    ON dbo.Users (Email);
END
ELSE
BEGIN
    PRINT 'Table dbo.Users already exists.';
END
GO

PRINT 'Azure SQL setup complete.';
GO
