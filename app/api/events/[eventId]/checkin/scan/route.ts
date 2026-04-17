import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { extractTicketTokenFromScan } from '@/lib/checkinScan';
import { resolveBreakoutTicketForEventCheckin } from '@/lib/breakoutCheckinScan';
import { getClaimableAddOnsForRegistration } from '@/lib/checkinAddOnClaims';

function registrationNotConfirmed(status: unknown): boolean {
  const s = String(status || '').toLowerCase();
  return s !== 'confirmed';
}

/**
 * POST /api/events/[eventId]/checkin/scan
 * Body: { raw?: string, qrData?: string } — scanned QR text or pasted URL/token.
 * Resolves main event ticket or breakout ticket for this event (with session + registration validation).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUser();

    const { eventId } = await params;
    const parsedEventId = parseInt(eventId, 10);
    if (Number.isNaN(parsedEventId)) {
      return NextResponse.json({ success: false, error: 'Invalid eventId' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as
      | { raw?: string; qrData?: string }
      | null;
    const raw =
      (typeof body?.raw === 'string' ? body.raw : '') ||
      (typeof body?.qrData === 'string' ? body.qrData : '');
    const token = extractTicketTokenFromScan(raw);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Could not read a ticket from that scan' },
        { status: 400 }
      );
    }

    const admin = await createAdminClient();

    const breakout = await resolveBreakoutTicketForEventCheckin(admin, token, parsedEventId);

    if (breakout.kind === 'error') {
      return NextResponse.json(
        { success: false, error: breakout.error },
        { status: breakout.status }
      );
    }

    if (breakout.kind === 'ok') {
      const { bsr, session, reg } = breakout;
      const breakoutCheckedIn =
        !!bsr.check_in_time || String(bsr.status || '').toLowerCase() === 'checked_in';
      const claimableAddOns = await getClaimableAddOnsForRegistration(admin, Number(reg.id));
      const claimableAddOnQty = claimableAddOns.reduce(
        (sum, item) => sum + Number(item.remainingQty || 0),
        0
      );

      return NextResponse.json({
        success: true,
        token,
        kind: 'breakout' as const,
        participant: {
          name: reg.User?.name || 'Unknown',
          email: reg.User?.email || '',
          registrationId: String(reg.id),
        },
        ticketType: reg.Ticket?.name || 'General Admission',
        registrationStatus: String(reg.status || 'pending'),
        mainEventCheckedIn: !!reg.has_checked_in,
        mainEventStatus: reg.has_checked_in ? 'Checked-In' : 'Not Yet Checked-In',
        claimableAddOnQty,
        claimableAddOns,
        breakout: {
          breakoutRegistrationId: bsr.id,
          sessionId: session.id,
          title: session.name || 'Breakout session',
          location: session.room_name || '',
          checkedIn: breakoutCheckedIn,
          checkInTime: bsr.check_in_time
            ? new Date(String(bsr.check_in_time)).toLocaleString()
            : null,
        },
      });
    }

    const { data: reg } = await admin
      .from('Registration')
      .select(
        'id, event_id, status, has_checked_in, user_id, User(name, email), Ticket(name)'
      )
      .eq('ticket_token', token)
      .eq('event_id', parsedEventId)
      .maybeSingle();

    if (!reg) {
      return NextResponse.json(
        { success: false, error: 'Unknown or invalid ticket' },
        { status: 404 }
      );
    }

    if (registrationNotConfirmed(reg.status)) {
      return NextResponse.json(
        { success: false, error: 'This registration is not confirmed' },
        { status: 400 }
      );
    }

    const claimableAddOns = await getClaimableAddOnsForRegistration(admin, Number(reg.id));
    const claimableAddOnQty = claimableAddOns.reduce(
      (sum, item) => sum + Number(item.remainingQty || 0),
      0
    );

    return NextResponse.json({
      success: true,
      token,
      kind: 'main' as const,
      participant: {
        name: (reg as { User?: { name?: string } }).User?.name || 'Unknown',
        email: (reg as { User?: { email?: string } }).User?.email || '',
        registrationId: String(reg.id),
      },
      ticketType: (reg as { Ticket?: { name?: string } }).Ticket?.name || 'General Admission',
      registrationStatus: String(reg.status || 'pending'),
      mainEventCheckedIn: !!reg.has_checked_in,
      mainEventStatus: reg.has_checked_in ? 'Checked-In' : 'Not Yet Checked-In',
      claimableAddOnQty,
      claimableAddOns,
      breakout: null,
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    console.error('checkin scan POST', e);
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 });
  }
}
