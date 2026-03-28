# G-Events Copilot Instructions

## Project Overview
G-Events is a comprehensive event management dashboard built with Next.js 16, React 19, and TypeScript. It enables event organizers to manage event creation, attendee registration, check-ins, communications, analytics, and certificate distribution through an admin dashboard with full dark/light mode support.

## Architecture & Key Patterns

### Route Structure (App Router + Server/Client Components)
**Admin dashboard** uses protected sidebar layout at `app/(admin_side)/`:
- **`dashboard/`** - Main overview with stats and recent events (client component, `"use client"`)
- **`events/`** - Event list page and event-specific subroutes
  - **`[eventId]/layout.tsx`** - Async server layout that parses slug routes (e.g., `event-name-123`) and fetches event data via `getEventById()`
  - **`[eventId]/overview/`**, **`analytics/`**, **`checkin/`**, **`email-attendees/`**, **`reports/`**, **`publish/`**, **`tickets/`**, **`breakouts/`**, **`certificates/`**, **`orders/`**, **`orderform/`**, **`orderconfirmation/`**, **`waitlist/`** - Feature-specific pages (most marked `"use client"`)
- **`analytics/all/`** - All-events overview analytics
- **`management/`**, **`profile/`**, **`settings/`** - Admin configuration pages
- **`login/`** - Authentication entry point
- **`auth/`** - OAuth callback and auth-related routes
  - **`auth/session-role/`** - Post-auth mode selection (attendee vs organizer)
  - **`auth/session-role/organization/`** - Organizer organization selector for multi-org users
- **`(client_side)/`** - Public-facing pages (event landing pages, order forms, attendee flows)

**Key pattern**: Layouts are server components (can use async data fetching and route guards), while feature pages are typically client components for interactive UX.

### Data Layer & Server Actions
- **Database**: Supabase with PostgreSQL schema (`User`, `Event`, `OrganizationRole`, `OrganizationUserRole`, etc.)
- **Supabase client**:
  - [lib/supabase.ts](../lib/supabase.ts) - Shared Supabase client + schema types used across server + client.
  - [lib/supabase-server.ts](../lib/supabase-server.ts) - Server-only Supabase wrapper used in API routes, server actions, and middleware.
  - [lib/supabase-browser.ts](../lib/supabase-browser.ts) - Browser Supabase instance used in client-side pages and hooks.
  - [lib/supabase-middleware.ts](../lib/supabase-middleware.ts) - Edge middleware for auth/session handling.
- **Server actions** (`lib/actions/`): Use `'use server'` directive
  - `lib/actions/events.ts` — Event CRUD, analytics, reports, and related business logic
  - `lib/actions/permissions.ts` — User role + permission lookup (`getCurrentUserPermissions(email)`)
  - `lib/actions/orderForm.ts` — Order form builder, entries, exports, and form submissions
  - `lib/actions/orderConfirmation.ts` — Email templates for order confirmation workflows
- **Session mode + organization context**:
  - `lib/auth/sessionRole.ts` — Membership lookup and active organization resolution (`getCurrentUserActiveOrganization`, `parseOrganizationId`)
  - `lib/constants.ts` — Session/org cookies: `SESSION_ROLE_COOKIE_NAME`, `ACTIVE_ORGANIZATION_COOKIE_NAME`, `SESSION_ROLE`
- **Localization (i18n + persistence)**:
  - `contexts/LocaleContext.tsx` — Runtime translation and locale state for admin/client routes.
  - `app/api/user/locale/route.ts` — Persist and fetch `preferred_language` / `preferred_region` for authenticated users.
  - `lib/i18n.ts` + `lib/staticTranslations/*` — Locale normalization and translation catalog.
- **Audit trail (tamper-evident logging)**:
  - `lib/actions/audit.ts` — Hash-chained audit entries (`audit_hash`, `prev_hash`) for sensitive entity operations.
  - `app/api/audit/route.ts` — Audit retrieval endpoint.
  - `components/admin/AuditLogViewer.tsx` — Admin-side audit viewer component.
- **Security helpers**:
  - `lib/security.ts` — safe secret comparison (`safeCompareSecrets`), trusted origin resolution, and HTML escaping helpers.
