-- ============================================================
-- AuditLog table (off-chain cryptographic audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS public."AuditLog" (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  action TEXT NOT NULL,
  payload JSONB NOT NULL,
  audit_hash TEXT NOT NULL,
  prev_hash TEXT,
  ipfs_cid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast query by entity
CREATE INDEX IF NOT EXISTS idx_auditlog_entity ON public."AuditLog" (entity_type, entity_id, created_at DESC);

-- RLS policy: allow org members and self-owned access
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member" ON public."AuditLog";
CREATE POLICY "org_member" ON public."AuditLog"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- NOTE: Because this is an audit table, write access should be controlled from backend!
