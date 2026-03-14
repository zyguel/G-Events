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
- **`(client_side)/`** - Public-facing pages (event landing pages, order forms, attendee flows)

**Key pattern**: Layouts are server components (can use async data fetching and route guards), while feature pages are typically client components for interactive UX.

### Data Layer & Server Actions
- **Database**: Supabase with PostgreSQL schema (`User`, `Event`, `OrganizationRole`, `OrganizationUserRole`, etc.)
- **Supabase client**:
  - [lib/supabase.ts](lib/supabase.ts) - Shared Supabase client + schema types used across server + client.
  - [lib/supabase-server.ts](lib/supabase-server.ts) - Server-only Supabase wrapper used in API routes, server actions, and middleware.
  - [lib/supabase-browser.ts](lib/supabase-browser.ts) - Browser Supabase instance used in client-side pages and hooks.
  - [lib/supabase-middleware.ts](lib/supabase-middleware.ts) - Edge middleware for auth/session handling.
- **Server actions** ([lib/actions/events.ts](lib/actions/events.ts)): Use `'use server'` directive
  - `getEvents()` - Fetch all events for org
  - `getEventById(id)` - Fetch single event (used in layouts)
  - `createEvent(prevState, formData)` - Server-side form processing with banner upload
  - `updateEvent()`, `deleteEvent()` - Modify events
  - `uploadFileToStorage()` - Upload to Supabase storage bucket
- **Client helper layer**: [lib/eventManagement.ts](lib/eventManagement.ts) and [lib/hooks/useOrderFormSubmit.ts](lib/hooks/useOrderFormSubmit.ts) provide client-side APIs for tickets, add-ons, promo codes, settings, and order form submission flows.
- **Additional server actions**: [lib/actions/orderForm.ts](lib/actions/orderForm.ts), [lib/actions/orderConfirmation.ts](lib/actions/orderConfirmation.ts)
- **API routes** ([app/api/](app/api/)): REST endpoints for analytics, events, management, notifications, and order forms (e.g., `/api/events`, `/api/management/users`, `/api/orderform`, `/api/orderform/[id]`)
- **Database utilities** ([lib/db.ts](lib/db.ts)): Low-level Supabase queries (user management, roles, permissions)

### Component Architecture
**Reusable admin components** ([components/admin/](components/admin/)):
- **Layout**: `Header.tsx` (logo, notifications, theme toggle), `Sidebar.tsx` (active page indicator, collapsible)
- **Forms & Editors**: `RichTextEditor.tsx` (TipTap-based with formatting toolbar), `DateTimeInput.tsx`, `TimeInput.tsx`, `DateInput.tsx`
- **Data Display**: `DashboardTabs.tsx`, `RegistrationChart.tsx`, `TopPerformingEvents.tsx`, `StatCard.tsx`
- **Modals**: `Modal.tsx`, `SuccessModal.tsx`, `EditorModals.tsx` (Link/Image insertion for rich text)
- **Utilities**: `ExportButton.tsx` (CSV/PDF/Excel export), `NotificationDropdown.tsx`, `EventSelector.tsx`
- **Authorization helpers**: `PermissionGate.tsx` (component guard), `contexts/PermissionContext.tsx` (permission state + helpers), `AccessDenied.tsx` (fallback UI)
- **Public/client components**: `components/client/ClientHeader.tsx`, `components/client/ClientSidebar.tsx`, `components/public/OrderFormDisplay.tsx` for attendee-facing pages.

