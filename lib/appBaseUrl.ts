/**
 * Absolute origin for links and QR codes in emails (no trailing slash).
 */
export function getPublicAppBaseUrl(): string {
  const configured =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  throw new Error(
    'APP_URL, NEXT_PUBLIC_APP_URL, or VERCEL_URL is required for registration emails in production'
  );
}
