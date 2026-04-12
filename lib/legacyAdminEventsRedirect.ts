import { ADMIN_EVENTS_ROOT } from "@/lib/appRoutes";

/**
 * Third path segment under `/events/[eventId]/...` that belongs to organizer tools
 * (historically shared the `/events` prefix with attendee pages).
 */
const ADMIN_EVENT_THIRD_SEGMENTS = new Set([
  "overview",
  "checkin",
  "tickets",
  "reports",
  "orders",
  "analytics",
  "publish",
  "breakouts",
  "waitlist",
  "email-attendees",
  "certificates",
  "orderform",
  "orderconfirmation",
]);

/**
 * If the pathname is a pre-refactor organizer URL under `/events/...`, returns the
 * new `/admin/events/...` URL (pathname + search). Otherwise null.
 */
export function legacyAdminEventsRedirectTarget(
  pathname: string,
  search: string
): string | null {
  const pathOnly = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const parts = pathOnly.split("/").filter(Boolean);

  if (parts[0] !== "events") return null;

  // /events → organizer event list
  if (parts.length === 1) {
    return `${ADMIN_EVENTS_ROOT}${search}`;
  }

  // /events/new/...
  if (parts[1] === "new") {
    return `${ADMIN_EVENTS_ROOT}${pathOnly.slice("/events".length)}${search}`;
  }

  // /events/<slug> — public event page
  if (parts.length === 2) return null;

  const third = parts[2];

  if (third === "register") {
    if (parts.length === 3) return null;
    if (parts.length === 4 && parts[3] === "complete") return null;
    return null;
  }
  if (third === "e-ticket") return null;
  if (third === "review" || third === "my-breakouts") return null;

  if (ADMIN_EVENT_THIRD_SEGMENTS.has(third)) {
    return `${ADMIN_EVENTS_ROOT}${pathOnly.slice("/events".length)}${search}`;
  }

  return null;
}