- **Client helper layer**: [lib/eventManagement.ts](../lib/eventManagement.ts) and [lib/hooks/useOrderFormSubmit.ts](../lib/hooks/useOrderFormSubmit.ts) provide client-side APIs for tickets, add-ons, promo codes, settings, and order form submission flows.
- **API routes** ([app/api/](../app/api/)): REST endpoints for analytics, events, management, notifications, and order forms (e.g., `/api/events`, `/api/management/users`, `/api/orderform`, `/api/orderform/[id]`)
- **Database utilities** ([lib/db.ts](../lib/db.ts)): Low-level Supabase queries (user management, roles, permissions)
- **Shared backend primitives**:
  - [lib/constants.ts](../lib/constants.ts) — Shared app constants (e.g., `DEFAULT_ORG_ID`, `HTTP_STATUS`) to avoid repeated env parsing and magic status codes.
  - [lib/logger.ts](../lib/logger.ts) — Scoped logger wrapper (`debug/info/warn/error`) for consistent server-side diagnostics.
  - [lib/utils/apiResponse.ts](../lib/utils/apiResponse.ts) — Standardized typed API response helpers (`ok`, `created`, `badRequest`, `unauthorized`, `internalServerError`).

### Component Architecture
**Reusable admin components** ([components/admin/](../components/admin/)):
- **Layout**: `Header.tsx` (logo, notifications, theme toggle), `Sidebar.tsx` (active page indicator, collapsible)
- **Forms & Editors**: `RichTextEditor.tsx` (TipTap-based with formatting toolbar), `DateTimeInput.tsx`, `TimeInput.tsx`, `DateInput.tsx`
- **Data Display**: `DashboardTabs.tsx`, `RegistrationChart.tsx`, `TopPerformingEvents.tsx`, `StatCard.tsx`
- **Modals**: `Modal.tsx`, `SuccessModal.tsx`, `EditorModals.tsx` (Link/Image insertion for rich text)
- **Utilities**: `ExportButton.tsx` (CSV/PDF/Excel export), `NotificationDropdown.tsx`, `EventSelector.tsx`
- **Authorization helpers**: `PermissionGate.tsx` (component guard), `contexts/PermissionContext.tsx` (permission state + helpers), `AccessDenied.tsx` (fallback UI)
- **Public/client components**: `components/client/ClientHeader.tsx`, `components/client/ClientSidebar.tsx`, `components/public/OrderFormDisplay.tsx` for attendee-facing pages.
- **Global providers**: `LocaleProvider`, `NotificationProvider`, and `PermissionProvider` are composed in `app/layout.tsx`.

**Event-specific client components** (`app/(admin_side)/events/[eventId]/*/`):
- Pages like `TicketsClient.tsx`, `CheckInClient.tsx`, `EmailAttendeesClient.tsx` handle user interactions
- Typically fetch data via server actions, manage local state with `useState`, validate forms

### Data Models & Types
- **[lib/types.ts](../lib/types.ts)**: Core types
  - `EventStatus` union: "Ongoing" | "Completed" | "Not Yet Published" | "Published" | "Not Started" | "Cancelled" | "Draft"
  - `EventData` interface: Event with stats (registrations, revenue, satisfaction), trends (weekly registrations, attendance), revenueBreakdown, recentTransactions
  - `Comment` interface: User feedback with rating and timestamp
- **[lib/supabase.ts](../lib/supabase.ts)**: Database schema types
  - `Event` - event record with title, description, dates, capacity, publish status
  - `User`, `OrganizationRole`, `OrganizationUserRole` - authentication/authorization
  - `UserWithRole` - joined user data for display

### Styling System
- **CSS Framework**: Tailwind CSS v4 with `@tailwindcss/postcss`
- **Typography**: Figtree font via CSS variable `--font-figtree` (always include in `<body className>` with `font-sans`)
- **Dark mode**: Uses Tailwind dark: prefix (e.g., `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-gray-100`)
- **Color palette**: 
  - Primary navy: `#3D518C`
  - Grays: gray-50, gray-100, gray-700, gray-800, gray-900
  - Status colors (info, success, warning, alert)
- **Spacing & Styles**:
  - Cards: `rounded-xl shadow-sm p-6 bg-white dark:bg-gray-800`
  - Buttons: Tailwind classes with `transition-all duration-300` for smooth interactions
  - Active states: Blue background (sidebar items) or border indicators
  - Responsive: Mobile-first with `lg:` breakpoints for layouts

### Key Dependencies & Patterns
- **Rich text editor**: TipTap v3.17+ (StarterKit, Underline, Link, Image, TextAlign, Color, FontFamily extensions)
  - Usage: Import `useEditor`, `EditorContent`, configure extensions, render toolbar with formatting buttons
