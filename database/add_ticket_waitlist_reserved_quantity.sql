-- Migration: reserve seats for invited waitlist attendees

ALTER TABLE public."Ticket"
ADD COLUMN IF NOT EXISTS waitlist_reserved_quantity integer NOT NULL DEFAULT 0;

-- Ensure bad data cannot make reserved count negative.
ALTER TABLE public."Ticket"
DROP CONSTRAINT IF EXISTS ticket_waitlist_reserved_quantity_nonnegative;

ALTER TABLE public."Ticket"
ADD CONSTRAINT ticket_waitlist_reserved_quantity_nonnegative
CHECK (waitlist_reserved_quantity >= 0);
