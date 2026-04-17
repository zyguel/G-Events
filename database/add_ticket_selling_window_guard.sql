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

CREATE OR REPLACE FUNCTION public.adjust_ticket_windows_for_earlier_event_end()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    ticket_row record;
    next_start_at timestamp with time zone;
    next_end_at timestamp with time zone;
BEGIN
    IF NEW.event_end_at IS NULL
       OR OLD.event_end_at IS NULL
       OR NEW.event_end_at >= OLD.event_end_at THEN
        RETURN NEW;
    END IF;

    FOR ticket_row IN
        SELECT id, selling_start_at, selling_end_at
        FROM public."Ticket"
        WHERE event_id = NEW.id
    LOOP
        next_start_at := ticket_row.selling_start_at;
        next_end_at := ticket_row.selling_end_at;

        IF next_start_at IS NOT NULL
           AND next_end_at IS NOT NULL
           AND next_start_at > NEW.event_end_at
           AND next_end_at > NEW.event_end_at THEN
            next_start_at := NEW.event_end_at - interval '5 days';
            next_end_at := NEW.event_end_at;
        ELSE
            IF next_end_at IS NOT NULL AND next_end_at > NEW.event_end_at THEN
                next_end_at := NEW.event_end_at;
            END IF;

            IF next_start_at IS NOT NULL AND next_start_at > NEW.event_end_at THEN
                next_start_at := NEW.event_end_at - interval '5 days';
            END IF;
        END IF;

        IF next_start_at IS NOT NULL
           AND next_end_at IS NOT NULL
           AND next_start_at >= next_end_at THEN
            next_start_at := next_end_at - interval '5 days';
        END IF;

        IF next_start_at IS DISTINCT FROM ticket_row.selling_start_at
           OR next_end_at IS DISTINCT FROM ticket_row.selling_end_at THEN
            UPDATE public."Ticket"
            SET
                selling_start_at = next_start_at,
                selling_end_at = next_end_at
            WHERE id = ticket_row.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_adjust_ticket_windows_on_earlier_end ON public."Event";

CREATE TRIGGER trg_event_adjust_ticket_windows_on_earlier_end
AFTER UPDATE OF event_end_at ON public."Event"
FOR EACH ROW
EXECUTE FUNCTION public.adjust_ticket_windows_for_earlier_event_end();
