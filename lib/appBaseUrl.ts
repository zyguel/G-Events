/**
 * Absolute origin for links and QR codes in emails (no trailing slash).
 */
function normalizeOrigin(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

function getRequestOrigin(
  requestLike?: { headers?: Headers | { get(name: string): string | null } }
): string | null {
  const headers = requestLike?.headers;
  if (!headers) return null;

  const xfProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const xfHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (xfProto && xfHost) {
    const origin = normalizeOrigin(`${xfProto}://${xfHost}`);
    if (origin) return origin;
  }

  const host = headers.get('host')?.trim();
  if (!host) return null;
  const origin = normalizeOrigin(`https://${host}`);
  if (origin) return origin;
  return normalizeOrigin(`http://${host}`);
}

export function getPublicAppBaseUrl(
  requestLike?: { headers?: Headers | { get(name: string): string | null } }
): string {
  const configured =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  const requestOrigin = getRequestOrigin(requestLike);

  if (configured) {
    const normalizedConfigured = normalizeOrigin(configured);
    if (!normalizedConfigured) {
      throw new Error('APP_URL/NEXT_PUBLIC_APP_URL must be a valid http(s) URL');
    }

    // If APP_URL is localhost but request comes from a public host, prefer public host.
    if (requestOrigin && isLocalOrigin(normalizedConfigured) && !isLocalOrigin(requestOrigin)) {
      return requestOrigin;
    }

    return normalizedConfigured;
  }

  if (requestOrigin) {
    return requestOrigin;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  throw new Error(
    'APP_URL, NEXT_PUBLIC_APP_URL, or VERCEL_URL is required for registration emails in production'
  );
}
