/**
 * Normalize camera / manual paste input into a ticket token.
 * Accepts full e-ticket URLs or raw tokens from attendee QR codes.
 */
export function extractTicketTokenFromScan(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;

  try {
    const u = new URL(t);
    const tok = u.searchParams.get('token');
    if (tok?.trim()) {
      return tok.trim();
    }
  } catch {
    // not a valid absolute URL
  }

  const rel = t.match(/[?&]token=([^&\s#]+)/);
  if (rel?.[1]) {
    try {
      return decodeURIComponent(rel[1].trim());
    } catch {
      return rel[1].trim();
    }
  }

  if (/^[A-Za-z0-9_-]{16,}$/.test(t)) {
    return t;
  }

  return t.length >= 8 ? t : null;
}
