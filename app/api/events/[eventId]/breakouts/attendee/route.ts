import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase-server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import {
  isInPersonBreakoutDescription,
  parseBreakoutDescription,
} from '@/lib/breakoutSessionUtils';
import { getPublicAppBaseUrl } from '@/lib/appBaseUrl';
import { buildEventSlug } from '@/lib/slug';
import { newTicketToken } from '@/lib/ticketToken';
import { buildSignedTicketQrImageUrl } from '@/lib/ticketQrEmailImage';
import {
  buildBreakoutEticketUrl,
  buildBreakoutTicketEmailHtml,
} from '@/lib/ticketEmail';
import { sendEmail } from '@/lib/emailProvider';

function mapPublicSession(row: {
  id: number;
  name: string | null;
  description: string | null;
  room_name: string | null;
  room_capacity: number | null;
  BreakoutSessionRegistration?: { id: number }[] | null;
}) {
  const meta = parseBreakoutDescription(row.description);
  const regs = row.BreakoutSessionRegistration || [];
  const used = Array.isArray(regs) ? regs.length : 0;
  const cap = Number(row.room_capacity ?? 0);
  const spotsLeft = cap <= 0 ? null : Math.max(0, cap - used);
  return {
    id: row.id,
    title: row.name || `Session ${row.id}`,
    location: row.room_name || '',
    date: meta.date || '',
    time: meta.time || '',
    maxCapacity: cap,
    spotsLeft,
    isFull: cap > 0 && used >= cap,
  };
}