- **Export utilities** ([lib/exportUtils.ts](../lib/exportUtils.ts)): 
  - `exportToCSV()`, `exportToXLSX()`, `exportToPDF()` - Client-side export functions
  - Format data with stats sections, tables, timestamps
- **Date/time handling**: date-fns v4, react-datepicker, react-time-picker
- **Icons**: Lucide-react (Bell, Calendar, ChevronRight, Edit, Trash, etc.)
- **Animations**: Framer Motion v12 for transitions
- **PDF generation**: jsPDF + jspdf-autotable
- **Excel generation**: ExcelJS v4.4.0 (sole Excel library; the `xlsx`/SheetJS package was removed due to unresolved security vulnerabilities — do NOT re-add it)
- **Global state**: `NotificationContext.tsx` - Provides `addNotification()`, `dismissNotification()` for toast-like alerts
- **Notifications in organizer mode**: `app/api/notifications/route.ts` scopes notification queries to the active organization cookie context.
- **Audit data model**: `AuditLog` and `CertificateLedger` tables are maintained via migrations in `database/` and consumed by server actions/routes.

### Event Status Logic (Important)
Event status is derived from:
- `data.is_published` (boolean) - Whether event is published
- `data.event_start_at`, `data.event_end_at` (ISO dates)
- Current date/time comparison

Pattern (from `app/(admin_side)/events/[eventId]/layout.tsx`):
```typescript
const idPart = eventId.split("-").pop() ?? "";
const numericId = parseInt(idPart, 10);
if (isNaN(numericId)) return notFound();

let status = 'Draft';
if (data.is_published) {
  if (endDate && endDate < now) status = 'Completed';
  else if (startDate && startDate <= now && endDate && endDate >= now) status = 'Ongoing';
  else status = 'Published';
}
```

### Session Role + Active Organization (Important)
Organizer-mode access is gated by middleware and cookie state:
- `proxy.ts` checks `SESSION_ROLE_COOKIE_NAME`:
  - `attendee` is redirected away from admin routes to `/home`
  - missing/unknown role is redirected to `/auth/session-role`
- Role choice is set via `app/auth/session-role/choose/route.ts`.
- For organizer mode, `ACTIVE_ORGANIZATION_COOKIE_NAME` is set to the selected org.
- When switching to attendee mode, the active org cookie is cleared.

For multi-org users:
- If only one membership exists, organizer switch auto-selects it.
- If multiple memberships exist, users are routed to `app/auth/session-role/organization/page.tsx` to choose one.

## Development Workflow
- **Start dev**: `npm run dev` → http://localhost:3000
- **Build**: `npm run build`
- **Production**: `npm run start`
- **Linting**: `npm run lint` (ESLint + Next.js config)
- **Environment**: Supabase URL and anon key in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Default org**: `NEXT_PUBLIC_DEFAULT_ORG_ID` (defaults to 1 if not set)
- **Utility scripts**:
  - Debug scripts live under `scripts/debug/` and are exposed via npm scripts (`debug:supabase`, `check:event-schema`, `check:objectives`, `check:theme`, `debug:login-layout-diff`).
  - Maintenance scripts live under `scripts/maintenance/` (`translations:split-static`).

