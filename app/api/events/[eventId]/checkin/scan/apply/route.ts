import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase-server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { extractTicketTokenFromScan } from '@/lib/checkinScan';
import { resolveBreakoutTicketForEventCheckin } from '@/lib/breakoutCheckinScan';

function registrationCancelled(status: unknown): boolean {
  const s = String(status || '').toLowerCase();
  return s === 'cancelled' || s === 'rejected';
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
    const token = extractTicketTokenFromScan(raw);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Could not read a ticket from that scan' },
        { status: 400 }
      );
    }

    const admin = await createAdminClient();
    const authClient = await createClient();

    const breakout = await resolveBreakoutTicketForEventCheckin(admin, token, parsedEventId);

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
        const { error: adminErr } = await admin
          .from('BreakoutSessionRegistration')
          .update({
            check_in_time: now,
            status: 'checked_in',
          })
          .eq('id', bsr.id);

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
        kind: 'breakout' as const,
        message: 'Breakout check-in recorded',
        checkInTime: new Date(now).toLocaleString(),
      });
    }

    const { data: reg } = await admin
      .from('Registration')
      .select('id, event_id, status, has_checked_in')
      .eq('ticket_token', token)
      .eq('event_id', parsedEventId)
      .maybeSingle();

    if (!reg) {
      return NextResponse.json(
        { success: false, error: 'Unknown or invalid ticket' },
        { status: 404 }
      );
    }

    if (registrationCancelled(reg.status)) {
      return NextResponse.json(
        { success: false, error: 'This registration is cancelled or rejected' },
        { status: 400 }
      );
    }

    if (reg.has_checked_in) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        kind: 'main' as const,
        message: 'Already checked in to the main event',
      });
    }

    const { error } = await authClient
      .from('Registration')
      .update({ has_checked_in: true })
      .eq('id', reg.id)
      .eq('event_id', parsedEventId);

    if (error) {
      const { error: adminErr } = await admin
        .from('Registration')
        .update({ has_checked_in: true })
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
      checkInTime: new Date().toLocaleString(),
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    console.error('checkin scan apply POST', e);
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 });
  }
}
