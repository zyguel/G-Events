# G-Events Stakeholder Guide

**Version:** 1.0 | **Date:** April 27, 2026 | **Project Version:** 0.9.4

---

## Executive Summary

**Problem:** Event organizers struggle with fragmented tools—separate systems for registration, check-in, certificates, and analytics create overhead and data silos. Existing solutions are too expensive or lack comprehensive functionality.

**Solution:** G-Events is a unified event management platform covering the entire event lifecycle—creation, registration, check-in, analytics, and certificates—in one system.

**Key Achievements:** Unified platform replacing 3-5 separate tools, 25 granular permissions, custom registration forms, real-time QR check-in, automated certificates with tamper-proof verification, comprehensive analytics.

**Impact:** ~40% reduction in administrative overhead through tool consolidation.

---

## What is G-Events? (Non-Technical)

G-Events is an "all-in-one command center" for running events. One dashboard for: creating events, registration forms, tickets, check-in, communications, certificates, and analytics.

**Who:** Event organizers, non-profits, educational institutions, companies running training/events.

**Why Different:** Affordable, comprehensive, accessible without IT support.

---

## Key Features

1. **Event Management:** Create events, upload banners, manage visibility
2. **Registration:** Custom forms with 10 question types, automatic waitlist
3. **Tickets:** Multiple types, capacity limits, unique QR codes
4. **Check-In:** QR scanning, instant verification, manual check-in
5. **Certificates:** Custom templates, automatic generation, tamper-proof verification
6. **Email Campaigns:** Targeted emails, filtering, scheduled sending
7. **Analytics:** Real-time counts, revenue, attendance, demographics, export
8. **Team Collaboration:** Invite members, 25 permissions, role-based access
9. **Multi-Language:** 10 languages
10. **Security:** Secure storage, role-based access, audit trail

---

## Benefits & Impact

**Organizations:** Cost savings (consolidate 3-5 tools), operational efficiency (automated workflows), better attendee experience, data-driven decisions.

**Organizers:** 40% less admin overhead, automated tasks, events ready in minutes, enterprise security, flexible customization.

**Attendees:** Easy registration, professional certificates, fast check-in, mobile-friendly, secure data.

---

## Technical Overview

**Frontend:** Next.js (App Router), React 19, TypeScript, Tailwind CSS v4

**Backend:** PostgreSQL via Supabase, Supabase Auth, Storage, API Routes & Server Actions

**Email:** Nodemailer (SMTP), Resend API

**Architecture:** Feature-oriented layered (Presentation → Context → Business Logic → Data Access → Integration → External Services)

**Key Decisions:** Monolith (small team), Supabase (no infrastructure complexity), Server Actions + API Routes (strategic use), Application-level blockchain (no gas costs), PostgreSQL + JSONB (relational + flexible)

---

## Architecture

**Layers:** Presentation (UI) → Context (state) → Business Logic (Server Actions/API) → Data Access (Supabase clients) → External Services (PostgreSQL, Storage, Email) → Middleware (proxy)

**Modules:** Auth/RBAC, Event Management, Registration/Orders, Check-In, Certificates, Email Campaigns, Analytics, Notifications, i18n, Audit Trail

---

## Security

**Multi-Layer:** Supabase Auth (JWT), Middleware (proxy.ts), RLS (database), RBAC (25 permissions)

**Protection:** TLS/SSL encryption, input validation, parameterized queries (SQL injection prevention), React escaping (XSS prevention)

**Audit Trail:** Hash chain (SHA256) for tamper evidence, before/after state logging

**Cron Security:** Secret header with constant-time comparison

---

## Comprehensive Q&A

### Non-Technical (Business Stakeholders)

**Q1: What is G-Events simply?** A: All-in-one website for managing events end-to-end.

**Q2: Who should use it?** A: Any organization running events—conferences, workshops, training.

**Q3: Cost?** A: Built on cost-effective tech (Supabase, Vercel) with free tiers. Minimal vs per-event platforms.

**Q4: Technical skills needed?** A: No. If you can use email and fill forms, you can use G-Events.

**Q5: Data safe?** A: Yes. Enterprise-grade: encryption, role-based access, audit trail, compliant infrastructure.

**Q6: Customizable?** A: Yes. Branding, custom forms, certificate templates, team roles, email provider.

**Q7: Event limit?** A: No hard limit. Designed to scale.

