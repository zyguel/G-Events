# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: Feature-oriented layered web application.
- Why this classification: UI is organized by public vs admin feature routes in `app/(client_side)` and `app/(admin_side)`, while shared integration and auth logic live in `lib/` and API routes live in `app/api/`.
- Primary constraints: Supabase session/auth cookie flow, role-based route gating, and Next.js App Router server/client split.

### 2) System Flow

```text
Browser request -> Next.js App Router route or API route -> proxy.ts auth/role gate -> page or API handler -> lib/Supabase/email/security helper -> Supabase/Postgres storage -> response / client UI update
```

1. A browser request enters the Next.js App Router; `app/layout.tsx` composes providers and root UI.
2. `proxy.ts` applies auth and session role routing for organizer/admin vs attendee/public routes.
3. UI pages and API handlers use `lib/supabase-server.ts` or `lib/supabase.ts` to access Supabase and `lib/emailProvider.ts` to send mail.
4. Server actions in `lib/actions/` perform business mutations and audit logging with Supabase.
5. API route handlers return `NextResponse.json(...)` and client-side UI components consume responses.

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| `app/` | Route components, layouts, API route handlers, page composition | Low-level data access and reusable integration logic | `app/api/cron/process-email-campaigns/route.ts`, `app/(admin_side)/events/[eventId]/layout.tsx` |
| `components/` | Reusable UI widgets and page-specific presentational components | Route logic, server auth checks | `components/admin/Header.tsx`, `components/public/OrderFormDisplay.tsx` |
| `contexts/` | Runtime providers for locale, notifications, permissions | Direct network or database access beyond context state | `contexts/LocaleContext.tsx`, `contexts/NotificationContext.tsx` |
| `lib/` | Shared helpers, Supabase client wrappers, auth/session role resolution, email provider, security utilities | JSX rendering or page layout markup |
| `database/` | SQL schema migrations and DB model evolution scripts | Application runtime code |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Server actions | `lib/actions/events.ts` uses `'use server'` and `FormData` processing | Encapsulate server-side mutations with Next.js App Router semantics |
| Supabase client wrappers | `lib/supabase-server.ts`, `lib/supabase.ts` | Separate browser and server Supabase access patterns |
| Role-based middleware | `proxy.ts` gate for admin vs attendee route access | Centralize auth guard and session role redirects |
| Safe secret comparison | `lib/security.ts` uses `timingSafeEqual` | Prevent timing attacks for cron secret validation |
| Path aliases | `@/*` imports in `tsconfig.json` | Keep imports readable across root-level modules |

### 5) Known Architectural Risks

- The app relies on `APP_URL` in production for secure absolute link generation and email HTML normalization; missing or incorrect config may break email content or QR links.
- A large shared `lib/actions/events.ts` file with many responsibilities increases maintenance risk; it is among the highest churn files.
- No container/runtime config is present, so deployment details are not codified in the repo.

### 6) Evidence

- `app/layout.tsx`
- `proxy.ts`
- `lib/supabase-server.ts`
- `lib/emailProvider.ts`
- `lib/actions/events.ts`
