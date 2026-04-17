-- Migration: per-ticket free registration approval mode
-- Free tickets can opt into automatic confirmation/QR issuance; paid tickets stay manual.

ALTER TABLE public."Ticket"
ADD COLUMN IF NOT EXISTS free_ticket_approval_mode character varying NOT NULL DEFAULT 'manual';

ALTER TABLE public."Ticket"
DROP CONSTRAINT IF EXISTS ticket_free_ticket_approval_mode_check;

ALTER TABLE public."Ticket"
ADD CONSTRAINT ticket_free_ticket_approval_mode_check
CHECK (free_ticket_approval_mode IN ('manual', 'automatic'));

-- Backfill null/empty values defensively.
UPDATE public."Ticket"
SET free_ticket_approval_mode = 'manual'
WHERE free_ticket_approval_mode IS NULL
   OR btrim(free_ticket_approval_mode) = '';