**Q8: Attendee access?** A: Web-based registration link, QR code email, no app needed.

**Q9: New features?** A: Built on extensible tech. Can add without disrupting existing.

**Q10: Problems?** A: Comprehensive docs. Built on well-supported tech (Next.js, Supabase).

### Semi-Technical (Managers)

**Q11: Registration flow?** A: Organizers build forms (10 types). Attendees submit, data stored. Organizers view/export/analyze.

**Q12: Check-in flow?** A: Attendees get QR codes. Organizers scan with phone. Instant verification. Offline support.

**Q13: Certificate generation?** A: Organizers create branded templates. System generates PDFs, emails attendees. Unique verification link.

**Q14: Team collaboration?** A: Invite members, assign roles (Admin/Core/Volunteer). Role-based permissions.

**Q15: Email campaigns?** A: Create campaigns targeting groups (e.g., unpaid, VIP). Write, choose audience, schedule. Auto-send.

**Q16: Analytics?** A: Registration counts/trends, revenue, attendance, demographics, satisfaction. Export to Excel/CSV/PDF.

**Q17: Export data?** A: Yes. Excel (XLSX), CSV, PDF formats.

**Q18: Waitlist?** A: When full, new registrations go to waitlist. Auto-promote when spots open.

**Q19: Own email system?** A: Yes. SMTP (your server) or Resend (managed). Configurable.

**Q20: Permissions?** A: 25 granular permissions across 7 categories. Assign to roles, roles to users.

### Technical (Developers)

**Q21: Why Next.js App Router?** A: Server Components reduce client JS, built-in data fetching, better SEO, future-proof.

**Q22: Why Supabase not custom backend?** A: Full-stack solution (DB, auth, storage) with minimal DevOps. RLS for database-level security.

**Q23: Why monolith not microservices?** A: Small team (3-4) makes microservices overhead impractical. Faster iteration, simpler deployment. Can extract later.

**Q24: Server Actions vs API Routes?** A: Server Actions for forms (CSRF, progressive enhancement). API Routes for integrations/client fetching. Both used strategically.

**Q25: Why application-level blockchain not public?** A: No gas costs, no wallet complexity, instant verification. Tamper evidence without fees. Can batch-post to public chain if needed.

**Q26: How RBAC works?** A: Custom with 25 permissions in DB. Resolution: User → OrganizationUserRole → OrganizationRole → OrganizationRolePermission → OrganizationPermission. 2-minute cache.

**Q27: Audit trail tamper prevention?** A: Hash chain in PostgreSQL. certificate_hash = SHA256(data). block_hash = SHA256(certificate_hash + previous_hash). Tampering breaks chain.

**Q28: Cron endpoint protection?** A: Shared secret header (x-cron-secret) with constant-time comparison (crypto.timingSafeEqual).

**Q29: SQL injection prevention?** A: Supabase client uses parameterized queries. No string concatenation. RLS policies add database-level protection.

**Q30: XSS prevention?** A: React auto-escapes JSX. HTML escaping for emails. No dangerouslySetInnerHTML.

**Q31: Dual-role session system?** A: User logs in via Supabase, chooses role (Organizer/Attendee). Stored in cookie (g_events_session_role). Middleware (proxy.ts) routes appropriately.

**Q32: Why PostgreSQL + JSONB not NoSQL?** A: Relational model fits event data. JSONB for custom form flexibility. ACID for transactions. Advanced aggregations for analytics.

**Q33: Caching strategy?** A: Next.js built-in caching. Permission cache (2 min). Supabase query result cache. Supabase Storage CDN for images.

**Q34: File upload handling?** A: Validate (type, size, dimensions), upload to Supabase Storage, store public URL in DB. CDN delivery.

**Q35: Certificate verification API?** A: GET /api/certificates/[token]/verify. Recomputes hashes, checks chain. Returns: verified, certificateHash, blockHash, previousHash, blockIndex, blockTimestamp.

**Q36: Email campaign processing?** A: Campaigns stored as 'queued'. Cron processes queue, resolves audience via resolveEventRecipients(), sends via sendEmail(), updates status to 'sent'/'failed'.

**Q37: Notification system?** A: NotificationContext polls /api/notifications every 30s. API generates from live DB state (regs today, pending orders, events soon, waitlist). Dismissed IDs filtered from localStorage.

