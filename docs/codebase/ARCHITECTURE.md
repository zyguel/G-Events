# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: Feature-oriented layered web application (Next.js App Router).
- Why this classification: Routes are split into admin/client groups in app/ with shared logic in lib/ and shared UI in components/.
- Primary constraints: Supabase session/cookie auth gating, App Router server/client split, organization scoping.

### 2) System Flow

```text
Browser request -> proxy.ts auth/role gate -> App Router page or API route -> server actions/helpers -> Supabase/Postgres -> response
```

1. Requests enter Next.js App Router and pass through proxy.ts for auth/role gating.
2. Pages and API routes execute in app/ with server actions in lib/actions/.
3. Data access goes through Supabase server/browser clients in lib/.
4. Responses render UI and optionally revalidate paths.

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| app/ | Routes, layouts, API handlers | Shared integration logic | app/layout.tsx, app/api/* |
| components/ | UI components | Server actions and DB access | components/admin/* |
| contexts/ | Runtime providers | Supabase queries | contexts/* |
| lib/ | Server actions, Supabase clients, utilities | JSX route markup | lib/actions/events.ts, lib/supabase-server.ts |
| database/ | SQL migrations | App runtime logic | database/* |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Server actions | lib/actions/events.ts ('use server') | Centralize mutations and revalidation |
| Supabase client wrappers | lib/supabase-server.ts, lib/supabase-browser.ts | Separate server vs browser auth access |
| Role-based routing | proxy.ts | Enforce organizer vs attendee route gating |
| Standard API responses | lib/utils/apiResponse.ts | Consistent JSON payloads |

### 5) Known Architectural Risks

- Large, high-churn server action file (lib/actions/events.ts) increases regression risk.
- No CI/CD pipeline detected; build/test enforcement is manual.

### 6) Evidence

- proxy.ts
- app/layout.tsx
- lib/actions/events.ts
- lib/supabase-server.ts
- docs/codebase/.codebase-scan.txt

## Extended Sections (Optional)

- [TODO]
