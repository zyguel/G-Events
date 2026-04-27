# G-Events Backend Architecture Guide

**Last Updated**: February 22, 2026  
**Status**: Refactored to follow Next.js best practices

---

## 📋 Overview

The backend has been **refactored** from a monolithic `app/(admin_side)/backend/` directory into a clean, organized structure following Next.js conventions:

- **Server Actions** for business logic → `lib/actions/`
- **API Routes** for HTTP endpoints → `app/api/`
- **UI Pages** for components → `app/(admin_side)/`

---

## 🏗️ Current Architecture

### **Server Actions** (`lib/actions/events.ts`)

**Location**: `lib/actions/events.ts`  
**Marker**: `'use server'` directive at top  
**Access**: `@/lib/actions/events`

#### Available Functions:

| Function | Purpose | Params | Returns |
|----------|---------|--------|---------|
| `createEvent()` | Create event with banner upload | `FormData` | `{ success, eventId, error }` |
| `getEvents()` | Fetch all events | None | Event array |
| `getEventById()` | Fetch single event with agenda | `id: number` | Event object or null |
| `updateEvent()` | Update event fields | `id, data` | `{ success, error }` |
| `deleteEvent()` | Delete an event | `id: number` | `{ success, error }` |
| `uploadEventBanner()` | Upload banner to storage | `FormData` | `{ success, url, error }` |
| `saveAgendaSlot()` | Create/update agenda item | `event_id, slot` | `{ success, error }` |
| `deleteAgendaSlot()` | Delete agenda item | `id: string` | `{ success, error }` |
| `getEventAnalytics()` | Fetch event stats & trends | `eventId: number` | Analytics object |
| `getEventReports()` | Fetch detailed event reports (registrants, attendance, breakout sessions) | `eventId: number` | Reports object |
| `getEventDemographics()` | Get attendee demographics | `eventId: number` | Demographics object |
| `getGeneralAnalytics()` | Fetch all-events analytics | None | General analytics object |

### **Other Server Action Modules**

- `lib/actions/permissions.ts` — `getCurrentUserPermissions(email)` for role/permission lookups.
- `lib/actions/orderForm.ts` — Order form CRUD, entries, exports, and related utilities.
- `lib/actions/orderConfirmation.ts` — Order confirmation / email template settings.


### **API Routes** (`app/api/`)

**Location**: `app/api/[resource]/[...routes]/route.ts`  
**Access Method**: HTTP requests (GET, POST, PATCH, DELETE)

#### Endpoints Available:

```
# Events
/api/events/                    → GET (list), POST (create)
/api/events/[eventId]            → GET, PATCH, DELETE

# Analytics
/api/analytics/general          → GET (all-events analytics)
/api/analytics/event/[eventId]  → GET (event-specific)
/api/analytics/events           → GET (events list)

# Management (Users, Roles, Permissions)
/api/management/permissions     → GET (all permissions)
/api/management/roles           → GET (list), POST (create)
/api/management/roles/[id]      → GET, PATCH, DELETE
/api/management/users           → GET (list), POST (invite)
/api/management/users/[id]      → PATCH (update), DELETE (remove)

# Notifications
/api/notifications              → GET (dashboard notifications)

# Audit
/api/audit                      → GET (audit log entries)

# Certificates
/api/certificates/[token]/download → GET (download certificate PDF)
/api/certificates/[token]/meta     → GET (certificate metadata)
/api/certificates/[token]/verify   → GET (verify certificate hash chain)

# Event-specific endpoints
/api/events/[eventId]/tickets              → GET, POST
/api/events/[eventId]/tickets/[ticketId]   → GET, PATCH, DELETE
/api/events/[eventId]/addons                → GET, POST
/api/events/[eventId]/addons/[addOnId]     → GET, PATCH, DELETE
/api/events/[eventId]/addons/[addOnId]/redemptions → GET
/api/events/[eventId]/addons/[addOnId]/reserved → GET
/api/events/[eventId]/breakouts             → GET, POST
/api/events/[eventId]/breakouts/[sessionId] → GET, PATCH, DELETE
/api/events/[eventId]/breakouts/attendee    → GET
/api/events/[eventId]/breakouts/backfill-ticket-tokens → POST
/api/events/[eventId]/certificates/templates         → GET, POST
/api/events/[eventId]/certificates/templates/[templateId] → GET, PATCH, DELETE
/api/events/[eventId]/certificates/issue             → POST
/api/events/[eventId]/certificates/process           → POST
/api/events/[eventId]/certificates/recipients         → GET
/api/events/[eventId]/checkin                → GET
/api/events/[eventId]/checkin/[registrationId] → PATCH
/api/events/[eventId]/checkin/scan            → POST
/api/events/[eventId]/checkin/scan/apply      → POST
/api/events/[eventId]/checkin/breakout-roster → GET
/api/events/[eventId]/checkin/[registrationId]/claim-addon → POST
/api/events/[eventId]/orders                 → GET, POST
/api/events/[eventId]/orders/[registrationId] → GET, PATCH, DELETE
/api/events/[eventId]/promotions             → GET, POST
/api/events/[eventId]/promotions/[promotionId] → GET, PATCH, DELETE
/api/events/[eventId]/promotions/validate     → POST
/api/events/[eventId]/waitlist               → GET, POST
/api/events/[eventId]/email-attendees        → GET, POST
/api/events/[eventId]/email-attendees/[campaignId] → GET, PATCH, DELETE
/api/events/[eventId]/email-attendees/process → POST
/api/events/[eventId]/email-attendees/images  → POST
/api/events/[eventId]/my-breakouts            → GET

# Cron endpoints (protected by x-cron-secret header)
/api/cron/process-email-campaigns            → POST
/api/cron/process-certificate-emails        → POST
/api/cron/email-attendees                    → POST

# Feedback
/api/feedback/[eventId]                      → GET, POST
/api/feedback/form/[eventId]                 → GET

# Auth
/api/auth/register/validate                  → POST
```

