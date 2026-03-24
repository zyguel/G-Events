-- Migration: Event waitlist settings persistence

CREATE TABLE IF NOT EXISTS public.EventWaitlistSettings (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL UNIQUE REFERENCES public.Event(id) ON DELETE CASCADE,
    expiry_days integer NOT NULL DEFAULT 7,
    invite_type text NOT NULL DEFAULT 'auto' CHECK (invite_type IN ('auto', 'manual')),
    show_position boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_settings_event_id
ON public.EventWaitlistSettings(event_id);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_event_waitlist_settings_updated_at ON public.EventWaitlistSettings;
CREATE TRIGGER trg_event_waitlist_settings_updated_at
BEFORE UPDATE ON public.EventWaitlistSettings
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();
