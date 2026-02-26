# Analytics, Event Reports & Notifications — Backend Documentation

## Overview

This document covers the backend architecture for three core modules built during the G-Events analytics sprint:

1. **General Analytics** — Dashboard-level aggregated stats across all events
2. **Event Reports** — Per-event reporting across Registration, Attendance, and Breakout Session tabs
3. **Notifications** — Real-time admin notifications derived from live database activity

All data fetching uses **Supabase** as the database. Server Actions (in `lib/actions/`) are used for server-side data fetching passed as props to client components. API Routes (in `app/api/`) are used for data that must be fetched client-side.

---

## 1. General Analytics

### Location
- **Server Action:** [`lib/actions/events.ts`](file:///d:/g-events/lib/actions/events.ts) — `getGeneralAnalytics()`
- **Page (Server Component):** `app/(admin_side)/analytics/[eventId]/page.tsx`
- **Dashboard UI:** `components/admin/DashboardTabs.tsx`

### What It Returns

```typescript
{
  totalEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  avgSatisfaction: number;
  monthly: number[];          // 12 raw monthly registration counts (Jan–Dec)
  monthLabels: string[];      // ['Jan', 'Feb', ..., 'Dec']
  attendanceBreakdown: { label: string; value: number }[];
  revenueByTicket: { label: string; value: number }[];
  topEvents: {
    id: number;
    title: string;
    registrations: number;
    revenue: number;
    attendance: number;
    satisfaction?: number;
  }[];
}
```

### Database Queries

| Data Point | Table(s) | Filter |
|---|---|---|
| Total events | `Event` | — |
| Total registrations | `Registration` | `status != 'cancelled'` |
| Total revenue | `Registration` | `status = 'confirmed'`, sum of `final_price_paid` |
| Avg. satisfaction | `FeedbackForm` → `FeedbackAnswer` | Numeric answers only |
| Monthly trend | `Registration` | `created_at >= Jan 1 current year`, grouped by month |
| Attendance breakdown | `Registration` | Counts of `has_checked_in`, `is_waitlisted`, etc. |
| Revenue by ticket type | `Registration` JOIN `Ticket` | Sum per ticket name |
| Top events | `Registration` JOIN `Event` | Aggregated per event |

### Helper: `buildMonthlyTrend()`

Converts flat `{ created_at }` rows into a 12-element array of **raw monthly counts** (not cumulative). Used by `getGeneralAnalytics()` internally.

```typescript
buildMonthlyTrend(registrations: { created_at: string }[])
// returns { monthly: number[], monthLabels: string[] }
```

> **Important:** Each entry is a raw count for that month — not a running total.

---

## 2. Event Reports

### Location
- **Server Action:** [`lib/actions/events.ts`](file:///d:/g-events/lib/actions/events.ts) — `getEventReports()`
- **Page (Server Component):** [`app/(admin_side)/events/[eventId]/reports/page.tsx`](file:///d:/g-events/app/(admin_side)/events/[eventId]/reports/page.tsx)
- **Client Component:** [`app/(admin_side)/events/[eventId]/reports/ReportsClient.tsx`](file:///d:/g-events/app/(admin_side)/events/[eventId]/reports/ReportsClient.tsx)

### Function Signature

```typescript
getEventReports(eventId: number): Promise<EventReportsData>
```

### Return Type

```typescript
interface EventReportsData {
  registrants: ReportRegistrant[];
  stats: {
    registration: {
      total: number;          // Non-cancelled registrations
      confirmed: number;
      rejected: number;       // Cancelled + rejected
      generalAdmission: number;
      premium: number;        // Ticket name contains "premium"
      group: number;          // Has registration_group_id
      individual: number;
    };
    attendance: {
      totalRegistered: number;
      checkedIn: number;
      noShow: number;
      attendanceRate: number; // Percentage (1 decimal)
      generalAttended: number;
      generalTotal: number;
      premiumAttended: number;
      premiumTotal: number;
    };
  };
  breakoutSessions: ReportBreakoutSession[];
}
```

### Per-Registrant Row Shape

```typescript
interface ReportRegistrant {
  id: string;
  name: string;             // From User.name
  email: string;            // From User.email
  gender: string;           // 'N/A' — not in schema yet
  age: number;              // 0   — not in schema yet
  birthdate: string;        // 'N/A' — not in schema yet
  ticketType: string;       // From Ticket.name
  registrationType: 'Individual' | 'Group';
  status: 'Confirmed' | 'Pending' | 'Rejected';
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  registrationDate: string; // ISO date string (YYYY-MM-DD)
  checkedIn: boolean;       // From Registration.has_checked_in
}
```

### Breakout Session Row Shape

```typescript
interface ReportBreakoutSession {
  id: string;
  name: string;              // BreakoutSession.name
  speaker: string;           // BreakoutSession.speaker_name
  room: string;              // BreakoutSession.room_name
  capacity: number;          // BreakoutSession.room_capacity
  registered: number;        // Count of BreakoutSessionRegistration rows
  checkedIn: number;         // Count where check_in_time IS NOT NULL
  attendanceRate: number;    // Percentage (1 decimal)
}
```

### Database Queries

| Tab | Query |
|---|---|
| Registration | `Registration` JOIN `User(name, email)` JOIN `Ticket(name)` WHERE `event_id = ?` |
| Attendance | Same rows, filtered by `has_checked_in` for status display |
| Breakout | `BreakoutSession` JOIN `BreakoutSessionRegistration` WHERE `event_id = ?` |

### Data Flow

```
page.tsx (Server Component)
  ├── getEventById(id)      → event metadata (title, dates)
  └── getEventReports(id)   → reports data
          ↓
  <ReportsClient event={event} reports={reports} />
          ↓
  Destructures: { registrants, stats, breakoutSessions }
  Renders 3 tabs with search, filter, export (CSV/XLSX/PDF)
  Note: XLSX export uses ExcelJS (not the xlsx/SheetJS package, which was removed for security reasons)
```

> **Note:** Gender, age, and birthdate are not currently in the schema. When a `Registrant` profile table is added, update the query in `getEventReports()` and the `'N/A'` defaults will be replaced automatically.

---

## 3. Notifications

### Location
- **API Route:** [`app/api/notifications/route.ts`](file:///d:/g-events/app/api/notifications/route.ts) — `GET /api/notifications`
- **Context:** [`contexts/NotificationContext.tsx`](file:///d:/g-events/contexts/NotificationContext.tsx)
- **UI Component:** [`components/admin/NotificationDropdown.tsx`](file:///d:/g-events/components/admin/NotificationDropdown.tsx)

### API Route — `GET /api/notifications`

Returns an array of notification objects generated from live DB state.

#### Response Shape

```typescript
{
  success: boolean;
  data: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    title: string;
    message: string;
    timestamp: string;   // ISO string
    read: boolean;
  }[]
}
```

#### Notification Types Generated

| ID | Trigger | Type | Example |
|---|---|---|---|
| `regs-today` | Registrations with `created_at >= today` | `success` | "12 registrations today for Goodmorning!" |
| `pending-orders` | Registrations with `status = 'pending'` | `warning` | "5 orders need review for DevFest Cebu" |
| `event-soon-{id}` | Events with `event_start_at` within next 24h | `info` | "DevFest Cebu starts in 3 hours!" |
| `waitlist` | `WaitlistEntry` rows with `status = 'pending'` | `warning` | "8 attendees on the waitlist for GDG Summit" |

All 4 queries run in parallel via `Promise.allSettled` — a failed query silently returns no notification for that type rather than crashing the endpoint.

### NotificationContext

A React context that wraps the entire admin app and exposes notifications to any component via `useNotifications()`.

#### Available Values & Methods

```typescript
const {
  notifications,           // Notification[]
  unreadCount,             // number — count of unread
  addNotification,         // Add a one-off notification programmatically
  dismissNotification,     // Remove by ID + persist to localStorage
  markAsRead,              // Mark single notification read
  markAllAsRead,           // Mark all read
  clearAllNotifications,   // Remove all from state
} = useNotifications();
```

#### Lifecycle

1. On mount, fetches `GET /api/notifications`
2. Dismissed IDs are read from `localStorage` key `g_events_dismissed_notifications` and filtered out before setting state
3. When a notification is dismissed, its ID is written to `localStorage` so it stays dismissed across page refreshes

#### Resetting Dismissed Notifications (Dev/Testing)

Run in the browser console:
```js
localStorage.removeItem('g_events_dismissed_notifications')
```
Then refresh the page.

---

## Future Enhancements

| Module | Enhancement |
|---|---|
| Analytics | Per-event analytics with date range filtering |
| Event Reports | Gender/age/birthdate from a future `Registrant` profile table |
| Event Reports | Feedback/satisfaction score per event |
| Notifications | Server-Sent Events (SSE) or Supabase Realtime for live push notifications |
| Notifications | Notification persistence in DB so multiple admins share the same feed |
| Demographics | Real-time refresh when new order form submissions arrive |
| Demographics | Export demographics breakdown to CSV/XLSX (via ExcelJS) |

---

## 4. Event Analytics — Demographics Tab

### Overview

The Demographics tab aggregates answers from order form submissions for a specific event and visualizes them as interactive charts. It surfaces field-level distributions (e.g., how many attendees identified as Female vs. Male, which cities they come from, etc.) without any schema changes — all data is pulled from the existing `OrderFormEntries.form_data` JSONB column.

### Location

| Concern | File |
|---|---|
| Server Action | [`lib/actions/events.ts`](file:///d:/g-events/lib/actions/events.ts) — `getEventDemographics()` |
| Analytics Page | `app/(admin_side)/events/[eventId]/analytics/page.tsx` |
| Dashboard UI | [`components/admin/DashboardTabs.tsx`](file:///d:/g-events/components/admin/DashboardTabs.tsx) |

---

### Server Action — `getEventDemographics(eventId)`

```typescript
getEventDemographics(eventId: number): Promise<DemographicsData>
```

#### Return Type

```typescript
export interface DemographicsFieldData {
    identifier: string;               // e.g. 'gender'
    label: string;                    // e.g. 'Gender'
    distribution: {
        value: string;                // e.g. 'Female'
        count: number;                // How many submissions had this answer
    }[];
}

export interface DemographicsData {
    totalResponses: number;           // Total OrderFormEntries rows for this event
    fields: DemographicsFieldData[];  // One entry per tracked demographic field
}
```

#### Tracked Field Identifiers

Only the following `fieldIdentifier` values from `form_data` are surfaced:

| Identifier | Display Label |
|---|---|
| `gender` | Gender |
| `age` | Age |
| `city` | City |
| `country` | Country |
| `state` | State / Province |
| `company` | Company |
| `job_title` | Job Title |
| `department` | Department |
| `dietary_restrictions` | Dietary Restrictions |
| `special_needs` | Special Needs |
| `newsletter_signup` | Newsletter Signup |

Fields not found in any submission for that event are silently omitted from the output.

#### How It Works

1. Fetches all `OrderFormEntries` rows where `event_id = eventId` (only the `form_data` column).
2. For each entry, iterates through `form_data.sections[].inputs[]`.
3. Reads `input.fieldIdentifier` (or `input.field_identifier`) to identify the field.
4. Reads `input.answer` (string) or `input.answers` (array, for multi-select fields) as the submitted value(s).
5. Accumulates a count map: `{ [fieldIdentifier]: { [answerValue]: count } }`.
6. Returns fields sorted by the order in `DEMOGRAPHIC_FIELDS`, distributions sorted by count descending.

#### Expected JSONB Structure in `form_data`

```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "About You",
      "inputs": [
        {
          "id": "input-1",
          "question": "Gender",
          "fieldIdentifier": "gender",
          "answer": "Female"
        },
        {
          "id": "input-2",
          "question": "Dietary needs",
          "fieldIdentifier": "dietary_restrictions",
          "answers": ["Vegetarian", "Gluten-free"]
        }
      ]
    }
  ]
}
```

> **Note:** Both `answer` (string) and `answers` (array) are supported. `fieldIdentifier` and `field_identifier` (snake_case) are both accepted.

---

### Data Flow

```
analytics/page.tsx  (Server Component)
  └── Promise.all([
        getEventById(id),
        getEvents(),
        getEventAnalytics(id),
        getEventDemographics(id),   ← new, runs in parallel
      ])
           ↓
  <DashboardTabs data={data} demographics={demographics} />
           ↓
  Demographics tab (client-side, no extra fetch)
```

---

### Chart Type Logic (DashboardTabs.tsx)

The Demographics tab automatically selects the best visualization per field:

| Condition | Chart Type |
|---|---|
| `fieldIdentifier === 'age'` | **Donut chart** — age values are first grouped into ranges (Under 25, 25–34, 35–44, 45+), then rendered as donut slices |
| `distribution.length <= 5` | **Donut chart** — for low-cardinality fields like Gender and Newsletter Signup |
| All other fields | **Horizontal bar chart** — multi-color bars relative to the top answer |

Helper functions (defined at the top of `DashboardTabs.tsx`):

| Function | Purpose |
|---|---|
| `buildConicGradient(items, total)` | Generates a CSS `conic-gradient()` string for the donut |
| `groupAgeRanges(distribution)` | Buckets individual ages into 4 ranges before charting |

Colors cycle through: indigo → violet → pink → amber → teal → green.

---

### Empty State

If an event has no `OrderFormEntries`, or none of the entries contain tracked field identifiers, the tab displays a "No responses yet" placeholder instead of charts.

---

### Testing with Seed Data

To seed a test event with 10 fake demographic responses, run the following in the **Supabase SQL Editor**:

```sql
-- Step 1: Confirm event and form IDs
SELECT e.id AS event_id, o.id AS order_form_id
FROM "Event" e
LEFT JOIN "OrderForm" o ON o.event_id = e.id
WHERE e.title ILIKE '%<your event name>%';

-- Step 2: Create an OrderForm if order_form_id is NULL
INSERT INTO "OrderForm" (event_id, title, description, form_data)
SELECT id, 'Registration Form', 'Test form', '{\"sections\":[]}'
FROM "Event" WHERE title ILIKE '%<your event name>%'
RETURNING id;

-- Step 3: Seed entries (replace IDs with values from steps 1–2)
DO $$
DECLARE
  v_event_id BIGINT := <event_id>;
  v_form_id  BIGINT := <order_form_id>;
BEGIN
  INSERT INTO "OrderFormEntries" (event_id, order_form_id, user_email, form_data)
  VALUES
    (v_event_id, v_form_id, 'test1@test.com', '{"sections":[{"id":"s1","inputs":[
      {"fieldIdentifier":"gender","answer":"Female"},
      {"fieldIdentifier":"age","answer":"24"},
      {"fieldIdentifier":"city","answer":"Cebu City"},
      {"fieldIdentifier":"country","answer":"Philippines"},
      {"fieldIdentifier":"job_title","answer":"Software Engineer"}
    ]}]}');
  -- Add more rows as needed
END $$;
```

After seeding, refresh the event analytics page and click the **Demographics** tab.

