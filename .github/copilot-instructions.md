# G-Events Copilot Instructions

## Project Overview
G-Events is a comprehensive event management dashboard built with Next.js 16, React 19, and TypeScript. It provides admin functionality for managing events, analytics, check-ins, and attendee communications with a polished dark/light mode UI.

## Architecture & Key Patterns

### Route Structure (App Router)
- **`app/(admin_side)/`**: Admin dashboard routes with protected sidebar navigation
  - `dashboard/` - Main overview with quick stats and recent activity
  - `events/[eventId]/` - Event-specific features: checkin, email-attendees, reports, publish, etc.
  - `analytics/[eventId]/` - Event analytics and all-events overview
  - `management/`, `profile/`, `settings/` - Admin tools
- **`app/page.tsx`**: Redirects to `/dashboard`
- **Root layout** (`app/layout.tsx`): Uses Figtree font (not Geist), applies to all pages

### Component Architecture
- **Admin components** (`components/admin/`): Reusable dashboard widgets
  - `Header.tsx` - Navigation header with logo and theme toggle
  - `Sidebar.tsx` - Collapsible sidebar with active page styling
  - `DashboardTabs.tsx`, `RegistrationChart.tsx` - Chart/data visualization
  - `Modal.tsx`, `RichTextEditor.tsx` - Common UI elements
  - Client components use `"use client"` directive; state managed locally with `useState`
- **Client-side pages**: Most admin pages marked `"use client"` for interactivity (e.g., dashboard page with event filtering)

### Data Model
- **EventData interface** ([lib/types.ts](lib/types.ts)): Core event object with stats, trends, transactions, attendance
- **Mock API** ([lib/api.ts](lib/api.ts)): `eventsData` Record contains event details; no real backend yet
- Features include: multi-week registration trends, revenue breakdown, attendance tracking, comments with ratings

### Styling System
- **CSS Framework**: Tailwind CSS v4 with `@tailwindcss/postcss`
- **Dark mode**: Built-in dark: prefix (e.g., `bg-white dark:bg-gray-800`)
- **Color palette**: Primary brand color `#3D518C` (navy blue), grays, gradients for CTAs
- **Typography**: Figtree font via CSS variable `--font-figtree` (apply via `font-sans`)
- **Design patterns**: Cards use `rounded-xl`, shadows `shadow-sm`, transitions `duration-300`, hover scales

### Dependencies & Export Features
- **Rich text editor**: TipTap (v3.17+) with extensions (color, font-family, image, link, text-align)
- **Export utilities**: ExcelJS, JSPDF with autotable for PDF/Excel exports ([lib/exportUtils.ts](lib/exportUtils.ts))
- **Date handling**: date-fns v4, react-datepicker for date/time inputs
- **Icons**: Lucide-react (Bell, Calendar, ChevronRight, etc.)
- **Animations**: Framer Motion v12 for transitions

## Development Workflow
- **Start**: `npm run dev` → http://localhost:3000
- **Build**: `npm run build`
- **Production**: `npm run start`
- **Lint**: `npm run lint`

## Code Conventions
- **Imports**: Use `@/` path alias (e.g., `@/components/admin/Header`)
- **Client components**: Add `"use client"` at top of files needing React hooks (useState, useEffect)
- **TypeScript**: Strict mode enabled; define interfaces for props (e.g., `interface DashboardData { ... }`)
- **Export styling**: Format data in export handlers using event stats and trends
- **Committed commits**: Follow Conventional Commits (`feat(scope): message`, not generic titles)

## Key Files to Reference
- [app/layout.tsx](app/layout.tsx) - Font setup, metadata
- [app/(admin_side)/dashboard/page.tsx](app/%28admin_side%29/dashboard/page.tsx) - Dashboard layout pattern
- [components/admin/Sidebar.tsx](components/admin/Sidebar.tsx) - Navigation with state management
- [lib/types.ts](lib/types.ts) - EventData and Comment interfaces
- [lib/api.ts](lib/api.ts) - Mock event data structure (reference for backend integration)</content>
<parameter name="filePath">x:/projects/g-events/G-Events/.github/copilot-instructions.md