-- Enable RLS on Event table and add policies for authenticated users
-- This fixes the banner upload issue where upload succeeds but linking to event fails

ALTER TABLE public."Event" ENABLE ROW LEVEL SECURITY;

-- SELECT policy for authenticated users (allows viewing events in their org or published events)
DROP POLICY IF EXISTS event_select ON "Event";

CREATE POLICY event_select ON "Event"
  FOR SELECT
  TO authenticated
  USING (
    is_published = true OR is_visible = true OR organization_id IN (
      SELECT ou.organization_id 
      FROM "OrganizationUserRole" ou 
      JOIN "User" u ON ou.user_id = u.id
      WHERE u.email = (select auth.jwt()->>'email')
    )
  );

-- UPDATE policy for authenticated users (allows updating events in their org)
DROP POLICY IF EXISTS event_update ON "Event";

CREATE POLICY event_update ON "Event"
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT ou.organization_id 
      FROM "OrganizationUserRole" ou 
      JOIN "User" u ON ou.user_id = u.id
      WHERE u.email = (select auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT ou.organization_id 
      FROM "OrganizationUserRole" ou 
      JOIN "User" u ON ou.user_id = u.id
      WHERE u.email = (select auth.jwt()->>'email')
    )
  );

-- INSERT policy for authenticated users (allows creating events in their org)
DROP POLICY IF EXISTS event_insert ON "Event";

CREATE POLICY event_insert ON "Event"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT ou.organization_id 
      FROM "OrganizationUserRole" ou 
      JOIN "User" u ON ou.user_id = u.id
      WHERE u.email = (select auth.jwt()->>'email')
    )
  );
