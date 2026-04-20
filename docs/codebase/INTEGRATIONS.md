# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System | Type (API/DB/Queue/etc) | Purpose | Auth model | Criticality | Evidence |
|--------|-------------------------|---------|------------|-------------|----------|
| Supabase | DB/Auth/Storage/Realtime | Primary application database, user auth, session management, storage uploads, realtime notifications | Supabase session cookies, anon key, service role key | High | `lib/supabase-server.ts`, `lib/supabase.ts`, `app/api/notifications/route.ts` |
| SMTP | External email transport | Sends transactional email when configured | SMTP credentials via env vars | High | `lib/emailProvider.ts` |
| Resend | External email API | Alternate email transport provider | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | High | `lib/emailProvider.ts` |
| Vercel Analytics | Observability | Page view analytics | Vercel runtime integration | Medium | `app/layout.tsx` |

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| Supabase / PostgreSQL | Primary application data store for events, registrations, order forms, certificates, notifications | `lib/supabase-server.ts`, `app/api/*`, `lib/actions/events.ts` | RLS/auth misconfigurations or unauthorized organization access | `app/api/notifications/route.ts`, `proxy.ts` |
| Supabase Storage | File storage for event banners and assets | `lib/actions/events.ts`, `scripts/debug/debug_supabase.js` | Public URL exposure if bucket ACLs are misconfigured | `lib/actions/events.ts` |

### 3) Secrets and Credentials Handling

- Credential sources: environment variables in `.env.local` or host environment.
- Hardcoding checks: no secret literals are present in source; email provider and Supabase keys are resolved from `process.env`.
- Rotation or lifecycle notes: not explicitly documented in repository; `README.md` offers setup guidance.

### 4) Reliability and Failure Behavior

- Retry/backoff behavior: not implemented in `lib/emailProvider.ts`; Resend and SMTP are called once per send.
- Timeout policy: not explicitly configured for external fetches or SMTP transport.
- Circuit-breaker or fallback behavior: email provider falls back from auto decision to SMTP or Resend based on environment configuration, but no explicit circuit breaker is present.

### 5) Observability for Integrations

- Logging around external calls: `console.error` is used for runtime errors in cron handlers and email sending.
- Metrics/tracing: no dedicated metrics or tracing library detected beyond Vercel Analytics for frontend page analytics.
- Missing visibility gaps: no explicit monitoring for Supabase query latencies, email send failures, or coroutine job performance.

### 6) Evidence

- `lib/emailProvider.ts`
- `lib/supabase-server.ts`
- `app/api/cron/process-email-campaigns/route.ts`
- `app/api/cron/process-certificate-emails/route.ts`
- `app/api/notifications/route.ts`
- `README.md`
