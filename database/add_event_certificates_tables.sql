-- Migration: certificate templates and issuance queue

CREATE TABLE IF NOT EXISTS public.CertificateTemplate (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL REFERENCES public.Event(id) ON DELETE CASCADE,
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
ON public.CertificateTemplate(event_id);

CREATE TABLE IF NOT EXISTS public.CertificateIssue (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL REFERENCES public.Event(id) ON DELETE CASCADE,
    template_id bigint NOT NULL REFERENCES public.CertificateTemplate(id) ON DELETE CASCADE,
    registration_id bigint NULL REFERENCES public.Registration(id) ON DELETE SET NULL,
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
ON public.CertificateIssue(event_id);

CREATE INDEX IF NOT EXISTS idx_certificate_issue_status
ON public.CertificateIssue(status);

CREATE INDEX IF NOT EXISTS idx_certificate_issue_token
ON public.CertificateIssue(access_token);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_certificate_template_updated_at ON public.CertificateTemplate;
CREATE TRIGGER trg_certificate_template_updated_at
BEFORE UPDATE ON public.CertificateTemplate
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_certificate_issue_updated_at ON public.CertificateIssue;
CREATE TRIGGER trg_certificate_issue_updated_at
BEFORE UPDATE ON public.CertificateIssue
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();
