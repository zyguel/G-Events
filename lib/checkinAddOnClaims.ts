import type { SupabaseClient } from '@supabase/supabase-js';

export type ClaimableAddOn = {
    entitlementId: number;
    variantId: number;
    addOnName: string;
    variantLabel: string;
    remainingQty: number;
};

export type AddOnClaimSummary = {
    totalAddOnQty: number;
    claimableAddOnQty: number;
    addOnClaimStatus: 'None' | 'Unclaimed' | 'Claimed';
    claimableAddOns: ClaimableAddOn[];
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

type RegistrationScopeRow = {
    id: number;
    event_id: number | null;
    ticket_id: number | null;
    status: string | null;
};

type AddOnScopeRow = {
    id: number;
    event_id: number | null;
    name: string | null;
    AddOnVariant?: Array<{ id: number | null; label: string | null }> | null;
    AddOnTicket?: Array<{ ticket_id: number | null }> | null;
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

async function ensureMissingAddOnEntitlements(
    admin: SupabaseClient,
    registrationIds: number[],
    existingEntitlements: EntitlementRow[]
): Promise<EntitlementRow[]> {
    if (registrationIds.length === 0) return [];

    const { data: registrationRows, error: registrationError } = await admin
        .from('Registration')
        .select('id, event_id, ticket_id, status')
        .in('id', registrationIds);

    if (registrationError) {
        throw new Error(registrationError.message);
    }

    const registrations = ((registrationRows as RegistrationScopeRow[] | null) || []).filter((row) => {
        const id = Number(row.id);
        const eventId = Number(row.event_id);
        const status = String(row.status || '').toLowerCase();
        return (
            Number.isInteger(id) &&
            id > 0 &&
            Number.isInteger(eventId) &&
            eventId > 0 &&
            status === 'confirmed'
        );
    });

    if (registrations.length === 0) return [];

    const eventIds = Array.from(
        new Set(registrations.map((row) => Number(row.event_id)).filter((id) => Number.isInteger(id) && id > 0))
    );
    if (eventIds.length === 0) return [];

    const { data: addOnRows, error: addOnError } = await admin
        .from('AddOn')
        .select('id, event_id, name, AddOnVariant(id, label), AddOnTicket(ticket_id)')
        .in('event_id', eventIds);

    if (addOnError) {
        throw new Error(addOnError.message);
    }

    const addOnsByEvent = new Map<number, AddOnScopeRow[]>();
    for (const rawAddOn of (addOnRows as AddOnScopeRow[] | null) || []) {
        const eventId = Number(rawAddOn.event_id);
        if (!Number.isInteger(eventId) || eventId <= 0) continue;
        const current = addOnsByEvent.get(eventId) || [];
        current.push(rawAddOn);
        addOnsByEvent.set(eventId, current);
    }

    if (addOnsByEvent.size === 0) return [];

    const existingPairSet = new Set<string>();
    for (const row of existingEntitlements) {
        const registrationId = Number(row.registration_id);
        const variantId = Number(row.add_on_variant_id);
        if (!Number.isInteger(registrationId) || !Number.isInteger(variantId)) continue;
        existingPairSet.add(`${registrationId}:${variantId}`);
    }

    const missingRows: Array<{
        registration_id: number;
        add_on_variant_id: number;
        qty_total: number;
        qty_reserved: number;
        qty_redeemed: number;
    }> = [];
    const eligiblePairSet = new Set<string>();

    for (const registration of registrations) {
        const registrationId = Number(registration.id);
        const eventId = Number(registration.event_id);
        const ticketId = Number(registration.ticket_id);
        const addOns = addOnsByEvent.get(eventId) || [];

        for (const addOn of addOns) {
            const scopedTickets = ((addOn.AddOnTicket || []) as Array<{ ticket_id: number | null }>)
                .map((row) => Number(row.ticket_id))
                .filter((id) => Number.isInteger(id) && id > 0);
            const appliesToAllTickets = scopedTickets.length === 0;
            const appliesToRegistrationTicket = Number.isInteger(ticketId) && scopedTickets.includes(ticketId);
            if (!appliesToAllTickets && !appliesToRegistrationTicket) {
                continue;
            }

            for (const variant of (addOn.AddOnVariant || []) as Array<{ id: number | null; label: string | null }>) {
                const variantId = Number(variant.id);
                if (!Number.isInteger(variantId) || variantId <= 0) continue;

                const key = `${registrationId}:${variantId}`;
                eligiblePairSet.add(key);

                if (existingPairSet.has(key)) continue;
                existingPairSet.add(key);

                missingRows.push({
                    registration_id: registrationId,
                    add_on_variant_id: variantId,
                    qty_total: 1,
                    qty_reserved: 1,
                    qty_redeemed: 0,
                });
            }
        }
    }

    // Aggressive scope reconciliation:
    // If an entitlement no longer matches current AddOnTicket scope, remove it (if unredeemed)
    // or neutralize remaining claimable qty (if partially/fully redeemed) so check-in never
    // shows stale "to claim" rows after add-on reassignment.
    const staleEntitlementIdsToDelete: number[] = [];
    const staleEntitlementIdsToNeutralize: number[] = [];
    for (const entitlement of existingEntitlements) {
        const entitlementId = Number(entitlement.id);
        const registrationId = Number(entitlement.registration_id);
        const variantId = Number(entitlement.add_on_variant_id);
        if (!Number.isInteger(entitlementId) || !Number.isInteger(registrationId) || !Number.isInteger(variantId)) {
            continue;
        }

        const key = `${registrationId}:${variantId}`;
        if (eligiblePairSet.has(key)) continue;

        const redeemedQty = toSafeNumber(entitlement.qty_redeemed);
        if (redeemedQty <= 0) {
            staleEntitlementIdsToDelete.push(entitlementId);
        } else {
            staleEntitlementIdsToNeutralize.push(entitlementId);
        }
    }

    if (staleEntitlementIdsToDelete.length > 0) {
        const { error: staleDeleteError } = await admin
            .from('AttendeeEntitlement')
            .delete()
            .in('id', staleEntitlementIdsToDelete);
        if (staleDeleteError) {
            throw new Error(staleDeleteError.message);
        }
    }

    if (staleEntitlementIdsToNeutralize.length > 0) {
        // qty_total == qty_redeemed ensures no remaining claimable quantity.
        // qty_reserved is reset to 0 because this entitlement is no longer eligible.
        const { data: neutralizeRows, error: neutralizeReadError } = await admin
            .from('AttendeeEntitlement')
            .select('id, qty_redeemed')
            .in('id', staleEntitlementIdsToNeutralize);
        if (neutralizeReadError) {
            throw new Error(neutralizeReadError.message);
        }

        for (const row of neutralizeRows || []) {
            const rowId = Number((row as { id?: unknown }).id);
            const redeemedQty = toSafeNumber((row as { qty_redeemed?: unknown }).qty_redeemed);
            if (!Number.isInteger(rowId) || rowId <= 0) continue;

            const { error: neutralizeUpdateError } = await admin
                .from('AttendeeEntitlement')
                .update({
                    qty_total: redeemedQty,
                    qty_reserved: 0,
                })
                .eq('id', rowId);
            if (neutralizeUpdateError) {
                throw new Error(neutralizeUpdateError.message);
            }
        }
    }

    if (missingRows.length === 0) return [];

    const { data: insertedRows, error: insertError } = await admin
        .from('AttendeeEntitlement')
        .insert(missingRows)
        .select('id, registration_id, add_on_variant_id, qty_total, qty_reserved, qty_redeemed, AddOnVariant(id, label, AddOn(name))');

    if (insertError) {
        throw new Error(insertError.message);
    }

    return (insertedRows as EntitlementRow[] | null) || [];
}

export async function getClaimableAddOnsByRegistrationIds(
    admin: SupabaseClient,
    registrationIds: number[]
): Promise<Map<number, ClaimableAddOn[]>> {
    const map = new Map<number, ClaimableAddOn[]>();
    const summaries = await getAddOnClaimSummariesByRegistrationIds(admin, registrationIds);
    for (const [registrationId, summary] of summaries.entries()) {
        map.set(registrationId, summary.claimableAddOns);
    }
    return map;
}

export async function getAddOnClaimSummariesByRegistrationIds(
    admin: SupabaseClient,
    registrationIds: number[]
): Promise<Map<number, AddOnClaimSummary>> {
    const map = new Map<number, AddOnClaimSummary>();
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

    const fetchedEntitlements = (data as EntitlementRow[] | null) || [];
    const insertedEntitlements = await ensureMissingAddOnEntitlements(admin, uniqueIds, fetchedEntitlements);
    const entitlementRows = fetchedEntitlements.concat(insertedEntitlements);

    for (const rawRow of entitlementRows) {
        const registrationId = Number(rawRow.registration_id);
        if (!Number.isInteger(registrationId)) continue;

        const current = map.get(registrationId) || {
            totalAddOnQty: 0,
            claimableAddOnQty: 0,
            addOnClaimStatus: 'None' as const,
            claimableAddOns: [],
        };

        current.totalAddOnQty += toSafeNumber(rawRow.qty_total);

        const claimable = mapClaimableEntitlement(rawRow);
        if (claimable) {
            current.claimableAddOns.push(claimable);
            current.claimableAddOnQty += toSafeNumber(claimable.remainingQty);
        }

        map.set(registrationId, current);
    }

    for (const [registrationId, summary] of map.entries()) {
        const status: AddOnClaimSummary['addOnClaimStatus'] =
            summary.totalAddOnQty <= 0
                ? 'None'
                : summary.claimableAddOnQty > 0
                    ? 'Unclaimed'
                    : 'Claimed';
        map.set(registrationId, {
            ...summary,
            addOnClaimStatus: status,
        });
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
    return claimAddOnsForRegistration(admin, eventId, registrationId, options);
}

export async function claimAddOnVariantForRegistration(
    admin: SupabaseClient,
    eventId: number,
    registrationId: number,
    variantId: number,
    options?: { station?: string; scannedBy?: string }
): Promise<{ claimed: ClaimableAddOn[]; totalClaimedQty: number }> {
    return claimAddOnsForRegistration(admin, eventId, registrationId, {
        ...options,
        variantId,
    });
}

async function claimAddOnsForRegistration(
    admin: SupabaseClient,
    eventId: number,
    registrationId: number,
    options?: { station?: string; scannedBy?: string; variantId?: number }
): Promise<{ claimed: ClaimableAddOn[]; totalClaimedQty: number }> {
    const { data, error } = await admin.rpc('claim_registration_addons_atomic', {
        p_event_id: eventId,
        p_registration_id: registrationId,
        p_station: options?.station || 'checkin',
        p_scanned_by: options?.scannedBy || null,
        p_add_on_variant_id: Number.isInteger(options?.variantId) ? options?.variantId : null,
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
