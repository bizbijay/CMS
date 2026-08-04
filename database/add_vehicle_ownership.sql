-- Migration: Add Ownership column to Vehicles table

ALTER TABLE "Vehicles"
    ADD COLUMN IF NOT EXISTS "Ownership" VARCHAR(20) NOT NULL DEFAULT 'Owned' CHECK ("Ownership" IN ('Owned', 'Partnered'));
