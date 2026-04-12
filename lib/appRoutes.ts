/**
 * URL conventions:
 * - `/events/[slug]` — attendee-facing (detail, register, e-ticket)
 * - `/admin/events/...` — organizer event management (no collision with client routes)
 */

export const ADMIN_EVENTS_ROOT = "/admin/events" as const;

/** Slug-based path under organizer event management. */
export function adminEventSegment(
  eventSlug: string,
  ...segments: string[]
): string {
  const tail = segments.filter(Boolean).join("/");
  return tail
    ? `${ADMIN_EVENTS_ROOT}/${eventSlug}/${tail}`
    : `${ADMIN_EVENTS_ROOT}/${eventSlug}`;
}
