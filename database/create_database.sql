-- =============================================================
-- CMS Database creation script
-- Target: Microsoft SQL Server 2019+ / Azure SQL
-- Run this in SSMS or via sqlcmd before starting the API.
-- =============================================================

IF DB_ID('CMS') IS NULL
BEGIN
    PRINT 'Creating database CMS...';
    CREATE DATABASE CMS;
END
ELSE
BEGIN
    PRINT 'Database CMS already exists.';
END
GO

USE CMS;
GO

-- -------------------------------------------------------------
-- Users table
-- -------------------------------------------------------------
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

PRINT 'CMS database setup complete.';
GO
