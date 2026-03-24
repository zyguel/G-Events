-- Migration: Add email campaign + recipient queue tables

CREATE TABLE IF NOT EXISTS public.EventEmailCampaign (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL REFERENCES public.Event(id) ON DELETE CASCADE,
    subject text NOT NULL,
    body_html text NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    send_mode text NOT NULL DEFAULT 'attendees' CHECK (send_mode IN ('preview', 'attendees')),
    filters jsonb NOT NULL DEFAULT '{}'::jsonb,
    recipient_count integer NOT NULL DEFAULT 0,
    schedule_at timestamptz NULL,
    sent_at timestamptz NULL,
    created_by_email text NULL,
    error_message text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_email_campaign_event_id ON public.EventEmailCampaign(event_id);
CREATE INDEX IF NOT EXISTS idx_event_email_campaign_status ON public.EventEmailCampaign(status);
CREATE INDEX IF NOT EXISTS idx_event_email_campaign_schedule_at ON public.EventEmailCampaign(schedule_at);

CREATE TABLE IF NOT EXISTS public.EventEmailRecipient (
    id bigserial PRIMARY KEY,
    campaign_id bigint NOT NULL REFERENCES public.EventEmailCampaign(id) ON DELETE CASCADE,
    event_id bigint NOT NULL REFERENCES public.Event(id) ON DELETE CASCADE,
    registration_id bigint NULL REFERENCES public.Registration(id) ON DELETE SET NULL,
    email text NOT NULL,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
    error_message text NULL,
    sent_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_email_recipient_campaign_id ON public.EventEmailRecipient(campaign_id);
CREATE INDEX IF NOT EXISTS idx_event_email_recipient_event_id ON public.EventEmailRecipient(event_id);
CREATE INDEX IF NOT EXISTS idx_event_email_recipient_status ON public.EventEmailRecipient(status);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_event_email_campaign_updated_at ON public.EventEmailCampaign;
CREATE TRIGGER trg_event_email_campaign_updated_at
BEFORE UPDATE ON public.EventEmailCampaign
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_event_email_recipient_updated_at ON public.EventEmailRecipient;
CREATE TRIGGER trg_event_email_recipient_updated_at
BEFORE UPDATE ON public.EventEmailRecipient
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();
