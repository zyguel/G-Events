# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System | Type (API/DB/Queue/etc) | Purpose | Auth model | Criticality | Evidence |
|--------|---------------------------|---------|------------|-------------|----------|
| Supabase (Postgres/Auth/Storage) | DB/Auth/Storage | Primary data store, auth, storage | Supabase anon + service role keys | High | lib/supabase-server.ts, lib/supabase.ts |
| Resend | API | Transactional email (optional) | RESEND_API_KEY | Medium | lib/emailProvider.ts |
| SMTP | SMTP | Transactional email | SMTP_* env vars | High | lib/emailProvider.ts |
| Vercel Analytics | Analytics | Client analytics | Vercel script | Low | app/layout.tsx |

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| Supabase Postgres | Primary relational data store | lib/supabase-server.ts | Misconfigured RLS or org scoping leaks | lib/supabase-server.ts, proxy.ts |
| Supabase Storage | Asset storage (banners, avatars, certificates) | lib/supabase-server.ts | Public URL access control | next.config.ts |

### 3) Secrets and Credentials Handling

- Credential sources: .env.local (documented in README.md and docs/HANDOFF.md)
- Hardcoding checks: [TODO]
- Rotation or lifecycle notes: [TODO]

### 4) Reliability and Failure Behavior

- Retry/backoff behavior: No explicit retry/backoff noted in email provider or API calls.
- Timeout policy: [TODO]
- Circuit-breaker or fallback behavior: Email provider auto-selects SMTP vs Resend based on env config.

### 5) Observability for Integrations

- Logging around external calls: logger utility and console usage in server code.
- Metrics/tracing coverage: Vercel Analytics in app/layout.tsx.
- Missing visibility gaps: [TODO]

### 6) Evidence

- lib/emailProvider.ts
- lib/supabase-server.ts
- lib/supabase.ts
- next.config.ts
- app/layout.tsx

## Extended Sections (Optional)

- [TODO]
