import type { SupabaseClient } from '@supabase/supabase-js';

export type ClaimableAddOn = {
    entitlementId: number;
    variantId: number;
    addOnName: string;
    variantLabel: string;
    remainingQty: number;
};

type ClaimRpcRow = {
    entitlement_id: number | null;
    add_on_variant_id: number | null;
    add_on_name: string | null;
    variant_label: string | null;
    claimed_qty: number | null;
};

type AddOnRow = {
    name: string | null;
};

type AddOnRelation = AddOnRow | AddOnRow[] | null;

type AddOnVariantRow = {
    id: number | null;
    label: string | null;
    stock_reserved?: number | null;
    stock_redeemed?: number | null;
    AddOn?: AddOnRelation;
};

type AddOnVariantRelation = AddOnVariantRow | AddOnVariantRow[] | null;

type EntitlementRow = {
    id: number;
    registration_id: number;
    add_on_variant_id: number | null;
    qty_total: number | null;
    qty_reserved: number | null;
    qty_redeemed: number | null;
    AddOnVariant?: AddOnVariantRelation;
};

const toSafeNumber = (value: unknown): number => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, n);
};

const firstRelation = <T>(value: T | T[] | null | undefined): T | null => {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
};

function mapClaimableEntitlement(row: EntitlementRow): ClaimableAddOn | null {
    const variant = firstRelation(row.AddOnVariant);
    const addOn = firstRelation(variant?.AddOn ?? null);

    const entitlementId = Number(row.id);
    const variantId = Number(row.add_on_variant_id ?? variant?.id);
    const remainingQty = Math.max(
        0,
        toSafeNumber(row.qty_total) - toSafeNumber(row.qty_redeemed)
    );

    if (!Number.isInteger(entitlementId) || !Number.isInteger(variantId) || remainingQty <= 0) {
        return null;
    }

    return {
        entitlementId,
        variantId,
        addOnName: String(addOn?.name || 'Add-on'),
        variantLabel: String(variant?.label || 'Default'),
        remainingQty,
    };
}

export async function getClaimableAddOnsByRegistrationIds(
    admin: SupabaseClient,
    registrationIds: number[]
): Promise<Map<number, ClaimableAddOn[]>> {
    const map = new Map<number, ClaimableAddOn[]>();
    if (registrationIds.length === 0) return map;

    const uniqueIds = Array.from(new Set(registrationIds.filter((id) => Number.isInteger(id) && id > 0)));
    if (uniqueIds.length === 0) return map;

    const { data, error } = await admin
        .from('AttendeeEntitlement')
        .select(
            'id, registration_id, add_on_variant_id, qty_total, qty_reserved, qty_redeemed, AddOnVariant(id, label, AddOn(name))'
        )
        .in('registration_id', uniqueIds);

    if (error) {
        throw new Error(error.message);
    }

    for (const rawRow of (data as EntitlementRow[] | null) || []) {
        const registrationId = Number(rawRow.registration_id);
        if (!Number.isInteger(registrationId)) continue;

        const claimable = mapClaimableEntitlement(rawRow);
        if (!claimable) continue;

        const existing = map.get(registrationId) || [];
        existing.push(claimable);
        map.set(registrationId, existing);
    }

    return map;
}

export async function getClaimableAddOnsForRegistration(
    admin: SupabaseClient,
    registrationId: number
): Promise<ClaimableAddOn[]> {
    const byRegistration = await getClaimableAddOnsByRegistrationIds(admin, [registrationId]);
    return byRegistration.get(registrationId) || [];
}

export async function claimAllAddOnsForRegistration(
    admin: SupabaseClient,
    eventId: number,
    registrationId: number,
    options?: { station?: string; scannedBy?: string }
): Promise<{ claimed: ClaimableAddOn[]; totalClaimedQty: number }> {
    const { data, error } = await admin.rpc('claim_registration_addons_atomic', {
        p_event_id: eventId,
        p_registration_id: registrationId,
        p_station: options?.station || 'checkin',
        p_scanned_by: options?.scannedBy || null,
    });

    if (error) {
        throw new Error(error.message);
    }

    const claimed = ((data as ClaimRpcRow[] | null) || [])
        .map((row) => {
            const entitlementId = Number(row.entitlement_id ?? 0);
            const variantId = Number(row.add_on_variant_id ?? 0);
            const claimedQty = Number(row.claimed_qty ?? 0);

            if (!Number.isInteger(entitlementId) || !Number.isInteger(variantId) || claimedQty <= 0) {
                return null;
            }

            return {
                entitlementId,
                variantId,
                addOnName: String(row.add_on_name || 'Add-on'),
                variantLabel: String(row.variant_label || 'Default'),
                remainingQty: claimedQty,
            } satisfies ClaimableAddOn;
        })
        .filter((row): row is ClaimableAddOn => row !== null);

    return {
        claimed,
        totalClaimedQty: claimed.reduce((sum, row) => sum + row.remainingQty, 0),
    };
}
