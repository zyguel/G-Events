import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase-server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { extractTicketTokenFromScan } from '@/lib/checkinScan';
import { resolveBreakoutTicketForEventCheckin } from '@/lib/breakoutCheckinScan';
import { extractCheckInToken, verifyCheckInToken } from '@/lib/checkinQr';

type CheckInRegistrationRow = {
  id: number;
  status?: string | null;
  has_checked_in: boolean | null;
  checked_in_at?: string | null;
};

function registrationNotConfirmed(status: unknown): boolean {
  const s = String(status || '').toLowerCase();
  return s !== 'confirmed';
}

/**
 * POST /api/events/[eventId]/checkin/scan/apply
 * Body: { raw: string } — same string family as scan (URL or token).
 * Checks in main event or breakout depending on ticket type (with full breakout validation).
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

    const body = (await request.json().catch(() => null)) as { raw?: string } | null;
    const raw = typeof body?.raw === 'string' ? body.raw : '';
    const rawToken = extractTicketTokenFromScan(raw);
    if (!rawToken) {
      return NextResponse.json(
        { success: false, error: 'Could not read a ticket from that scan' },
        { status: 400 }
      );
    }

    const admin = await createAdminClient();
    const authClient = await createClient();

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

    // 2. If it's a signed pass, we can fetch by registration ID directly
    if (isSignedPass && registrationId) {
      const { data: rawReg } = await admin
        .from('Registration')
        .select('id, event_id, status, has_checked_in, checked_in_at')
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

      if (reg.has_checked_in) {
        // Already checked in logic (already in original code, but we use 'reg' here)
        if (!reg.checked_in_at) {
          const now = new Date().toISOString();
          await admin.from('Registration').update({ checked_in_at: now }).eq('id', reg.id);
        }
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          kind: 'main' as const,
          message: 'Already checked in to the main event',
        });
      }

      const now = new Date().toISOString();
      const { error } = await authClient
        .from('Registration')
        .update({ has_checked_in: true, checked_in_at: now })
        .eq('id', reg.id)
        .eq('event_id', parsedEventId);

      if (error) {
        await admin.from('Registration').update({ has_checked_in: true, checked_in_at: now }).eq('id', reg.id);
      }

      return NextResponse.json({
        success: true,
        alreadyCheckedIn: false,
        kind: 'main' as const,
        message: 'Main event check-in recorded',
        checkInTime: new Date(now).toLocaleString(),
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
      const { bsr } = breakout;
      const already =
        !!bsr.check_in_time || String(bsr.status || '').toLowerCase() === 'checked_in';
      if (already) {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          kind: 'breakout' as const,
          message: 'Already checked in to this breakout',
        });
      }

      const now = new Date().toISOString();
      const { error: updErr } = await authClient
        .from('BreakoutSessionRegistration')
        .update({
          check_in_time: now,
          status: 'checked_in',
        })
        .eq('id', bsr.id)
        .eq('registration_id', bsr.registration_id);

      if (updErr) {
        await admin.from('BreakoutSessionRegistration').update({
          check_in_time: now,
          status: 'checked_in',
        }).eq('id', bsr.id);
      }

      return NextResponse.json({
        success: true,
        alreadyCheckedIn: false,
        kind: 'breakout' as const,
        message: 'Breakout check-in recorded',
        checkInTime: new Date(now).toLocaleString(),
      });
    }

    const { data: rawRegFallback } = await admin
      .from('Registration')
      .select('id, event_id, status, has_checked_in, checked_in_at')
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

    if (reg.has_checked_in) {
      if (!reg.checked_in_at) {
        const now = new Date().toISOString();
        const { error: patchMissingTimeError } = await authClient
          .from('Registration')
          .update({ checked_in_at: now })
          .eq('id', reg.id)
          .eq('event_id', parsedEventId);

        if (patchMissingTimeError) {
          const { error: adminPatchMissingTimeError } = await admin
            .from('Registration')
            .update({ checked_in_at: now })
            .eq('id', reg.id)
            .eq('event_id', parsedEventId);

          if (adminPatchMissingTimeError) {
            return NextResponse.json(
              { success: false, error: adminPatchMissingTimeError.message },
              { status: 500 }
            );
          }
        }
      }

      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        kind: 'main' as const,
        message: 'Already checked in to the main event',
      });
    }

    const now = new Date().toISOString();

    const { error } = await authClient
      .from('Registration')
      .update({ has_checked_in: true, checked_in_at: now })
      .eq('id', reg.id)
      .eq('event_id', parsedEventId);

    if (error) {
      const { error: adminErr } = await admin
        .from('Registration')
        .update({ has_checked_in: true, checked_in_at: now })
        .eq('id', reg.id)
        .eq('event_id', parsedEventId);

      if (adminErr) {
        return NextResponse.json(
          { success: false, error: adminErr.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: false,
      kind: 'main' as const,
      message: 'Main event check-in recorded',
      checkInTime: new Date(now).toLocaleString(),
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    console.error('checkin scan apply POST', e);
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 });
  }
}
