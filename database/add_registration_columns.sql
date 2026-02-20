-- ============================================
-- Add Registration Columns to Event Table
-- ============================================

-- Use this script to add the missing columns for registration dates.
-- Run this in your Supabase SQL Editor.

ALTER TABLE "Event" 
ADD COLUMN IF NOT EXISTS registration_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_end_at TIMESTAMPTZ;

-- Verify the columns were added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'Event' AND column_name LIKE 'registration_%';
