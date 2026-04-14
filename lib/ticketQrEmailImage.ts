import { createHmac, timingSafeEqual } from "crypto";

/**
 * Email clients often strip or block <img src="data:image/...">. We serve QR PNGs
 * from a signed HTTPS URL instead.
 *
 * Uses TICKET_QR_EMAIL_SECRET if set, else CRON_SECRET, else a dev-only default.
 */
export function getTicketQrEmailSecret(): string {
  const fromEnv =
    process.env.TICKET_QR_EMAIL_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return "dev-insecure-ticket-qr-email-signing-key";
  }
  throw new Error(
    "Set TICKET_QR_EMAIL_SECRET (or CRON_SECRET) so e-ticket emails can embed QR images."
  );
}

export function buildSignedTicketQrImageUrl(appBaseUrl: string, ticketUrl: string): string {
  const secret = getTicketQrEmailSecret();
  const p = Buffer.from(ticketUrl, "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(p).digest("base64url");
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/api/ticket-qr?p=${encodeURIComponent(p)}&s=${encodeURIComponent(sig)}`;
}

export function verifySignedTicketQrPayload(
  p: string | null,
  s: string | null
): string | null {
  if (!p || !s) return null;
  let secret: string;
  try {
    secret = getTicketQrEmailSecret();
  } catch {
    return null;
  }
  try {
    const expected = createHmac("sha256", secret).update(p).digest("base64url");
    const a = Buffer.from(s, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return Buffer.from(p, "base64url").toString("utf8");
  } catch {
    return null;
  }
}
