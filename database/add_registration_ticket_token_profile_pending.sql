-- Registration: e-ticket token (QR / magic links) and group secondary profile completion
-- Run in Supabase SQL Editor if these columns are missing.

ALTER TABLE public."Registration"
ADD COLUMN IF NOT EXISTS ticket_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS registration_ticket_token_key
ON public."Registration"(ticket_token)
WHERE ticket_token IS NOT NULL;

ALTER TABLE public."Registration"
ADD COLUMN IF NOT EXISTS profile_pending BOOLEAN NOT NULL DEFAULT false;
