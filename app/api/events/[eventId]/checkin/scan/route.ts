import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { extractTicketTokenFromScan } from '@/lib/checkinScan';
import { resolveBreakoutTicketForEventCheckin } from '@/lib/breakoutCheckinScan';
import { getAddOnClaimSummariesByRegistrationIds } from '@/lib/checkinAddOnClaims';
import { extractCheckInToken, verifyCheckInToken } from '@/lib/checkinQr';

type CheckInRegistrationRow = {
  id: number;
  status?: string | null;
  has_checked_in: boolean | null;
  checked_in_at?: string | null;
  User?: {
    name?: string | null;
    email?: string | null;
  } | null;
  Ticket?: {
    name?: string | null;
  } | null;
};

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
    const rawToken = extractTicketTokenFromScan(raw);
    if (!rawToken) {
      return NextResponse.json(
        { success: false, error: 'Could not read a ticket from that scan' },
        { status: 400 }
      );
    }

    const admin = await createAdminClient();

    // 1. Try to resolve as a signed check-in pass (used in in-app QRs)
    let registrationId: number | null = null;
    let isSignedPass = false;

    const checkInToken = extractCheckInToken(rawToken);
    if (checkInToken) {
      const verification = verifyCheckInToken(checkInToken);
      if (verification.valid && verification.claims) {
        if (verification.claims.eid !== parsedEventId) {
          return NextResponse.json(
            { success: false, error: 'This ticket is for a different event' },
            { status: 400 }
          );
        }
        registrationId = verification.claims.rid;
        isSignedPass = true;
      }
    }

    // 2. If it's a signed pass, fetch by registration ID directly
    if (isSignedPass && registrationId) {
      const { data: rawReg } = await admin
        .from('Registration')
        .select('id, status, has_checked_in, user_id, User(name, email), Ticket(name)')
        .eq('id', registrationId)
        .eq('event_id', parsedEventId)
        .maybeSingle();

      const reg = rawReg as CheckInRegistrationRow | null;

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

      const addOnSummary = (await getAddOnClaimSummariesByRegistrationIds(admin, [Number(reg.id)])).get(Number(reg.id));
      const claimableAddOns = addOnSummary?.claimableAddOns || [];
      const claimableAddOnQty = Number(addOnSummary?.claimableAddOnQty || 0);
      const totalAddOnQty = Number(addOnSummary?.totalAddOnQty || 0);

      return NextResponse.json({
        success: true,
        token: rawToken,
        kind: 'main' as const,
        participant: {
          name: reg.User?.name || 'Unknown',
          email: reg.User?.email || '',
          registrationId: String(reg.id),
        },
        ticketType: reg.Ticket?.name || 'General Admission',
        registrationStatus: String(reg.status || 'pending'),
        mainEventCheckedIn: !!reg.has_checked_in,
        mainEventStatus: reg.has_checked_in ? 'Checked-In' : 'Not Yet Checked-In',
        totalAddOnQty,
        claimableAddOnQty,
        claimableAddOns,
        breakout: null,
      });
    }

    // 3. Fallback: Try to resolve as a breakout ticket token or legacy main ticket token
    const breakout = await resolveBreakoutTicketForEventCheckin(admin, rawToken, parsedEventId);

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
      const addOnSummary = (await getAddOnClaimSummariesByRegistrationIds(admin, [Number(reg.id)])).get(Number(reg.id));
      const claimableAddOns = addOnSummary?.claimableAddOns || [];
      const claimableAddOnQty = Number(addOnSummary?.claimableAddOnQty || 0);
      const totalAddOnQty = Number(addOnSummary?.totalAddOnQty || 0);

      return NextResponse.json({
        success: true,
        token: rawToken,
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
        totalAddOnQty,
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

    const { data: rawRegFallback } = await admin
      .from('Registration')
      .select(
        'id, status, has_checked_in, user_id, User(name, email), Ticket(name)'
      )
      .eq('ticket_token', rawToken)
      .eq('event_id', parsedEventId)
      .maybeSingle();

    const reg = rawRegFallback as CheckInRegistrationRow | null;

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

    const addOnSummary = (await getAddOnClaimSummariesByRegistrationIds(admin, [Number(reg.id)])).get(Number(reg.id));
    const claimableAddOns = addOnSummary?.claimableAddOns || [];
    const claimableAddOnQty = Number(addOnSummary?.claimableAddOnQty || 0);
    const totalAddOnQty = Number(addOnSummary?.totalAddOnQty || 0);

    return NextResponse.json({
      success: true,
      token: rawToken,
      kind: 'main' as const,
      participant: {
        name: reg.User?.name || 'Unknown',
        email: reg.User?.email || '',
        registrationId: String(reg.id),
      },
      ticketType: reg.Ticket?.name || 'General Admission',
      registrationStatus: String(reg.status || 'pending'),
      mainEventCheckedIn: !!reg.has_checked_in,
      mainEventStatus: reg.has_checked_in ? 'Checked-In' : 'Not Yet Checked-In',
      totalAddOnQty,
      claimableAddOnQty,
      claimableAddOns,
      breakout: null,
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    if (process.env.NODE_ENV === 'development') {
        console.error('checkin scan POST', e);
    }
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 });
  }
}