## Code Conventions
- **Path alias**: Always use `@/` for imports (e.g., `@/lib/api`, `@/components/admin/Header`)
- **Client vs Server**:
  - Use `"use client"` at top of interactive pages/components needing hooks (useState, useEffect, context usage)
  - Use `'use server'` for server actions in lib/actions/
  - Layouts can be async server components (don't need `"use client"`) to fetch data
- **TypeScript**: Strict mode enabled; always define prop interfaces and return types
- **Form handling**: Use `FormData` in server actions, `formData.get()` for field values
- **File uploads**: Use `uploadFileToStorage()` helper for Supabase storage (bucket defaults to 'events')
- **Revalidation**: Call `revalidatePath()` after mutations to update cached data
- **API consistency**:
  - Prefer `@/lib/utils/apiResponse` helpers for Route Handlers instead of ad-hoc `NextResponse.json` payload shapes.
  - Prefer `@/lib/constants` for status/default constants and `@/lib/logger` for server logs.
- **Organization scoping (critical)**:
  - In organizer mode, do not trust `organizationId` from query/body for protected admin APIs.
  - Resolve active org from cookies + memberships via `getCurrentUserActiveOrganization(parseOrganizationId(...))`.
  - Scope event/management/notification queries to the active organization to prevent cross-org data leakage.
- **Localization conventions**:
  - Use `useLocale()` and `t()` in client components that render user-facing text.
  - Prefer locale persistence through `/api/user/locale` instead of ad-hoc local storage writes outside `LocaleContext`.
- **Audit conventions**:
  - For sensitive entity mutations, prefer appending audit records via `logAuditEntry(...)` from `lib/actions/audit.ts`.
- **Commits**: Follow Conventional Commits (`feat(events): add checkin feature`, `fix(auth): resolve layout crash`, not generic titles)

## Key Files to Reference
- [app/layout.tsx](../app/layout.tsx) - Root layout, font setup via `figtree.variable`, Locale/Notification/Permission providers and Vercel Analytics
- `app/(admin_side)/events/[eventId]/layout.tsx` - Server-side event data fetching, status derivation
- [lib/actions/events.ts](../lib/actions/events.ts) - Server actions for CRUD, file uploads, data transformations
- [lib/actions/orderForm.ts](../lib/actions/orderForm.ts) - Order form creation and persistence actions
- [lib/actions/orderConfirmation.ts](../lib/actions/orderConfirmation.ts) - Confirmation page actions
- [lib/actions/audit.ts](../lib/actions/audit.ts) - Hash-chained audit log writer/reader
- [lib/supabase.ts](../lib/supabase.ts) - Supabase client init, database schema types
- [lib/types.ts](../lib/types.ts) - EventData, EventStatus, Comment types
- [lib/constants.ts](../lib/constants.ts) - Shared app constants such as `DEFAULT_ORG_ID` and `HTTP_STATUS`
- [lib/auth/sessionRole.ts](../lib/auth/sessionRole.ts) - Active organization + memberships resolution for session context
- [lib/i18n.ts](../lib/i18n.ts) - Locale settings normalization and supported translation languages
- [lib/security.ts](../lib/security.ts) - Trusted origin, secret comparison, and HTML escaping helpers
- [lib/logger.ts](../lib/logger.ts) - Scoped logger utility for consistent server logs
- [lib/utils/apiResponse.ts](../lib/utils/apiResponse.ts) - Typed Route Handler response helpers
- [components/admin/RichTextEditor.tsx](../components/admin/RichTextEditor.tsx) - TipTap editor pattern for content editing
- [components/admin/Sidebar.tsx](../components/admin/Sidebar.tsx) - Navigation sidebar with active state indicator
- [components/admin/EventsSidebar.tsx](../components/admin/EventsSidebar.tsx) - Event-specific navigation sidebar
- [components/admin/AuditLogViewer.tsx](../components/admin/AuditLogViewer.tsx) - Audit trail viewer for entity activity
- [lib/exportUtils.ts](../lib/exportUtils.ts) - Export to CSV/XLSX/PDF patterns
- [contexts/NotificationContext.tsx](../contexts/NotificationContext.tsx) - Global notification context usage
- [contexts/LocaleContext.tsx](../contexts/LocaleContext.tsx) - Locale state, translation behavior, and persistence integration
- `app/auth/session-role/page.tsx` - Mode selection entry after auth
- `app/auth/session-role/choose/route.ts` - Role/org switch handler that sets session cookies
- `app/auth/session-role/organization/page.tsx` - Org picker for multi-org organizer users
- `proxy.ts` - Admin route guarding using session role cookie
- `app/api/user/locale/route.ts` - Locale persistence endpoint for authenticated users
- `app/api/audit/route.ts` - Audit trail query endpoint
- `app/api/notifications/route.ts` - Notification aggregation route with organizer org scoping

## Common Build / TypeScript Gotchas
- In API routes and server actions, ensure you instantiate the Supabase server client with `await createClient()` before using it (e.g., in both GET/POST handlers). This prevents errors like “Cannot find name 'supabase'”.
- When adding new server-only code, keep it in `app/api/` or `lib/actions/` so the Next.js bundler doesn’t include it in client bundles.
- For organizer admin APIs, always enforce active organization context server-side; UI-level org selection alone is insufficient for security.
- For locale-aware UI changes, wire text through `LocaleContext` (`t()`) and keep locale persistence in `/api/user/locale`.
</content>
<parameter name="filePath">x:/projects/g-events/G-Events/.github/copilot-instructions.md