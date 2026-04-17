import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import {
    claimAllAddOnsForRegistration,
    getClaimableAddOnsForRegistration,
} from '@/lib/checkinAddOnClaims';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; registrationId: string }> }
) {
    try {
        const user = await requireUser();

        const { eventId, registrationId } = await params;
        const parsedEventId = parseInt(eventId, 10);
        const parsedRegistrationId = parseInt(registrationId, 10);

        if (Number.isNaN(parsedEventId) || Number.isNaN(parsedRegistrationId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid eventId or registrationId' },
                { status: 400 }
            );
        }

        const body = (await request.json().catch(() => null)) as { station?: unknown } | null;
        const station =
            typeof body?.station === 'string' && body.station.trim()
                ? body.station.trim().slice(0, 120)
                : 'checkin';

        const admin = await createAdminClient();
        const { data: registration, error: registrationError } = await admin
            .from('Registration')
            .select('id, event_id, status')
            .eq('id', parsedRegistrationId)
            .eq('event_id', parsedEventId)
            .maybeSingle();

        if (registrationError) {
            return NextResponse.json(
                { success: false, error: registrationError.message },
                { status: 500 }
            );
        }

        if (!registration) {
            return NextResponse.json(
                { success: false, error: 'Registration not found' },
                { status: 404 }
            );
        }

        if (String(registration.status || '').toLowerCase() !== 'confirmed') {
            return NextResponse.json(
                { success: false, error: 'Only confirmed registrations can claim add-ons' },
                { status: 400 }
            );
        }

        const claimable = await getClaimableAddOnsForRegistration(admin, parsedRegistrationId);
        if (claimable.length === 0) {
            return NextResponse.json({
                success: true,
                alreadyClaimed: true,
                totalClaimedQty: 0,
                claimed: [],
            });
        }

        const result = await claimAllAddOnsForRegistration(admin, parsedEventId, parsedRegistrationId, {
            station,
            scannedBy: user?.email || undefined,
        });

        return NextResponse.json({
            success: true,
            alreadyClaimed: result.claimed.length === 0,
            totalClaimedQty: result.totalClaimedQty,
            claimed: result.claimed,
        });
    } catch (e: unknown) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error('checkin claim addon POST', e);
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : 'Unexpected error' },
            { status: 500 }
        );
    }
}
