import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const CHECKIN_QR_PREFIX = "gevents-checkin:";
const CHECKIN_QR_VERSION = 1;
const DEFAULT_QR_TTL_HOURS = 24 * 365;
const EVENT_END_GRACE_HOURS = 24;

type CheckInTokenClaims = {
  v: number;
  eid: number;
  rid: number;
  email: string;
  iat: number;
  exp: number;
  nonce: string;
};

export type GeneratedCheckInPass = {
  token: string;
  qrPayload: string;
  expiresAt: string;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getCheckInSecret(): string {
  const secret =
    process.env.CHECKIN_QR_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      "Missing CHECKIN_QR_SECRET. Configure CHECKIN_QR_SECRET (recommended) or SUPABASE_SERVICE_ROLE_KEY to enable QR check-in signing."
    );
  }

  return secret;
}

function signPayload(payloadB64: string): string {
  const secret = getCheckInSecret();
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);

  if (leftBuf.length !== rightBuf.length) {
    return false;
  }

  return timingSafeEqual(leftBuf, rightBuf);
}

export function buildCheckInQrPayload(token: string): string {
  return `${CHECKIN_QR_PREFIX}${token}`;
}

export function extractCheckInToken(rawValue: string): string | null {
  const value = String(rawValue || "").trim();
  if (!value) return null;

  if (value.startsWith(CHECKIN_QR_PREFIX)) {
    return value.slice(CHECKIN_QR_PREFIX.length).trim() || null;
  }

  if (value.startsWith("{") && value.endsWith("}")) {
    try {
      const parsed = JSON.parse(value) as { token?: string };
      return typeof parsed?.token === "string" ? parsed.token.trim() : null;
    } catch {
      return null;
    }
  }

  return value;
}

export function generateCheckInPass(params: {
  eventId: number;
  registrationId: number;
  email: string;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  ttlHours?: number;
}): GeneratedCheckInPass {
  const nowSeconds = Math.floor(Date.now() / 1000);

  // Prefer event-aware expiry so changing event dates automatically changes newly generated QR validity.
  const eventEndMs = params.eventEndAt ? Date.parse(params.eventEndAt) : Number.NaN;
  const eventStartMs = params.eventStartAt ? Date.parse(params.eventStartAt) : Number.NaN;
  const eventReferenceMs = Number.isFinite(eventEndMs)
    ? eventEndMs
    : Number.isFinite(eventStartMs)
      ? eventStartMs
      : Number.NaN;
  const fallbackTtlHours = params.ttlHours ?? DEFAULT_QR_TTL_HOURS;
  const fallbackExpSeconds =
    nowSeconds + Math.max(1, Math.floor(fallbackTtlHours * 3600));
  const expSeconds = Number.isFinite(eventReferenceMs)
    ? Math.floor(eventReferenceMs / 1000) + EVENT_END_GRACE_HOURS * 3600
    : fallbackExpSeconds;

  const claims: CheckInTokenClaims = {
    v: CHECKIN_QR_VERSION,
    eid: params.eventId,
    rid: params.registrationId,
    email: params.email.trim().toLowerCase(),
    iat: nowSeconds,
    exp: expSeconds,
    nonce: randomBytes(12).toString("base64url"),
  };

  const payloadB64 = toBase64Url(JSON.stringify(claims));
  const signature = signPayload(payloadB64);
  const token = `${payloadB64}.${signature}`;

  return {
    token,
    qrPayload: buildCheckInQrPayload(token),
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  };
}

export function verifyCheckInToken(token: string): {
  valid: boolean;
  reason?: string;
  claims?: CheckInTokenClaims;
} {
  const parts = String(token || "").trim().split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "Invalid QR token format" };
  }

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) {
    return { valid: false, reason: "Invalid QR token segments" };
  }

  const expectedSig = signPayload(payloadB64);
  if (!safeEqual(expectedSig, signature)) {
    return { valid: false, reason: "QR signature verification failed" };
  }

  let claims: CheckInTokenClaims;
  try {
    claims = JSON.parse(fromBase64Url(payloadB64)) as CheckInTokenClaims;
  } catch {
    return { valid: false, reason: "Invalid QR token payload" };
  }

  if (claims.v !== CHECKIN_QR_VERSION) {
    return { valid: false, reason: "Unsupported QR token version" };
  }

  if (!Number.isInteger(claims.eid) || !Number.isInteger(claims.rid)) {
    return { valid: false, reason: "QR token has invalid identifiers" };
  }

  if (!claims.email || typeof claims.email !== "string") {
    return { valid: false, reason: "QR token is missing attendee email" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(claims.exp) || claims.exp < nowSeconds) {
    return { valid: false, reason: "QR token has expired" };
  }

  return { valid: true, claims };
}
