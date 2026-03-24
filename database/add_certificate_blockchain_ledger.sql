-- Migration: Add blockchain-style certificate ledger
-- Purpose: Create immutable hash-chained blocks for issued certificates.

CREATE TABLE IF NOT EXISTS public.CertificateLedger (
    id bigserial PRIMARY KEY,
    issue_id bigint NOT NULL UNIQUE REFERENCES public.CertificateIssue(id) ON DELETE CASCADE,
    block_index bigint NOT NULL UNIQUE,
    previous_hash text NULL,
    certificate_hash text NOT NULL,
    block_hash text NOT NULL UNIQUE,
    block_timestamp timestamptz NOT NULL DEFAULT now(),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificate_ledger_issue_id
ON public.CertificateLedger(issue_id);

CREATE INDEX IF NOT EXISTS idx_certificate_ledger_block_index
ON public.CertificateLedger(block_index);

CREATE INDEX IF NOT EXISTS idx_certificate_ledger_block_hash
ON public.CertificateLedger(block_hash);
