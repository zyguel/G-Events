"use server";

import { cookies } from "next/headers";
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from "@/lib/constants";
import { getCurrentUserActiveOrganization, parseOrganizationId } from "@/lib/auth/sessionRole";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import {
    DEFAULT_ORDER_CONFIRMATION_DATA,
    normalizeOrderConfirmationData,
    type OrderConfirmationData,
} from "@/lib/orderConfirmationSettings";

async function getAuthorizedOrderConfirmationClient(eventId: number) {
    if (!Number.isInteger(eventId) || eventId <= 0) {
        throw new Error("Invalid event id");
    }

    const authSupabase = await createClient();
    const {
        data: { user },
    } = await authSupabase.auth.getUser();

    if (!user?.email) {
        throw new Error("Not authenticated");
    }

    const cookieStore = await cookies();
    const preferredOrganizationId = parseOrganizationId(
        cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
    );
    const orgContext = await getCurrentUserActiveOrganization(preferredOrganizationId);

    if (!orgContext.activeOrganizationId) {
        throw new Error("No active organization selected");
    }

    const adminSupabase = await createAdminClient();
    const { data: eventRow, error: eventError } = await adminSupabase
        .from("Event")
        .select("id")
        .eq("id", eventId)
        .eq("organization_id", orgContext.activeOrganizationId)
        .maybeSingle();

    if (eventError) {
        throw new Error(eventError.message);
    }

    if (!eventRow) {
        throw new Error("Event not found or access denied");
    }

    return adminSupabase;
}

/**
 * Fetch the order confirmation settings for a specific event
 */
export async function getOrderConfirmationSettings(eventId: number): Promise<OrderConfirmationData> {
    try {
        const supabase = await getAuthorizedOrderConfirmationClient(eventId);
        const { data, error } = await supabase
            .from('OrderConfirmationSettings')
            .select('settings')
            .eq('event_id', eventId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned: use defaults.
                return { ...DEFAULT_ORDER_CONFIRMATION_DATA };
            }
            throw error;
        }

        return normalizeOrderConfirmationData(data?.settings);
    } catch (error) {
        console.error("Failed to fetch order confirmation settings:", error);
        return { ...DEFAULT_ORDER_CONFIRMATION_DATA };
    }
}

/**
 * Create or update the order confirmation settings for a specific event
 */
export async function saveOrderConfirmationSettings(eventId: number, settings: OrderConfirmationData): Promise<boolean> {
    try {
        // Use an upsert since event_id is unique. This updates the existing row or inserts a new one.
        const supabase = await getAuthorizedOrderConfirmationClient(eventId);
        const normalizedSettings = normalizeOrderConfirmationData(settings);

        const { error } = await supabase
            .from('OrderConfirmationSettings')
            .upsert({
                event_id: eventId,
                settings: normalizedSettings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'event_id' });

        if (error) {
            console.error("Supabase error saving order confirmation settings:", error);
            throw new Error(error.message);
        }

        return true;
    } catch (error) {
        console.error("Failed to save order confirmation settings:", error);
        throw error;
    }
}
