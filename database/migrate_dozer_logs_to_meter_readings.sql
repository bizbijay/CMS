-- Migration: Add meter readings to DozerLogs
-- This migration adds StartMeter, EndMeter, and TotalMeterRun columns alongside existing OperatedTimeMs

BEGIN;

-- Add new columns for meter readings
ALTER TABLE "DozerLogs" 
ADD COLUMN IF NOT EXISTS "StartMeter" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "EndMeter" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "TotalMeterRun" NUMERIC(10,2) DEFAULT 0;

-- Make OperatedTimeMs nullable to support both tracking methods
ALTER TABLE "DozerLogs" 
ALTER COLUMN "OperatedTimeMs" DROP NOT NULL;

-- Add constraints for meter readings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_meter_readings'
    ) THEN
        ALTER TABLE "DozerLogs"
        ADD CONSTRAINT chk_meter_readings CHECK ("EndMeter" > "StartMeter" OR ("StartMeter" = 0 AND "EndMeter" = 0));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_meter_non_negative'
    ) THEN
        ALTER TABLE "DozerLogs"
        ADD CONSTRAINT chk_meter_non_negative CHECK ("StartMeter" >= 0 AND "EndMeter" >= 0);
    END IF;
END $$;

COMMIT;
