import QRCode from 'qrcode';
import { escapeHtml } from '@/lib/security';

export async function buildTicketQrDataUrl(ticketUrl: string): Promise<string> {
  return QRCode.toDataURL(ticketUrl, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

export function buildEticketUrl(baseUrl: string, eventSlug: string, token: string): string {
  const t = encodeURIComponent(token);
  return `${baseUrl}/events/${eventSlug}/e-ticket?token=${t}`;
}

export function buildBreakoutEticketUrl(baseUrl: string, eventSlug: string, token: string): string {
  const t = encodeURIComponent(token);
  return `${baseUrl}/events/${eventSlug}/e-ticket/breakout?token=${t}`;
}

export function buildGroupCompleteUrl(baseUrl: string, eventSlug: string, token: string): string {
  const t = encodeURIComponent(token);
  return `${baseUrl}/events/${eventSlug}/register/complete?token=${t}`;
}

export function buildRegistrationConfirmationEmailHtml(params: {
  attendeeName: string;
  eventTitle: string;
  ticketName: string;
  /** Absolute https URL to /api/ticket-qr (email clients block data: QR images). */
  qrImageUrl: string;
  ticketUrl: string;
  isGroupPrimary?: boolean;
  breakoutsEnabled?: boolean;
}): string {
  const name = escapeHtml(params.attendeeName);
  const title = escapeHtml(params.eventTitle);
  const ticket = escapeHtml(params.ticketName);
  const ticketUrl = escapeHtml(params.ticketUrl);
  const qrImageUrl = escapeHtml(params.qrImageUrl);

  const groupNote =
    params.isGroupPrimary === true
      ? `<p style="margin:16px 0 0;font-size:14px;color:#444;line-height:1.5">Your group members will receive a separate email with a link to complete their details. They must sign in before submitting.</p>`
      : '';

  const breakoutNote =
    params.breakoutsEnabled === true
      ? `<p style="margin:12px 0 0;font-size:13px;color:#555;line-height:1.5">Optional in-person breakouts may be available on the event page. If you choose one, you will get a <strong>separate</strong> QR by email for that session.</p>`
      : '';

  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f4f7fc;padding:24px;color:#111">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 8px 30px rgba(61,81,140,0.12)">
    <p style="margin:0 0 8px;font-size:15px">Hi ${name},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">You&apos;re registered for <strong>${title}</strong>.</p>
    <p style="margin:0 0 8px;font-size:14px;color:#555">Ticket: <strong>${ticket}</strong></p>
    ${groupNote}
    ${breakoutNote}
    <div style="margin:24px 0;text-align:center">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#3D518C;text-transform:uppercase;letter-spacing:0.06em">Your e-ticket</p>
      <img src="${qrImageUrl}" alt="Ticket QR code" width="280" height="280" style="display:inline-block;border-radius:12px;border:1px solid #e8ecf4" />
    </div>
    <p style="margin:0;font-size:13px;color:#666;line-height:1.5">Show this QR code at check-in, or open your ticket online:</p>
    <p style="margin:12px 0 0"><a href="${ticketUrl}" style="color:#3D518C;font-weight:600;font-size:14px;word-break:break-all">${ticketUrl}</a></p>
  </div>
</body>
</html>`;
}

export function buildBreakoutTicketEmailHtml(params: {
  attendeeName: string;
  eventTitle: string;
  sessionTitle: string;
  sessionLocation?: string;
  qrImageUrl: string;
  ticketUrl: string;
}): string {
  const name = escapeHtml(params.attendeeName);
  const title = escapeHtml(params.eventTitle);
  const session = escapeHtml(params.sessionTitle);
  const loc = params.sessionLocation ? escapeHtml(params.sessionLocation) : '';
  const ticketUrl = escapeHtml(params.ticketUrl);
  const qrImageUrl = escapeHtml(params.qrImageUrl);

  const locLine = loc
    ? `<p style="margin:8px 0 0;font-size:14px;color:#555">Location: <strong>${loc}</strong></p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f4f7fc;padding:24px;color:#111">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 8px 30px rgba(99,102,241,0.12)">
    <p style="margin:0 0 8px;font-size:15px">Hi ${name},</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5">Your breakout session for <strong>${title}</strong> is confirmed.</p>
    <p style="margin:0;font-size:14px;color:#555">Session: <strong>${session}</strong></p>
    ${locLine}
    <div style="margin:24px 0;text-align:center">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6366F1;text-transform:uppercase;letter-spacing:0.06em">Breakout e-ticket</p>
      <img src="${qrImageUrl}" alt="Breakout QR code" width="280" height="280" style="display:inline-block;border-radius:12px;border:1px solid #e8e8fc" />
    </div>
    <p style="margin:0;font-size:13px;color:#666;line-height:1.5">Show this QR at the breakout check-in (separate from your main event ticket).</p>
    <p style="margin:12px 0 0"><a href="${ticketUrl}" style="color:#6366F1;font-weight:600;font-size:14px;word-break:break-all">${ticketUrl}</a></p>
  </div>
</body>
</html>`;
}

export function buildGroupMemberInviteEmailHtml(params: {
  eventTitle: string;
  completeUrl: string;
}): string {
  const title = escapeHtml(params.eventTitle);
  const url = escapeHtml(params.completeUrl);

  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f4f7fc;padding:24px;color:#111">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 8px 30px rgba(99,102,241,0.12)">
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5">You&apos;ve been added to a group registration for <strong>${title}</strong>.</p>
    <p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.5">The organizer already submitted payment details for the group. Please sign in and complete your attendee information using the link below.</p>
    <p style="margin:0"><a href="${url}" style="display:inline-block;padding:14px 22px;background:linear-gradient(90deg,#3D518C,#5C6BC0);color:#fff;text-decoration:none;font-weight:700;border-radius:12px;font-size:15px">Complete my registration</a></p>
    <p style="margin:20px 0 0;font-size:12px;color:#888;word-break:break-all">${url}</p>
  </div>
</body>
</html>`;
}