---

## 🔄 When to Use What?

### **Use Server Actions** ✅
- Called from **Client Components** (`'use client'`)
- Called from **Server Components** (pages)
- Form submissions with `useFormState()`
- Database mutations that need `revalidatePath()`
- File uploads to Supabase storage
- Complex data processing

**Example**:
```typescript
'use client'
import { createEvent } from '@/lib/actions/events'

export default function CreateEventForm() {
  const [state, formAction] = useFormState(createEvent, {})
  return (
    <form action={formAction}>
      <input name="name" />
      <button type="submit">Create Event</button>
    </form>
  )
}
```

### **Use API Routes** ✅
- External integrations (webhooks, third-party services)
- Public/private endpoints requiring auth headers
- Batch operations from external systems
- CORS-enabled endpoints for frontend SPA calls
- Microservice communication

**Example**:
```typescript
// Client-side fetch
const response = await fetch('/api/events')
const { data: events } = await response.json()
```

---

## 📁 Directory Structure

```
x:\projects\g-events\G-Events\
│
├── lib/
│   ├── actions/
│   │   ├── events.ts                    ← Server Actions (business logic)
│   │   ├── permissions.ts               ← Permissions/roles lookup
│   │   ├── orderForm.ts                 ← Order form configuration & entries
│   │   └── orderConfirmation.ts         ← Order confirmation email templates
│   ├── db.ts
│   ├── supabase.ts
│   └── types.ts
│
├── app/
│   ├── api/                             ← API Routes (HTTP endpoints)
│   │   ├── events/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── analytics/
│   │   │   ├── general/route.ts
│   │   │   ├── event/[eventId]/route.ts
│   │   │   └── events/route.ts
│   │   └── management/
│   │       ├── permissions/route.ts
│   │       ├── roles/route.ts
│   │       ├── roles/[id]/route.ts
│   │       ├── users/route.ts
│   │       └── users/[id]/route.ts
│   │
│   ├── (admin_side)/
│   │   ├── dashboard/page.tsx           ← UI Pages (components only)
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   └── [eventId]/
│   │   │       ├── overview/page.tsx
│   │   │       ├── publish/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       ├── tickets/page.tsx
│   │   │       ├── checkin/page.tsx
│   │   │       └── ...
│   │   ├── analytics/
│   │   ├── management/
│   │   └── ...
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── admin/
│   │   ├── EventOverview.tsx
│   │   ├── PublishEventContent.tsx
│   │   └── ...
│   └── ...
│
└── docs/
    └── agents/
        └── BACKEND_ARCHITECTURE.md      ← This file
```

