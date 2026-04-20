-- Migration: add ticket scope mapping for add-ons

CREATE TABLE IF NOT EXISTS public."AddOnTicket" (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  add_on_id integer NOT NULL,
  ticket_id integer NOT NULL,
  CONSTRAINT "AddOnTicket_pkey" PRIMARY KEY (id),
  CONSTRAINT "AddOnTicket_add_on_id_fkey" FOREIGN KEY (add_on_id) REFERENCES public."AddOn"(id) ON DELETE CASCADE,
  CONSTRAINT "AddOnTicket_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public."Ticket"(id) ON DELETE CASCADE,
  CONSTRAINT "AddOnTicket_add_on_id_ticket_id_key" UNIQUE (add_on_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS "AddOnTicket_add_on_id_idx"
  ON public."AddOnTicket" (add_on_id);

CREATE INDEX IF NOT EXISTS "AddOnTicket_ticket_id_idx"
  ON public."AddOnTicket" (ticket_id);

GRANT SELECT ON TABLE public."AddOnTicket" TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."AddOnTicket" TO authenticated;
GRANT ALL ON TABLE public."AddOnTicket" TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public."AddOnTicket_id_seq" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public."AddOnTicket_id_seq" TO service_role;

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
