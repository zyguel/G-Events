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

// GET /api/events/[eventId]/addons/[addOnId]/reserved - Get users who have reserved but not redeemed the addon
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
            .select('id, label')
            .eq('add_on_id', numAddOnId);

        if (variantsError) throw variantsError;

        if (!variants || variants.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        const variantIds = variants.map((v: any) => v.id);

        // Fetch all entitlements for this addon's variants
        const { data: entitlements, error: entitlementsError } = await supabase
            .from('AttendeeEntitlement')
            .select(`
                id,
                qty_total,
                qty_reserved,
                qty_redeemed,
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
                    label
                )
            `)
            .in('add_on_variant_id', variantIds);

        if (entitlementsError) throw entitlementsError;

        // Get all redemption IDs for this addon
        const { data: redemptions, error: redemptionsError } = await supabase
            .from('AddOnRedemption')
            .select('entitlement_id')
            .in('add_on_variant_id', variantIds);

        if (redemptionsError) throw redemptionsError;

        const redeemedEntitlementIds = new Set(
            (redemptions || []).map((r: any) => r.entitlement_id)
        );

        // Filter entitlements to only those that haven't been redeemed
        const reservedUsers = (entitlements || [])
            .filter((entitlement: any) => !redeemedEntitlementIds.has(entitlement.id))
            .map((entitlement: any) => {
                const registration = Array.isArray(entitlement.Registration) 
                    ? entitlement.Registration[0] 
                    : entitlement.Registration;
                const user = registration?.User 
                    ? (Array.isArray(registration.User) ? registration.User[0] : registration.User) 
                    : null;
                const variant = Array.isArray(entitlement.AddOnVariant) 
                    ? entitlement.AddOnVariant[0] 
                    : entitlement.AddOnVariant;

                return {
                    id: entitlement.id,
                    qtyTotal: entitlement.qty_total,
                    qtyReserved: entitlement.qty_reserved,
                    qtyRedeemed: entitlement.qty_redeemed,
                    registrationId: entitlement.Registration?.id,
                    userName: user?.name || 'Unknown',
                    userEmail: user?.email || 'Unknown',
                    variantLabel: variant?.label || 'Default',
                };
            });

        return NextResponse.json({ success: true, data: reservedUsers });
    } catch (error: unknown) {
        console.error('Error fetching reserved users:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to fetch reserved users') },
            { status: 500 }
        );
    }
}
