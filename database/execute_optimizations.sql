-- =============================================================================
-- SUPABASE PERFORMANCE OPTIMIZATIONS - EXECUTABLE SCRIPT
-- Run this entire file in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE INDEXES (Safe - Run First)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_registration_status ON public."Registration" USING btree (status);
CREATE INDEX IF NOT EXISTS idx_registration_created_at ON public."Registration" USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_registration_status_created_at ON public."Registration" USING btree (status, created_at);
CREATE INDEX IF NOT EXISTS idx_registration_event_id ON public."Registration" USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_registration_user_id ON public."Registration" USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entry_status ON public."WaitlistEntry" USING btree (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_entry_event_id ON public."WaitlistEntry" USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_org_user_role_org_id ON public."OrganizationUserRole" USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_user_role_user_id ON public."OrganizationUserRole" USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_lower ON public."User" USING btree (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_event_organization_id ON public."Event" USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_event_is_published ON public."Event" USING btree (is_published);
CREATE INDEX IF NOT EXISTS idx_ticket_event_id ON public."Ticket" USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_addon_event_id ON public."AddOn" USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_addon_variant_addon_id ON public."AddOnVariant" USING btree (add_on_id);
CREATE INDEX IF NOT EXISTS idx_attendee_entitlement_registration_id ON public."AttendeeEntitlement" USING btree (registration_id);
CREATE INDEX IF NOT EXISTS idx_breakout_session_event_id ON public."BreakoutSession" USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_form_event_id ON public."FeedbackForm" USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_answer_submission_id ON public."FeedbackAnswer" USING btree (feedback_submission_id);
CREATE INDEX IF NOT EXISTS idx_payment_proof_registration_id ON public."PaymentProof" USING btree (registration_id);
CREATE INDEX IF NOT EXISTS idx_certificate_issue_registration_id ON public."CertificateIssue" USING btree (registration_id);

-- =============================================================================
-- PART 2: UPDATE STATISTICS
-- =============================================================================

ANALYZE public."Registration";
ANALYZE public."Event";
ANALYZE public."WaitlistEntry";
ANALYZE public."OrganizationUserRole";
ANALYZE public."User";
ANALYZE public."Ticket";
ANALYZE public."AddOn";
ANALYZE public."AddOnVariant";
ANALYZE public."AttendeeEntitlement";
ANALYZE public."BreakoutSession";
ANALYZE public."FeedbackForm";
ANALYZE public."FeedbackAnswer";

-- =============================================================================
-- PART 3: RLS POLICY OPTIMIZATIONS
-- 
-- These statements fix the "auth_rls_initplan" warnings by wrapping auth
-- function calls in (select ...) to prevent per-row re-evaluation.
-- 
-- WARNING: These drop and recreate policies. Test in staging first!
-- =============================================================================

-- Helper function to safely recreate policies with auth function optimization
CREATE OR REPLACE FUNCTION optimize_rls_policy(
    p_table text,
    p_policy text,
    p_action text,
    p_roles text[],
    p_using text,
    p_with_check text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_sql text;
BEGIN
    -- Drop existing policy if exists
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy, p_table);
    
    -- Create optimized policy
    IF p_with_check IS NOT NULL THEN
        v_sql := format(
            'CREATE POLICY %I ON %I FOR %s TO %s USING (%s) WITH CHECK (%s)',
            p_policy, p_table, p_action, array_to_string(p_roles, ','), p_using, p_with_check
        );
    ELSE
        v_sql := format(
            'CREATE POLICY %I ON %I FOR %s TO %s USING (%s)',
            p_policy, p_table, p_action, array_to_string(p_roles, ','), p_using
        );
    END IF;
    
    EXECUTE v_sql;
    RAISE NOTICE 'Created optimized policy % on %', p_policy, p_table;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- OPTIMIZED POLICY RECREATIONS
-- Replace auth.uid() and auth.jwt() with (select auth.uid()) and (select auth.jwt())
-- =============================================================================

-- User table policies (Fix: auth.uid() → (select auth.uid()))
SELECT optimize_rls_policy('User', 'self', 'ALL', ARRAY['authenticated'], 
    '(select auth.uid())::text = id::text');

SELECT optimize_rls_policy('User', 'org_read', 'SELECT', ARRAY['authenticated'], 
    'EXISTS (SELECT 1 FROM "OrganizationUserRole" WHERE user_id = "User".id AND organization_id IN (
        SELECT ou.organization_id FROM "OrganizationUserRole" ou 
        WHERE ou.user_id = (select auth.uid())::integer
    ))');

SELECT optimize_rls_policy('User', 'org_admin', 'ALL', ARRAY['authenticated'],
    'EXISTS (SELECT 1 FROM "OrganizationUserRole" our 
     JOIN "OrganizationRole" orole ON our.organization_role_id = orole.id
     JOIN "OrganizationRolePermission" orp ON orole.id = orp.organization_role_id
     JOIN "OrganizationPermission" op ON orp.organization_permission_id = op.id
     WHERE our.user_id = "User".id 
     AND our.user_id = (select auth.uid())::integer
     AND op.name = ''admin'')');

-- OrderFormEntries policies
SELECT optimize_rls_policy('OrderFormEntries', 'self_or_org', 'ALL', ARRAY['authenticated'],
    'user_email = (select auth.jwt())->>''email'' OR 
     EXISTS (SELECT 1 FROM "Registration" r 
     JOIN "Event" e ON r.event_id = e.id 
     WHERE r.id = "OrderFormEntries".registration_id 
     AND e.organization_id IN (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer))');

SELECT optimize_rls_policy('OrderFormEntries', 'public_insert', 'INSERT', ARRAY['anon', 'authenticated'],
    'true',
    'true');

-- Registration policies
SELECT optimize_rls_policy('Registration', 'public_insert', 'INSERT', ARRAY['anon', 'authenticated'],
    'true',
    'true');

SELECT optimize_rls_policy('Registration', 'self_or_org', 'ALL', ARRAY['authenticated'],
    'user_id = (select auth.uid())::integer OR 
     EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "Registration".event_id 
     AND e.organization_id IN (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer))');

-- WaitlistEntry policies
SELECT optimize_rls_policy('WaitlistEntry', 'self_or_org', 'ALL', ARRAY['authenticated'],
    'email = (select auth.jwt())->>''email'' OR 
     EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "WaitlistEntry".event_id 
     AND e.organization_id IN (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer))');

SELECT optimize_rls_policy('WaitlistEntry', 'public_insert', 'INSERT', ARRAY['anon', 'authenticated'],
    'true',
    'true');

-- AddOnRedemption policies
SELECT optimize_rls_policy('AddOnRedemption', 'public_insert', 'INSERT', ARRAY['anon', 'authenticated'],
    'true',
    'true');

SELECT optimize_rls_policy('AddOnRedemption', 'self_or_org', 'ALL', ARRAY['authenticated'],
    'EXISTS (SELECT 1 FROM "Registration" r 
     WHERE r.id = "AddOnRedemption".registration_id 
     AND (r.user_id = (select auth.uid())::integer OR 
     EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = r.event_id 
     AND e.organization_id IN (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer))))');

-- FeedbackForm policies
SELECT optimize_rls_policy('FeedbackForm', 'feedback_form_all_service', 'ALL', ARRAY['authenticated'],
    'EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "FeedbackForm".event_id 
     AND e.organization_id IN (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer))');

SELECT optimize_rls_policy('FeedbackForm', 'feedback_form_select_all', 'SELECT', ARRAY['anon', 'authenticated'],
    'true');

-- FeedbackQuestion policies
SELECT optimize_rls_policy('FeedbackQuestion', 'feedback_question_all_service', 'ALL', ARRAY['authenticated'],
    'EXISTS (SELECT 1 FROM "FeedbackForm" ff 
     JOIN "Event" e ON ff.event_id = e.id 
     WHERE ff.id = "FeedbackQuestion".feedback_form_id 
     AND e.organization_id IN (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer))');

SELECT optimize_rls_policy('FeedbackQuestion', 'feedback_question_select_all', 'SELECT', ARRAY['anon', 'authenticated'],
    'true');

-- FeedbackSubmission policies
SELECT optimize_rls_policy('FeedbackSubmission', 'feedback_submission_select_auth', 'SELECT', ARRAY['authenticated'],
    'EXISTS (SELECT 1 FROM "Registration" r 
     WHERE r.id = "FeedbackSubmission".registration_id 
     AND r.user_id = (select auth.uid())::integer) OR 
     EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "FeedbackSubmission".event_id 
     AND e.organization_id IN (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer))');

