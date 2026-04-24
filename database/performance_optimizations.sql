-- =============================================================================
-- SUPABASE PERFORMANCE & SECURITY OPTIMIZATIONS
-- Execute these statements in Supabase SQL Editor (in order)
-- =============================================================================

-- =============================================================================
-- SECTION 1: CREATE MISSING INDEXES (High Impact - Do First)
-- These indexes target the most frequently queried columns per query stats
-- =============================================================================

-- Index on Registration.status (queried 47k+ times, avg 137ms → can reduce to ~2ms)
CREATE INDEX IF NOT EXISTS idx_registration_status ON public."Registration" USING btree (status);

-- Index on Registration.created_at (queried 47k+ times for date filtering)
CREATE INDEX IF NOT EXISTS idx_registration_created_at ON public."Registration" USING btree (created_at);

-- Composite index for common query pattern: status + created_at range queries
CREATE INDEX IF NOT EXISTS idx_registration_status_created_at ON public."Registration" USING btree (status, created_at);

-- Index on Registration.event_id (frequently joined with Event table)
CREATE INDEX IF NOT EXISTS idx_registration_event_id ON public."Registration" USING btree (event_id);

-- Index on WaitlistEntry.status (queried 47k+ times)
CREATE INDEX IF NOT EXISTS idx_waitlist_entry_status ON public."WaitlistEntry" USING btree (status);

-- Index on OrganizationUserRole.organization_id (queried 14k+ times)
CREATE INDEX IF NOT EXISTS idx_org_user_role_org_id ON public."OrganizationUserRole" USING btree (organization_id);

-- Index on User.email for ILIKE searches (currently doing sequential scans)
CREATE INDEX IF NOT EXISTS idx_user_email_lower ON public."User" USING btree (LOWER(email));

-- Index on Event.organization_id (frequently filtered in admin queries)
CREATE INDEX IF NOT EXISTS idx_event_organization_id ON public."Event" USING btree (organization_id);

-- Index on Ticket.event_id (frequently joined)
CREATE INDEX IF NOT EXISTS idx_ticket_event_id ON public."Ticket" USING btree (event_id);

-- Index on AddOn.event_id (frequently joined)
CREATE INDEX IF NOT EXISTS idx_addon_event_id ON public."AddOn" USING btree (event_id);

-- =============================================================================
-- SECTION 2: ANALYZE TABLES (Update query planner statistics)
-- =============================================================================

ANALYZE public."Registration";
ANALYZE public."Event";
ANALYZE public."WaitlistEntry";
ANALYZE public."OrganizationUserRole";
ANALYZE public."User";
ANALYZE public."Ticket";
ANALYZE public."AddOn";

-- =============================================================================
-- SECTION 3: RLS POLICY OPTIMIZATION FIXES
-- 
-- CRITICAL: The following section fixes RLS policies that re-evaluate 
-- auth functions per row. This is causing MAJOR performance degradation.
-- 
-- Replace: auth.uid() or auth.jwt() 
-- With:    (select auth.uid()) or (select auth.jwt())
--
-- This caches the function result at plan time instead of per-row evaluation.
-- =============================================================================

-- Note: The actual policy definitions need to be reviewed and updated.
-- Below are template statements to identify and fix problematic policies.

-- View current RLS policies to identify which need fixing:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public';

-- =============================================================================
-- EXAMPLE FIX TEMPLATES (apply these patterns to your actual policies):
-- =============================================================================

-- For OrderFormEntries table - policy 'self_or_org' and 'public_insert'
-- BEFORE: ... auth.uid() = user_id ...
-- AFTER:  ... (select auth.uid()) = user_id ...

-- For Registration table - policy 'public_insert'
-- BEFORE: ... auth.uid() ...
-- AFTER:  ... (select auth.uid()) ...

-- For WaitlistEntry table - policies 'self_or_org' and 'public_insert'
-- BEFORE: ... auth.uid() ...
-- AFTER:  ... (select auth.uid()) ...

