import { createHmac, timingSafeEqual } from 'crypto';

type WaitlistInviteClaims = {
  v: number;
  eid: number;
  wid: number;
  email: string;
  tid: number | null;
  iat: number;
  exp: number;
};

const WAITLIST_INVITE_VERSION = 1;

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getWaitlistInviteSecret(): string {
  const secret =
    process.env.WAITLIST_INVITE_SECRET ||
    process.env.CHECKIN_QR_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('Missing waitlist invite signing secret');
  }

  return secret;
}

function signPayload(payloadB64: string): string {
  return createHmac('sha256', getWaitlistInviteSecret())
    .update(payloadB64)
    .digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);

  if (leftBuf.length !== rightBuf.length) return false;

  return timingSafeEqual(leftBuf, rightBuf);
}

export function generateWaitlistInviteToken(params: {
  eventId: number;
  waitlistEntryId: number;
  email: string;
  ticketId?: number | null;
  expiresAt: Date;
}): string {
  const claims: WaitlistInviteClaims = {
    v: WAITLIST_INVITE_VERSION,
    eid: params.eventId,
    wid: params.waitlistEntryId,
    email: params.email.trim().toLowerCase(),
    tid: params.ticketId ?? null,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(params.expiresAt.getTime() / 1000),
  };

  const payloadB64 = toBase64Url(JSON.stringify(claims));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyWaitlistInviteToken(token: string): {
  valid: boolean;
  reason?: string;
  claims?: WaitlistInviteClaims;
} {
  const parts = String(token || '').trim().split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Invalid waitlist invite token format' };
  }

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) {
    return { valid: false, reason: 'Invalid waitlist invite token segments' };
  }

  const expectedSig = signPayload(payloadB64);
  if (!safeEqual(expectedSig, signature)) {
    return { valid: false, reason: 'Waitlist invite signature verification failed' };
  }

  let claims: WaitlistInviteClaims;
  try {
    claims = JSON.parse(fromBase64Url(payloadB64)) as WaitlistInviteClaims;
  } catch {
    return { valid: false, reason: 'Invalid waitlist invite token payload' };
  }

  if (claims.v !== WAITLIST_INVITE_VERSION) {
    return { valid: false, reason: 'Unsupported waitlist invite token version' };
  }

  if (!Number.isInteger(claims.eid) || !Number.isInteger(claims.wid)) {
    return { valid: false, reason: 'Waitlist invite token has invalid identifiers' };
  }

  if (typeof claims.email !== 'string' || !claims.email.trim()) {
    return { valid: false, reason: 'Waitlist invite token is missing email' };
  }

  if (claims.tid !== null && !Number.isInteger(claims.tid)) {
    return { valid: false, reason: 'Waitlist invite token has invalid ticket id' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(claims.exp) || claims.exp < nowSeconds) {
    return { valid: false, reason: 'Waitlist invite token has expired' };
  }

  return { valid: true, claims };
}