-- FeedbackAnswer policies
SELECT optimize_rls_policy('FeedbackAnswer', 'feedback_answer_select_auth', 'SELECT', ARRAY['authenticated'],
    'EXISTS (SELECT 1 FROM "Registration" r 
     WHERE r.id = "FeedbackAnswer".registration_id 
     AND r.user_id = (select auth.uid())::integer) OR 
     EXISTS (SELECT 1 FROM "FeedbackForm" ff 
     JOIN "Event" e ON ff.event_id = e.id 
     WHERE ff.id = "FeedbackAnswer".feedback_form_id 
     AND e.organization_id IN (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer))');

SELECT optimize_rls_policy('FeedbackAnswer', 'feedback_answer_insert_anon', 'INSERT', ARRAY['anon', 'authenticated'],
    'true',
    'true');

-- Consolidated policies to replace multiple permissive policies
-- These combine multiple policies into single policies per role/action

-- AddOn - Consolidated SELECT policy
DROP POLICY IF EXISTS org_member ON "AddOn";
DROP POLICY IF EXISTS public_read ON "AddOn";
SELECT optimize_rls_policy('AddOn', 'addon_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "AddOn".event_id 
     AND (e.is_published = true OR e.organization_id IN 
     (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer)))');

-- Event - Consolidated SELECT policy
DROP POLICY IF EXISTS org_member ON "Event";
DROP POLICY IF EXISTS public_read ON "Event";
SELECT optimize_rls_policy('Event', 'event_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'is_published = true OR is_visible = true OR organization_id IN 
    (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer)');

-- Ticket - Consolidated SELECT policy
DROP POLICY IF EXISTS org_member ON "Ticket";
DROP POLICY IF EXISTS public_read ON "Ticket";
SELECT optimize_rls_policy('Ticket', 'ticket_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "Ticket".event_id 
     AND (e.is_published = true OR e.organization_id IN 
     (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer)))');

-- BreakoutSession - Consolidated SELECT policy
DROP POLICY IF EXISTS org_member ON "BreakoutSession";
DROP POLICY IF EXISTS public_read ON "BreakoutSession";
SELECT optimize_rls_policy('BreakoutSession', 'breakout_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "BreakoutSession".event_id 
     AND (e.is_published = true OR e.organization_id IN 
     (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer)))');

-- AgendaSlot - Consolidated SELECT policy
DROP POLICY IF EXISTS org_member ON "AgendaSlot";
DROP POLICY IF EXISTS public_read ON "AgendaSlot";
SELECT optimize_rls_policy('AgendaSlot', 'agenda_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "AgendaSlot".event_id 
     AND (e.is_published = true OR e.organization_id IN 
     (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer)))');

-- AddOnVariant - Consolidated SELECT policy
DROP POLICY IF EXISTS org_member ON "AddOnVariant";
DROP POLICY IF EXISTS public_read ON "AddOnVariant";
SELECT optimize_rls_policy('AddOnVariant', 'addon_variant_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'EXISTS (SELECT 1 FROM "AddOn" a 
     JOIN "Event" e ON a.event_id = e.id 
     WHERE a.id = "AddOnVariant".add_on_id 
     AND (e.is_published = true OR e.organization_id IN 
     (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer)))');

-- AddOnTicket - Consolidated SELECT policy
DROP POLICY IF EXISTS org_member ON "AddOnTicket";
DROP POLICY IF EXISTS public_read ON "AddOnTicket";
SELECT optimize_rls_policy('AddOnTicket', 'addon_ticket_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'EXISTS (SELECT 1 FROM "AddOn" a 
     JOIN "Event" e ON a.event_id = e.id 
     WHERE a.id = "AddOnTicket".add_on_id 
     AND (e.is_published = true OR e.organization_id IN 
     (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer)))');

-- Promotion - Consolidated SELECT policy
DROP POLICY IF EXISTS org_member ON "Promotion";
DROP POLICY IF EXISTS public_read ON "Promotion";
SELECT optimize_rls_policy('Promotion', 'promotion_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'EXISTS (SELECT 1 FROM "Event" e 
     WHERE e.id = "Promotion".event_id 
     AND (e.is_published = true OR e.organization_id IN 
     (SELECT ou.organization_id FROM "OrganizationUserRole" ou 
     WHERE ou.user_id = (select auth.uid())::integer)))');

-- Role - Consolidated SELECT policy
DROP POLICY IF EXISTS org_admin ON "Role";
DROP POLICY IF EXISTS public_read ON "Role";
SELECT optimize_rls_policy('Role', 'role_select', 'SELECT', ARRAY['anon', 'authenticated'],
    'true');

-- Clean up helper function
DROP FUNCTION IF EXISTS optimize_rls_policy(text, text, text, text[], text, text);

-- =============================================================================
-- PART 4: OPTIMIZATION COMPLETE
-- =============================================================================

SELECT 'Optimization complete! Created ' || 
       (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND indexdef LIKE '%CREATE INDEX%') ||
       ' indexes and optimized RLS policies.' AS status;
