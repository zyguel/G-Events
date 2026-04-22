const AUTH_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export function isAuthAdminPath(pathname: string): boolean {
  const p = pathname.split("?")[0] || "/";
  return AUTH_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`)
  );
}

/**
 * Allowed under compact admin: auth pages, /admin/events list, /admin/events/:slug/checkin (not .../new/...).
 */
export function isAllowedCompactAdminPath(pathname: string): boolean {
  if (isAuthAdminPath(pathname)) return true;
  const normalized = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";

  if (normalized === "/admin/events") return true;

  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] !== "admin" || segments[1] !== "events" || segments.length < 4) {
    return false;
  }
  if (segments[2] === "new") return false;
  if (segments[segments.length - 1] !== "checkin") return false;
  return true;
}

/**
 * From a blocked path, send the user to check-in for the same event if possible, else /admin/events.
 */
export function compactAdminRedirectTarget(pathname: string): string {
  const normalized = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const match = normalized.match(/^\/admin\/events\/([^/]+)/);
  if (match && match[1] !== "new") {
    return `/admin/events/${match[1]}/checkin`;
  }
  return "/admin/events";
}