/**
 * GET — authenticated attendee: eligible breakout list + current selection (in-person sessions only).
 * Unauthenticated: { signedIn: false } (no session data).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const id = parseInt(eventId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid eventId' }, { status: 400 });
    }

    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({
        success: true,
        signedIn: false,
        eligible: false,
        registeredForEvent: false,
        profileComplete: false,
        sessions: [] as ReturnType<typeof mapPublicSession>[],
        selectedSessionId: null as number | null,
      });
    }

    const admin = await createAdminClient();

    const { data: eventRow, error: evErr } = await admin
      .from('Event')
      .select('id, title, allow_breakout_sessions, is_published, is_visible')
      .eq('id', id)
      .maybeSingle();

    if (evErr || !eventRow?.is_published || !eventRow?.is_visible) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    if (!eventRow.allow_breakout_sessions) {
      return NextResponse.json({
        success: true,
        signedIn: true,
        eligible: false,
        registeredForEvent: false,
        profileComplete: false,
        sessions: [],
        selectedSessionId: null,
        reason: 'breakouts_disabled',
      });
    }

    const { data: userRow } = await admin
      .from('User')
      .select('id')
      .ilike('email', user.email.trim())
      .maybeSingle();

    if (!userRow) {
      return NextResponse.json({
        success: true,
        signedIn: true,
        eligible: false,
        registeredForEvent: false,
        profileComplete: false,
        sessions: [],
        selectedSessionId: null,
      });
    }

    const { data: reg } = await admin
      .from('Registration')
      .select('id, status, profile_pending')
      .eq('event_id', id)
      .eq('user_id', userRow.id)
      .maybeSingle();

    if (!reg) {
      return NextResponse.json({
        success: true,
        signedIn: true,
        eligible: false,
        registeredForEvent: false,
        profileComplete: false,
        sessions: [],
        selectedSessionId: null,
        reason: 'not_registered',
      });
    }

    const st = String(reg.status || '').toLowerCase();
    if (st === 'cancelled' || st === 'rejected') {
      return NextResponse.json({
        success: true,
        signedIn: true,
        eligible: false,
        registeredForEvent: false,
        profileComplete: false,
        sessions: [],
        selectedSessionId: null,
        reason: 'not_registered',
      });
    }

    if (reg.profile_pending === true) {
      return NextResponse.json({
        success: true,
        signedIn: true,
        eligible: false,
        registeredForEvent: true,
        profileComplete: false,
        sessions: [],
        selectedSessionId: null,
        reason: 'complete_profile',
      });
    }

    const { data: sessionRows, error: sErr } = await admin
      .from('BreakoutSession')
      .select(
        'id, name, description, room_name, room_capacity, BreakoutSessionRegistration(id)'
      )
      .eq('event_id', id)
      .order('id', { ascending: true });

    if (sErr) {
      console.error('breakouts/attendee GET sessions', sErr);
      return NextResponse.json({ success: false, error: sErr.message }, { status: 500 });
    }

    const inPerson = (sessionRows || []).filter((row: { description?: string | null }) =>
      isInPersonBreakoutDescription(row.description)
    );

    const sessions = inPerson.map((row) => mapPublicSession(row));

    if (sessions.length === 0) {
      return NextResponse.json({
        success: true,
        signedIn: true,
        eligible: false,
        registeredForEvent: true,
        profileComplete: true,
        sessions: [],
        selectedSessionId: null,
        reason: 'no_in_person_sessions',
      });
    }

    const { data: pick } = await admin
      .from('BreakoutSessionRegistration')
      .select('breakout_session_id')
      .eq('registration_id', reg.id)
      .maybeSingle();

    const selectedSessionId =
      pick && typeof pick.breakout_session_id === 'number' ? pick.breakout_session_id : null;

    return NextResponse.json({
      success: true,
      signedIn: true,
      eligible: sessions.length > 0,
      registeredForEvent: true,
      profileComplete: true,
      sessions,
      selectedSessionId,
      registrationId: reg.id,
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    console.error('breakouts/attendee GET', e);
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 });
  }
}

/**
 * POST — select one in-person breakout or clear (main event only).
 * Body: { breakoutSessionId: number | null }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireUser();
    const { eventId } = await params;
    const id = parseInt(eventId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid eventId' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as {
      breakoutSessionId?: number | null;
    } | null;

    if (!body || !('breakoutSessionId' in body)) {
      return NextResponse.json({ success: false, error: 'Missing breakoutSessionId' }, { status: 400 });
    }

    const raw = body.breakoutSessionId;
    const breakoutSessionId = raw === null ? null : parseInt(String(raw), 10);
    if (breakoutSessionId !== null && Number.isNaN(breakoutSessionId)) {
      return NextResponse.json({ success: false, error: 'Invalid breakoutSessionId' }, { status: 400 });
    }

    const admin = await createAdminClient();

    const { data: eventRow, error: evErr } = await admin
      .from('Event')
      .select('id, title, allow_breakout_sessions, is_published, is_visible')
      .eq('id', id)
      .maybeSingle();

    if (evErr || !eventRow?.is_published || !eventRow?.is_visible) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    if (!eventRow.allow_breakout_sessions) {
      return NextResponse.json({ success: false, error: 'Breakouts are not enabled for this event' }, { status: 403 });
    }

    const { data: userRow } = await admin
      .from('User')
      .select('id, name, email')
      .ilike('email', user.email!.trim())
      .maybeSingle();

    if (!userRow) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 403 });
    }

    const { data: reg } = await admin
      .from('Registration')
      .select('id, status, profile_pending')
      .eq('event_id', id)
      .eq('user_id', userRow.id)
      .maybeSingle();

    if (!reg) {
      return NextResponse.json({ success: false, error: 'You must register for this event first' }, { status: 403 });
    }

    const st = String(reg.status || '').toLowerCase();
    if (st === 'cancelled' || st === 'rejected') {
      return NextResponse.json({ success: false, error: 'Registration is not active' }, { status: 403 });
    }

    if (reg.profile_pending === true) {
      return NextResponse.json(
        { success: false, error: 'Finish your registration details before choosing a breakout' },
        { status: 403 }
      );
    }

    if (breakoutSessionId === null) {
      const { error: delErr } = await admin
        .from('BreakoutSessionRegistration')
        .delete()
        .eq('registration_id', reg.id);

      if (delErr) {
        return NextResponse.json({ success: false, error: delErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Breakout cleared. You are signed up for the main session only.',
        selectedSessionId: null,
      });
    }

    const { data: sessionRow, error: sessErr } = await admin
      .from('BreakoutSession')
      .select('id, name, description, room_name, room_capacity')
      .eq('id', breakoutSessionId)
      .eq('event_id', id)
      .maybeSingle();

    if (sessErr || !sessionRow) {
      return NextResponse.json({ success: false, error: 'Breakout session not found' }, { status: 404 });
    }

    if (!isInPersonBreakoutDescription(sessionRow.description)) {
      return NextResponse.json(
        { success: false, error: 'Only in-person breakout sessions can be selected' },
        { status: 400 }
      );
    }

    const cap = Number(sessionRow.room_capacity ?? 0);

    const { data: seatRows } = await admin
      .from('BreakoutSessionRegistration')
      .select('registration_id')
      .eq('breakout_session_id', breakoutSessionId);

    const seats = seatRows || [];
    const alreadyIn = seats.some((r: { registration_id: number }) => r.registration_id === reg.id);
    if (cap > 0 && !alreadyIn && seats.length >= cap) {
      return NextResponse.json({ success: false, error: 'This breakout session is full' }, { status: 409 });
    }

    const token = newTicketToken();

    const payload = {
      registration_id: reg.id,
      breakout_session_id: breakoutSessionId,
      ticket_token: token,
    };

    const { error: upErr } = await admin
      .from('BreakoutSessionRegistration')
      .upsert(payload, { onConflict: 'registration_id' });

    if (upErr) {
      await admin.from('BreakoutSessionRegistration').delete().eq('registration_id', reg.id);
      const { error: insErr } = await admin.from('BreakoutSessionRegistration').insert(payload);
      if (insErr) {
        console.error('breakouts/attendee save', upErr, insErr);
        return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
      }
    }

    const attendeeName =
      [userRow.name, userRow.email].find((v) => typeof v === 'string' && v.trim().length > 0) || 'Attendee';

    try {
      const baseUrl = getPublicAppBaseUrl();
      const slug = buildEventSlug(eventRow.title, id);
      const ticketUrl = buildBreakoutEticketUrl(baseUrl, slug, token);
      const qrImageUrl = buildSignedTicketQrImageUrl(baseUrl, ticketUrl);
      const html = buildBreakoutTicketEmailHtml({
        attendeeName: String(attendeeName),
        eventTitle: eventRow.title,
        sessionTitle: sessionRow.name || 'Breakout session',
        sessionLocation: sessionRow.room_name || undefined,
        qrImageUrl,
        ticketUrl,
      });
      const to = user.email!;
      await sendEmail({
        to,
        subject: `Breakout ticket — ${sessionRow.name || eventRow.title}`,
        html,
      });
    } catch (mailErr) {
      console.warn('Breakout ticket email failed', mailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Breakout saved. Check your email for a separate QR ticket.',
      selectedSessionId: breakoutSessionId,
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    console.error('breakouts/attendee POST', e);
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 });
  }
}