---

## 🚀 Import Patterns

### ✅ Correct Imports

```typescript
// Server Actions
import { createEvent, getEventById, updateEvent } from '@/lib/actions/events'

// Type definitions
import { EventData, EventSummary } from '@/lib/types'

// Supabase client
import { supabase } from '@/lib/supabase'

// Database functions (API routes only)
import { getEvent, getEvents, createEvent, updateEvent, deleteEvent } from '@/lib/db'
```

### ❌ Incorrect Imports (OLD - DO NOT USE)

```typescript
// WRONG - api.ts no longer has mock functions!
import { getEventData, getAllEvents, getAggregatedData } from '@/lib/api'

// WRONG - This path no longer exists!
import { getEventById } from '@/app/(admin_side)/backend/events'

// WRONG - Use @/lib/types instead
import { EventData } from '@/lib/api'

// WRONG - Relative paths
import { updateEvent } from '../../../../../backend/events'
```

---

## 📝 Migration Guide for Existing Code

### Before (OLD):
```typescript
import { getEventById } from '@/app/(admin_side)/backend/events'
```

### After (NEW):
```typescript
import { getEventById } from '@/lib/actions/events'
```

### All Affected Files (Already Updated):
- `components/admin/EventOverview.tsx`
- `components/admin/PublishEventContent.tsx`
- `app/(admin_side)/events/page.tsx`
- `app/(admin_side)/events/[eventId]/*.tsx` (all sub-pages)
- `app/(admin_side)/dashboard/page.tsx`
- `app/(admin_side)/analytics/all/page.tsx`

---

## 🔌 API Route Patterns

### Listing Resources
```typescript
// GET /api/events
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('organizationId')
    const events = await getEvents(orgId ? parseInt(orgId) : DEFAULT_ORG_ID)
    return NextResponse.json({ success: true, data: events })
}
```

### Creating Resources
```typescript
// POST /api/events
export async function POST(request: NextRequest) {
    const body = await request.json()
    const newEvent = await createEvent(...)
    return NextResponse.json({ success: true, data: newEvent }, { status: 201 })
}
```

### Updating Resources
```typescript
// PATCH /api/events/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    await updateEvent(parseInt(id), body)
    return NextResponse.json({ success: true, message: 'Updated' })
}
```

---

## 🎯 Best Practices

### ✅ DO:
1. **Use Server Actions** for form submissions and mutations
2. **Call `revalidatePath()`** after database changes
3. **Use path aliases** (`@/lib/`, `@/app/`, `@/components/`)
4. **Keep API routes clean** - delegate logic to `lib/actions/`
5. **Add `'use server'`** at top of server action files
6. **Add `'use client'`** in components using hooks

### ❌ DON'T:
1. **Don't import** from removed `app/(admin_side)/backend/`
2. **Don't use relative paths** (e.g., `../../../backend/events`)
3. **Don't put UI in API routes** - return JSON only
4. **Don't duplicate logic** - centralize in `lib/actions/`
5. **Don't forget `revalidatePath()`** after mutations

---

## 🧪 Testing Server Actions

```typescript
// Import the action
import { updateEvent } from '@/lib/actions/events'

// Call it directly
const result = await updateEvent(eventId, { title: 'New Title' })

// Check response
if (result.success) {
  console.log('Event updated!')
} else {
  console.error('Error:', result.error)
}
```

---

## 📚 Additional Resources

- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- Next.js Route Handlers (API): https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Supabase TypeScript Client: https://supabase.com/docs/reference/javascript
- Project `.github/copilot-instructions.md` for general project structure

---

## ❓ Quick Q&A

**Q: Where do I fetch event data?**  
A: Use `getEventById()` from `@/lib/actions/events`

**Q: How do I handle form submissions?**  
A: Use `useFormState()` hook with server actions

**Q: Can I call API routes from client components?**  
A: Yes, but prefer server actions. Use `fetch()` only for external APIs

**Q: Where should I add new backend logic?**  
A: Add to `lib/actions/events.ts` (server action) or `app/api/*/route.ts` (HTTP endpoint)

**Q: What happened to `/backend/`?**  
A: Removed entirely. All logic moved to `lib/actions/` and `app/api/`
