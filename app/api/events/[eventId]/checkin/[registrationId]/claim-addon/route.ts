import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import {
    claimAddOnVariantForRegistration,
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

        const body = (await request.json().catch(() => null)) as { station?: unknown; variantId?: unknown } | null;
        const station =
            typeof body?.station === 'string' && body.station.trim()
                ? body.station.trim().slice(0, 120)
                : 'checkin';
        const variantIdRaw = body?.variantId;
        const parsedVariantId =
            typeof variantIdRaw === 'number'
                ? variantIdRaw
                : typeof variantIdRaw === 'string' && variantIdRaw.trim()
                    ? Number(variantIdRaw)
                    : null;

        if (parsedVariantId !== null && (!Number.isInteger(parsedVariantId) || parsedVariantId <= 0)) {
            return NextResponse.json(
                { success: false, error: 'Invalid variantId' },
                { status: 400 }
            );
        }
        // Use admin client for privileged access. If the service role key is missing,
        // fall back to a regular client which respects row-level security. This prevents
        // a 404 ("Registration not found") when the admin client cannot be created.
        let admin;
        try {
            admin = await createAdminClient();
        } catch (e) {
            // If creating the admin client fails (e.g., missing SUPABASE_SERVICE_ROLE_KEY),
            // use the normal client which operates under the current user's session.
            admin = await createClient();
        }
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
        const filteredClaimable = parsedVariantId === null
            ? claimable
            : claimable.filter((item) => Number(item.variantId) === parsedVariantId);

        if (filteredClaimable.length === 0) {
            return NextResponse.json({
                success: true,
                alreadyClaimed: true,
                totalClaimedQty: 0,
                claimed: [],
            });
        }

        const result = parsedVariantId === null
            ? await claimAllAddOnsForRegistration(admin, parsedEventId, parsedRegistrationId, {
                station,
                scannedBy: user?.email || undefined,
            })
            : await claimAddOnVariantForRegistration(
                admin,
                parsedEventId,
                parsedRegistrationId,
                parsedVariantId,
                {
                    station,
                    scannedBy: user?.email || undefined,
                }
            );

        return NextResponse.json({
            success: true,
            alreadyClaimed: result.claimed.length === 0,
            totalClaimedQty: result.totalClaimedQty,
            claimed: result.claimed,
        });
    } catch (e: unknown) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        if (process.env.NODE_ENV === 'development') {
            console.error('checkin claim addon POST', e);
        }
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : 'Unexpected error' },
            { status: 500 }
        );
    }
}


