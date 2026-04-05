-- Ensure Registration has the check-in tracking columns needed by QR scanning flows.
-- Safe to run multiple times.

ALTER TABLE "Registration"
ADD COLUMN IF NOT EXISTS has_checked_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_registration_event_checkin
ON "Registration" (event_id, has_checked_in);
