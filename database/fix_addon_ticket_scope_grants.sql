-- Migration: fix AddOnTicket grants/policies for existing databases
-- Use this when AddOnTicket already exists but add-on updates fail under RLS.

DO $$
BEGIN
  IF to_regclass('public."AddOnTicket"') IS NULL THEN
    RAISE EXCEPTION 'AddOnTicket table is missing. Run add_addon_ticket_scope_table.sql first.';
  END IF;
END
$$;

GRANT SELECT ON TABLE public."AddOnTicket" TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."AddOnTicket" TO authenticated;
GRANT ALL ON TABLE public."AddOnTicket" TO service_role;

DO $$
BEGIN
  IF to_regclass('public."AddOnTicket_id_seq"') IS NOT NULL THEN
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public."AddOnTicket_id_seq" TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public."AddOnTicket_id_seq" TO service_role';
  END IF;
END
$$;

ALTER TABLE public."AddOnTicket" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON public."AddOnTicket";
CREATE POLICY "public_read" ON public."AddOnTicket"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "org_member" ON public."AddOnTicket";
CREATE POLICY "org_member" ON public."AddOnTicket"
  FOR ALL
  USING (
    public.is_event_org_member(
      (SELECT event_id FROM public."AddOn" WHERE id = add_on_id)
    )
  )
  WITH CHECK (
    public.is_event_org_member(
      (SELECT event_id FROM public."AddOn" WHERE id = add_on_id)
    )
  );