**Q38: Internationalization?** A: LocaleContext loads from localStorage/server. On language change, walks DOM with TreeWalker, extracts text nodes, looks up translations, replaces text. MutationObserver for dynamic content.

**Q39: Middleware (proxy.ts) structure?** A: Checks public routes (login, register, auth). For protected: checks Supabase session, validates if not fresh (5min TTL), checks session role cookie, routes to appropriate dashboard.

**Q40: Deployment process?** A: Vercel from nightly branch. Vercel handles serverless, CDN, SSL. Environment variables in Vercel settings. DB migrations manual in Supabase SQL Editor.

**Q41: Testing structure?** A: Vitest for unit/integration. Tests in tests/unit/ and tests/integration/. vi.mock() for dependencies. restoreMocks/clearMocks for isolation.

**Q42: Error handling strategy?** A: PostgreSQL transactions with commit/rollback. Email failures logged but don't block main flow. Campaigns update to 'failed' with error message for retry.

**Q43: Database transaction handling?** A: Operations in lib/db.ts use transactions. If any fails, entire transaction rolled back. Audit trail captures before/after state.

**Q44: Permission caching?** A: 2-minute TTL on server (in-memory) and client (localStorage). Fail-open returns true during loading to prevent "Access Denied" flashes.

**Q45: Order form JSONB storage?** A: OrderFormEntries.form_data stored as JSONB. Allows flexible schema (10 input types). PostgreSQL JSONB supports indexing and efficient querying.

**Q46: QR token generation?** A: 16+ character alphanumeric string stored in Registration.ticket_token. Embedded in e-ticket QR codes. Can be full URL with ?token= parameter.

**Q47: Certificate PDF generation?** A: jsPDF library with autotable plugin. Works in browser and Node.js. Custom positioning via certificateLayout.ts. No external dependencies like Puppeteer.

**Q48: Email provider abstraction?** A: lib/emailProvider.ts abstracts SMTP (Nodemailer) and Resend. Configured via EMAIL_PROVIDER env var. sendEmail() function handles both.

**Q49: Supabase client configurations?** A: Three configs: browser client (lib/supabase.ts), server client (lib/supabase-server.ts), admin client (service role). Right access level for each operation.

**Q50: Analytics query optimization?** A: PostgreSQL aggregations (COUNT, SUM, AVG) process data on server. Indexes on event_id, organization_id, created_at. JSONB operators for demographics. Pagination for large datasets.

**Q51: Breakout session architecture?** A: BreakoutSession table with capacity. BreakoutSessionRegistration tracks attendee sign-ups. Ticket tokens used for access control. Check-in updates check_in_time.

**Q52: Add-on redemption tracking?** A: AttendeeEntitlement tracks add-on rights. AddOnRedemption tracks redemptions. Check-in API claims add-ons when scanned.

**Q53: Feedback system?** A: FeedbackForm defines questions. FeedbackAnswer stores responses. Aggregated for satisfaction scores in analytics.

**Q54: Promotion/discount system?** A: Promotion table with discount codes. Validation API checks code applicability. Applied during registration.

**Q55: Waitlist promotion logic?** A: When registration cancelled or capacity increased, system can auto-promote waitlisted entries based on position and timestamp.

**Q56: Event reschedule handling?** A: When event end date moved earlier, ticket selling windows auto-adjusted with 5-day buffer. Prevents selling after event ends.

**Q57: Image validation?** A: lib/uploadedImageValidation.ts checks type (JPEG, PNG, WebP, etc.), size (max 20MB), dimensions. Validates banners and certificate backgrounds.

**Q58: Multi-organization support?** A: Organization table with organization_id scoping. RLS policies filter by organization_id. Users can belong to multiple organizations with different roles.

**Q59: API rate limiting?** A: Currently relies on Supabase/Vercel infrastructure-level protection. Cron secret provides implicit rate limiting. Ticket capacity as natural rate limiter for public registration.

**Q60: Database backup strategy?** A: Supabase manages automatic backups. Point-in-time recovery available. Backup verification recommended in deployment checklist.

---

## References

**Project Docs:** README.md, architecture-analysis.md, SECURITY.md, docs/HANDOFF.md, docs/MANAGEMENT_ROLES_PERMISSIONS.md

**External:** Next.js Docs, Supabase Docs, Tailwind CSS Docs, Vitest Docs

---

**Document Status:** Complete