**Event-specific client components** ([app/(admin_side)/events/[eventId]/*/](app/%28admin_side%29/events/%5BeventId%5D/)):
- Pages like `TicketsClient.tsx`, `CheckInClient.tsx`, `EmailAttendeesClient.tsx` handle user interactions
- Typically fetch data via server actions, manage local state with `useState`, validate forms

### Data Models & Types
- **[lib/types.ts](lib/types.ts)**: Core types
  - `EventStatus` union: "Ongoing" | "Completed" | "Not Yet Published" | "Published" | "Not Started" | "Cancelled" | "Draft"
  - `EventData` interface: Event with stats (registrations, revenue, satisfaction), trends (weekly registrations, attendance), revenueBreakdown, recentTransactions
  - `Comment` interface: User feedback with rating and timestamp
- **[lib/supabase.ts](lib/supabase.ts)**: Database schema types
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
- **Export utilities** ([lib/exportUtils.ts](lib/exportUtils.ts)): 
  - `exportToCSV()`, `exportToXLSX()`, `exportToPDF()` - Client-side export functions
  - Format data with stats sections, tables, timestamps
- **Date/time handling**: date-fns v4, react-datepicker, react-time-picker
- **Icons**: Lucide-react (Bell, Calendar, ChevronRight, Edit, Trash, etc.)
- **Animations**: Framer Motion v12 for transitions
- **PDF generation**: jsPDF + jspdf-autotable
- **Excel generation**: ExcelJS v4.4.0 (sole Excel library; the `xlsx`/SheetJS package was removed due to unresolved security vulnerabilities — do NOT re-add it)
- **Global state**: `NotificationContext.tsx` - Provides `addNotification()`, `dismissNotification()` for toast-like alerts

### Event Status Logic (Important)
Event status is derived from:
- `data.is_published` (boolean) - Whether event is published
- `data.event_start_at`, `data.event_end_at` (ISO dates)
- Current date/time comparison

Pattern (from [app/(admin_side)/events/[eventId]/layout.tsx](app/%28admin_side%29/events/%5BeventId%5D/layout.tsx)):
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

## Development Workflow
- **Start dev**: `npm run dev` → http://localhost:3000
- **Build**: `npm run build`
- **Production**: `npm run start`
- **Linting**: `npm run lint` (ESLint + Next.js config)
- **Environment**: Supabase URL and anon key in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Default org**: `NEXT_PUBLIC_DEFAULT_ORG_ID` (defaults to 1 if not set)

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
- **Commits**: Follow Conventional Commits (`feat(events): add checkin feature`, `fix(auth): resolve layout crash`, not generic titles)

## Key Files to Reference
- [app/layout.tsx](app/layout.tsx) - Root layout, font setup via `figtree.variable`, NotificationProvider wrapper
- [app/(admin_side)/events/[eventId]/layout.tsx](app/%28admin_side%29/events/%5BeventId%5D/layout.tsx) - Server-side event data fetching, status derivation
- [lib/actions/events.ts](lib/actions/events.ts) - Server actions for CRUD, file uploads, data transformations
- [lib/actions/orderForm.ts](lib/actions/orderForm.ts) - Order form creation and persistence actions
- [lib/actions/orderConfirmation.ts](lib/actions/orderConfirmation.ts) - Confirmation page actions
- [lib/supabase.ts](lib/supabase.ts) - Supabase client init, database schema types
- [lib/types.ts](lib/types.ts) - EventData, EventStatus, Comment types
- [components/admin/RichTextEditor.tsx](components/admin/RichTextEditor.tsx) - TipTap editor pattern for content editing
- [components/admin/Sidebar.tsx](components/admin/Sidebar.tsx) - Navigation sidebar with active state indicator
- [components/admin/EventsSidebar.tsx](components/admin/EventsSidebar.tsx) - Event-specific navigation sidebar
- [lib/exportUtils.ts](lib/exportUtils.ts) - Export to CSV/XLSX/PDF patterns
- [contexts/NotificationContext.tsx](contexts/NotificationContext.tsx) - Global notification context usage

## Common Build / TypeScript Gotchas
- In API routes and server actions, ensure you instantiate the Supabase server client with `await createClient()` before using it (e.g., in both GET/POST handlers). This prevents errors like “Cannot find name 'supabase'”.
- When adding new server-only code, keep it in `app/api/` or `lib/actions/` so the Next.js bundler doesn’t include it in client bundles.
</content>
<parameter name="filePath">x:/projects/g-events/G-Events/.github/copilot-instructions.md