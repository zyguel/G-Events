-- Migration: Combined event feature tables
-- Includes: order form entries, waitlist settings, email campaigns, certificates, and certificate ledger
-- Note: Table identifiers are quoted for Supabase/PostgreSQL compatibility.

-- Shared trigger function to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Order form entries
CREATE TABLE IF NOT EXISTS public."OrderFormEntries" (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    event_id bigint NOT NULL,
    registration_id bigint,
    order_form_id bigint NOT NULL,
    user_email character varying,
    form_data jsonb NOT NULL,
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "OrderFormEntries_pkey" PRIMARY KEY (id),
    CONSTRAINT "OrderFormEntries_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public."Event"(id) ON DELETE CASCADE,
    CONSTRAINT "OrderFormEntries_order_form_id_fkey" FOREIGN KEY (order_form_id) REFERENCES public."OrderForm"(id) ON DELETE CASCADE,
    CONSTRAINT "OrderFormEntries_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES public."Registration"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_form_entries_event_id ON public."OrderFormEntries"(event_id);
CREATE INDEX IF NOT EXISTS idx_order_form_entries_order_form_id ON public."OrderFormEntries"(order_form_id);
CREATE INDEX IF NOT EXISTS idx_order_form_entries_registration_id ON public."OrderFormEntries"(registration_id);
CREATE INDEX IF NOT EXISTS idx_order_form_entries_submitted_at ON public."OrderFormEntries"(submitted_at);
CREATE INDEX IF NOT EXISTS idx_order_form_entries_form_data ON public."OrderFormEntries" USING gin(form_data);

DROP TRIGGER IF EXISTS trg_order_form_entries_updated_at ON public."OrderFormEntries";
CREATE TRIGGER trg_order_form_entries_updated_at
BEFORE UPDATE ON public."OrderFormEntries"
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

-- Event waitlist settings
CREATE TABLE IF NOT EXISTS public."EventWaitlistSettings" (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL UNIQUE REFERENCES public."Event"(id) ON DELETE CASCADE,
    expiry_days integer NOT NULL DEFAULT 7,
    invite_type text NOT NULL DEFAULT 'auto' CHECK (invite_type IN ('auto', 'manual')),
    show_position boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_settings_event_id
ON public."EventWaitlistSettings"(event_id);

DROP TRIGGER IF EXISTS trg_event_waitlist_settings_updated_at ON public."EventWaitlistSettings";
CREATE TRIGGER trg_event_waitlist_settings_updated_at
BEFORE UPDATE ON public."EventWaitlistSettings"
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

-- Event email campaigns
CREATE TABLE IF NOT EXISTS public."EventEmailCampaign" (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL REFERENCES public."Event"(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_event_email_campaign_event_id ON public."EventEmailCampaign"(event_id);
CREATE INDEX IF NOT EXISTS idx_event_email_campaign_status ON public."EventEmailCampaign"(status);
CREATE INDEX IF NOT EXISTS idx_event_email_campaign_schedule_at ON public."EventEmailCampaign"(schedule_at);

CREATE TABLE IF NOT EXISTS public."EventEmailRecipient" (
    id bigserial PRIMARY KEY,
    campaign_id bigint NOT NULL REFERENCES public."EventEmailCampaign"(id) ON DELETE CASCADE,
    event_id bigint NOT NULL REFERENCES public."Event"(id) ON DELETE CASCADE,
    registration_id bigint NULL REFERENCES public."Registration"(id) ON DELETE SET NULL,
    email text NOT NULL,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
    error_message text NULL,
    sent_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_email_recipient_campaign_id ON public."EventEmailRecipient"(campaign_id);
CREATE INDEX IF NOT EXISTS idx_event_email_recipient_event_id ON public."EventEmailRecipient"(event_id);
CREATE INDEX IF NOT EXISTS idx_event_email_recipient_status ON public."EventEmailRecipient"(status);

DROP TRIGGER IF EXISTS trg_event_email_campaign_updated_at ON public."EventEmailCampaign";
CREATE TRIGGER trg_event_email_campaign_updated_at
BEFORE UPDATE ON public."EventEmailCampaign"
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_event_email_recipient_updated_at ON public."EventEmailRecipient";
CREATE TRIGGER trg_event_email_recipient_updated_at
BEFORE UPDATE ON public."EventEmailRecipient"
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

-- Certificate templates and issues
CREATE TABLE IF NOT EXISTS public."CertificateTemplate" (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL REFERENCES public."Event"(id) ON DELETE CASCADE,
    name text NOT NULL,
    background_image text NOT NULL,
    name_x integer NOT NULL DEFAULT 150,
    name_y integer NOT NULL DEFAULT 150,
    font_size integer NOT NULL DEFAULT 28,
    font_color text NOT NULL DEFAULT '#000000',
    created_by_email text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificate_template_event_id
ON public."CertificateTemplate"(event_id);

CREATE TABLE IF NOT EXISTS public."CertificateIssue" (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL REFERENCES public."Event"(id) ON DELETE CASCADE,
    template_id bigint NOT NULL REFERENCES public."CertificateTemplate"(id) ON DELETE CASCADE,
    registration_id bigint NULL REFERENCES public."Registration"(id) ON DELETE SET NULL,
    recipient_name text NOT NULL,
    recipient_email text NOT NULL,
    access_token text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'issued' CHECK (status IN ('queued', 'issued', 'sent', 'failed')),
    issued_at timestamptz NULL,
    sent_at timestamptz NULL,
    error_message text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_certificate_issue UNIQUE (template_id, registration_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_certificate_issue_event_id
ON public."CertificateIssue"(event_id);

CREATE INDEX IF NOT EXISTS idx_certificate_issue_status
ON public."CertificateIssue"(status);

CREATE INDEX IF NOT EXISTS idx_certificate_issue_token
ON public."CertificateIssue"(access_token);

DROP TRIGGER IF EXISTS trg_certificate_template_updated_at ON public."CertificateTemplate";
CREATE TRIGGER trg_certificate_template_updated_at
BEFORE UPDATE ON public."CertificateTemplate"
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_certificate_issue_updated_at ON public."CertificateIssue";
CREATE TRIGGER trg_certificate_issue_updated_at
BEFORE UPDATE ON public."CertificateIssue"
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

-- Certificate blockchain-style ledger
CREATE TABLE IF NOT EXISTS public."CertificateLedger" (
    id bigserial PRIMARY KEY,
    issue_id bigint NOT NULL UNIQUE REFERENCES public."CertificateIssue"(id) ON DELETE CASCADE,
    block_index bigint NOT NULL UNIQUE,
    previous_hash text NULL,
    certificate_hash text NOT NULL,
    block_hash text NOT NULL UNIQUE,
    block_timestamp timestamptz NOT NULL DEFAULT now(),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificate_ledger_issue_id
ON public."CertificateLedger"(issue_id);

CREATE INDEX IF NOT EXISTS idx_certificate_ledger_block_index
ON public."CertificateLedger"(block_index);

CREATE INDEX IF NOT EXISTS idx_certificate_ledger_block_hash
ON public."CertificateLedger"(block_hash);
