-- E-ticket QR tokens for breakout session check-in (one row per main Registration)
-- Run in Supabase SQL Editor.

ALTER TABLE public."BreakoutSessionRegistration"
ADD COLUMN IF NOT EXISTS ticket_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS breakout_session_registration_ticket_token_key
ON public."BreakoutSessionRegistration"(ticket_token)
WHERE ticket_token IS NOT NULL;

-- At most one breakout choice per event registration
CREATE UNIQUE INDEX IF NOT EXISTS breakout_session_registration_one_per_registration
ON public."BreakoutSessionRegistration"(registration_id);
