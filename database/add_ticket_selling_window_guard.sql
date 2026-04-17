-- Migration: enforce ticket selling windows to stay within event end datetime
-- and remove legacy per-order min/max columns.

ALTER TABLE public."Ticket"
DROP COLUMN IF EXISTS min_per_user;

ALTER TABLE public."Ticket"
DROP COLUMN IF EXISTS max_per_user;

CREATE OR REPLACE FUNCTION public.validate_ticket_selling_window_against_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_end_at timestamp with time zone;
BEGIN
    IF NEW.selling_start_at IS NOT NULL
       AND NEW.selling_end_at IS NOT NULL
       AND NEW.selling_start_at >= NEW.selling_end_at THEN
        RAISE EXCEPTION 'Ticket selling_end_at must be after selling_start_at';
    END IF;

    SELECT event_end_at
      INTO v_event_end_at
      FROM public."Event"
     WHERE id = NEW.event_id;

    IF v_event_end_at IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.selling_start_at IS NOT NULL AND NEW.selling_start_at > v_event_end_at THEN
        RAISE EXCEPTION 'Ticket selling_start_at cannot be later than event_end_at';
    END IF;

    IF NEW.selling_end_at IS NOT NULL AND NEW.selling_end_at > v_event_end_at THEN
        RAISE EXCEPTION 'Ticket selling_end_at cannot be later than event_end_at';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_validate_selling_window ON public."Ticket";

CREATE TRIGGER trg_ticket_validate_selling_window
BEFORE INSERT OR UPDATE OF event_id, selling_start_at, selling_end_at
ON public."Ticket"
FOR EACH ROW
EXECUTE FUNCTION public.validate_ticket_selling_window_against_event();
