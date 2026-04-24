# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `app/` | Next.js App Router routes, layouts, client and server page code, API route handlers | `app/layout.tsx`, `app/api/cron/process-email-campaigns/route.ts` |
| `components/` | Reusable UI components grouped by admin, client, common, auth, and public flows | `components/admin/Header.tsx`, `components/public/OrderFormDisplay.tsx` |
| `contexts/` | React context providers for locale, notifications, permissions, and admin UI state | `contexts/LocaleContext.tsx`, `contexts/NotificationContext.tsx` |
| `lib/` | Shared services, Supabase wrappers, auth/session logic, helpers, email provider, security utilities | `lib/supabase-server.ts`, `lib/emailProvider.ts`, `lib/security.ts` |
| `database/` | SQL migration scripts and schema update files | `database/add_order_form_entries_table.sql` |
| `tests/` | Unit and integration test suites | `tests/unit/auth`, `tests/integration/api` |
| `scripts/` | Debug, maintenance, and perf scripts | `scripts/debug/debug_supabase.js`, `scripts/maintenance/backfill_addon_entitlements.js` |
| `.github/` | GitHub workflow and documentation metadata | `.github/instructions/nextjs.instructions.md` |
| `public/` | Static assets served by Next.js | `public/` |
| `next.config.ts` | Next.js configuration and remote image allow list | `next.config.ts` |
| `tsconfig.json` | TypeScript compiler and path alias config | `tsconfig.json` |

### 2) Entry Points

- Main runtime entry: `app/layout.tsx` is the root layout for the Next.js App Router.
- Secondary runtime entry points: `app/api/*` route handlers and cron endpoints under `app/api/cron/`.
- Shell entry selection: `package.json` scripts (`npm run dev`, `npm run build`, `npm run start`) launch the Next.js app.
- Middleware entry: `proxy.ts` acts as a custom route gate for admin/attendee role enforcement.

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `app/` | Route definitions, layouts, page components, API route handlers | Business logic utility functions, shared service helpers |
| `components/` | Reusable presentation/UI components and page-specific widgets | Direct data access or Supabase queries |
| `contexts/` | Runtime state providers and UI-level feature state | Route or API request handling |
| `lib/` | Integration wrappers, auth/session helpers, shared business utilities, email provider | UI rendering or page markup |
| `database/` | PostgreSQL schema migration SQL | Application runtime code |

### 4) Naming and Organization Rules

- Directory names use `kebab-case` for routes and feature folders (`app/(admin_side)`, `app/(client_side)`).
- React component filenames use `PascalCase` with `.tsx` extension (`Header.tsx`, `OrderFormDisplay.tsx`).
- Utility modules use `camelCase` or descriptive names (`emailProvider.ts`, `supabase-server.ts`).
- Path aliasing uses `@/*` mapped to the repository root via `tsconfig.json`.

### 5) Evidence

- `package.json`
- `tsconfig.json`
- `app/layout.tsx`
- `proxy.ts`
- `app/(admin_side)/events/[eventId]/layout.tsx`