-- For AddOnRedemption table - policy 'public_insert'
-- BEFORE: ... auth.uid() ...
-- AFTER:  ... (select auth.uid()) ...

-- For User table - policies 'self' and 'org_read'
-- BEFORE: ... auth.uid() ...
-- AFTER:  ... (select auth.uid()) ...

-- For FeedbackForm table - policy 'feedback_form_all_service'
-- BEFORE: ... auth.jwt() ...
-- AFTER:  ... (select auth.jwt()) ...

-- For FeedbackQuestion table - policy 'feedback_question_all_service'
-- BEFORE: ... auth.jwt() ...
-- AFTER:  ... (select auth.jwt()) ...

-- For FeedbackSubmission table - policy 'feedback_submission_select_auth'
-- BEFORE: ... auth.uid() ...
-- AFTER:  ... (select auth.uid()) ...

-- For FeedbackAnswer table - policy 'feedback_answer_select_auth'
-- BEFORE: ... auth.uid() ...
-- AFTER:  ... (select auth.uid()) ...

-- =============================================================================
-- SECTION 4: MULTIPLE PERMISSIVE POLICIES CONSOLIDATION RECOMMENDATIONS
-- 
-- These tables have multiple permissive policies for the same role/action.
-- Each policy is evaluated for EVERY query, causing performance overhead.
-- 
-- SOLUTION: Combine related policies using OR conditions where possible.
-- =============================================================================

-- Tables with multiple SELECT policies (consider consolidating):
-- - AddOn, AddOnTicket, AddOnVariant, AgendaSlot, BreakoutSession, Event
-- - FeedbackForm, FeedbackQuestion, Promotion, Ticket, Role, User

-- Tables with multiple INSERT policies (consider consolidating):
-- - AddOnRedemption, FeedbackAnswer, OrderFormEntries, Registration, WaitlistEntry

-- Example consolidation pattern:
-- Instead of:
--   CREATE POLICY org_member ON "Event" FOR SELECT USING (organization_id IN (...));
--   CREATE POLICY public_read ON "Event" FOR SELECT USING (is_published = true);
-- 
-- Use:
--   CREATE POLICY event_select ON "Event" FOR SELECT USING (
--     organization_id IN (...) OR is_published = true
--   );

-- =============================================================================
-- SECTION 5: ADDITIONAL PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Enable parallel query execution (if not already enabled)
SET max_parallel_workers_per_gather = 4;

-- Update table statistics for better query planning
-- (Already done in SECTION 2)

-- Consider partitioning for high-volume tables if they grow very large:
-- - Registration (already high volume: 47k+ queries)
-- - WaitlistEntry (47k+ queries)
-- - AuditLog (if high volume)

-- =============================================================================
-- SECTION 6: MONITORING QUERIES (Run these to verify improvements)
-- =============================================================================

-- Check index usage after running for a while:
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan,
--     idx_tup_read,
--     idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Check slow queries:
-- SELECT 
--     query,
--     calls,
--     mean_exec_time,
--     total_exec_time
-- FROM pg_stat_statements 
-- WHERE query LIKE '%Registration%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- =============================================================================
-- SECTION 7: POST-OPTIMIZATION CHECKLIST
-- =============================================================================

-- 1. Run the linter again to verify RLS fixes:
--    SELECT * FROM lint();

-- 2. Test your application queries to ensure they still work correctly

-- 3. Monitor query performance for 24-48 hours after deployment

-- 4. Check for any new missing indexes that may appear

-- =============================================================================
-- EXECUTION ORDER RECOMMENDATION:
-- =============================================================================
-- 1. First, run SECTION 1 (CREATE INDEX statements) - immediate performance gain
-- 2. Run SECTION 2 (ANALYZE) - updates query planner stats
-- 3. Review and apply SECTION 3 fixes to your RLS policies manually
-- 4. Consider consolidating policies per SECTION 4 recommendations
-- 5. Use SECTION 6 queries to verify improvements
-- =============================================================================
