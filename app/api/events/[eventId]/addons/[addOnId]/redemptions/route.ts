import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireUser } from '@/lib/apiAuth';

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null) {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
            return maybeMessage;
        }

        const maybeDetails = (error as { details?: unknown }).details;
        if (typeof maybeDetails === 'string' && maybeDetails.trim()) {
            return maybeDetails;
        }
    }

    return fallback;
}

// GET /api/events/[eventId]/addons/[addOnId]/redemptions - Get redemption history for an addon
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; addOnId: string }> }
) {
    try {
        await requireUser();
        const { eventId, addOnId } = await params;
        const numEventId = parseInt(eventId);
        const numAddOnId = parseInt(addOnId);

        if (isNaN(numEventId) || isNaN(numAddOnId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID or addon ID' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // First, get all variant IDs for this addon
        const { data: variants, error: variantsError } = await supabase
            .from('AddOnVariant')
            .select('id')
            .eq('add_on_id', numAddOnId);

        if (variantsError) throw variantsError;

        if (!variants || variants.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        const variantIds = variants.map((v: any) => v.id);

        // Fetch redemption history with registration and variant details
        const { data, error } = await supabase
            .from('AddOnRedemption')
            .select(`
                id,
                qty,
                redeemed_at,
                station,
                scanned_by,
                registration_id,
                add_on_variant_id,
                Registration (
                    id,
                    User (
                        name,
                        email
                    )
                ),
                AddOnVariant (
                    id,
                    label,
                    AddOn (
                        name
                    )
                )
            `)
            .in('add_on_variant_id', variantIds)
            .order('redeemed_at', { ascending: false });

        if (error) throw error;

        // Transform the data to a cleaner format
        const redemptions = (data || []).map((item: any) => {
            const registration = Array.isArray(item.Registration) ? item.Registration[0] : item.Registration;
            const user = registration?.User ? (Array.isArray(registration.User) ? registration.User[0] : registration.User) : null;
            const variant = Array.isArray(item.AddOnVariant) ? item.AddOnVariant[0] : item.AddOnVariant;
            const addOn = variant?.AddOn ? (Array.isArray(variant.AddOn) ? variant.AddOn[0] : variant.AddOn) : null;

            return {
                id: item.id,
                qty: item.qty,
                redeemedAt: item.redeemed_at,
                station: item.station,
                scannedBy: item.scanned_by,
                registrationId: item.registration_id,
                userName: user?.name || 'Unknown',
                userEmail: user?.email || 'Unknown',
                variantLabel: variant?.label || 'Default',
                addOnName: addOn?.name || 'Add-on',
            };
        });

        return NextResponse.json({ success: true, data: redemptions });
    } catch (error: unknown) {
        console.error('Error fetching redemption history:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to fetch redemption history') },
            { status: 500 }
        );
    }
}
