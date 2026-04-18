"use server";

import { cookies } from "next/headers";
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from "@/lib/constants";
import { getUserActiveOrganizationByEmail, parseOrganizationId } from "@/lib/auth/sessionRole";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import {
    DEFAULT_ORDER_CONFIRMATION_DATA,
    normalizeOrderConfirmationData,
    type OrderConfirmationData,
} from "@/lib/orderConfirmationSettings";

const ORDER_CONFIRMATION_AUTHORIZATION_TTL_MS = 60 * 1000;
const ORDER_CONFIRMATION_SETTINGS_TTL_MS = 45 * 1000;

type AuthorizationCacheEntry = {
    expiresAt: number;
};

type SettingsCacheEntry = {
    value: OrderConfirmationData;
    expiresAt: number;
};

const authorizationCache = new Map<string, AuthorizationCacheEntry>();
const settingsCache = new Map<string, SettingsCacheEntry>();

function getAuthorizationCacheKey(email: string, organizationId: number, eventId: number): string {
    return `${email}:${organizationId}:${eventId}`;
}

function getSettingsCacheKey(organizationId: number, eventId: number): string {
    return `${organizationId}:${eventId}`;
}

function readCachedSettings(cacheKey: string): OrderConfirmationData | null {
    const cached = settingsCache.get(cacheKey);
    if (!cached) {
        return null;
    }

    if (cached.expiresAt <= Date.now()) {
        settingsCache.delete(cacheKey);
        return null;
    }

    return normalizeOrderConfirmationData(cached.value);
}

function writeCachedSettings(cacheKey: string, settings: OrderConfirmationData): void {
    settingsCache.set(cacheKey, {
        value: normalizeOrderConfirmationData(settings),
        expiresAt: Date.now() + ORDER_CONFIRMATION_SETTINGS_TTL_MS,
    });
}

async function getAuthorizedOrderConfirmationClient(eventId: number) {
    if (!Number.isInteger(eventId) || eventId <= 0) {
        throw new Error("Invalid event id");
    }

    const authSupabase = await createClient();
    const {
        data: { user },
    } = await authSupabase.auth.getUser();

    const authenticatedEmail = user?.email?.trim().toLowerCase() ?? "";
    if (!authenticatedEmail) {
        throw new Error("Not authenticated");
    }

    const cookieStore = await cookies();
    const preferredOrganizationId = parseOrganizationId(
        cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
    );
    const orgContext = await getUserActiveOrganizationByEmail(authenticatedEmail, preferredOrganizationId);

    if (!orgContext.activeOrganizationId) {
        throw new Error("No active organization selected");
    }

    const activeOrganizationId = orgContext.activeOrganizationId;
    const authorizationCacheKey = getAuthorizationCacheKey(
        authenticatedEmail,
        activeOrganizationId,
        eventId
    );

    const cachedAuthorization = authorizationCache.get(authorizationCacheKey);
    if (cachedAuthorization && cachedAuthorization.expiresAt > Date.now()) {
        return {
            supabase: await createAdminClient(),
            activeOrganizationId,
            settingsCacheKey: getSettingsCacheKey(activeOrganizationId, eventId),
        };
    }

    const adminSupabase = await createAdminClient();
    const { data: eventRow, error: eventError } = await adminSupabase
        .from("Event")
        .select("id")
        .eq("id", eventId)
        .eq("organization_id", activeOrganizationId)
        .maybeSingle();

    if (eventError) {
        throw new Error(eventError.message);
    }

    if (!eventRow) {
        throw new Error("Event not found or access denied");
    }

    authorizationCache.set(authorizationCacheKey, {
        expiresAt: Date.now() + ORDER_CONFIRMATION_AUTHORIZATION_TTL_MS,
    });

    return {
        supabase: adminSupabase,
        activeOrganizationId,
        settingsCacheKey: getSettingsCacheKey(activeOrganizationId, eventId),
    };
}

/**
 * Fetch the order confirmation settings for a specific event
 */
export async function getOrderConfirmationSettings(eventId: number): Promise<OrderConfirmationData> {
    try {
        const { supabase, settingsCacheKey } = await getAuthorizedOrderConfirmationClient(eventId);

        const cached = readCachedSettings(settingsCacheKey);
        if (cached) {
            return cached;
        }

        const { data, error } = await supabase
            .from('OrderConfirmationSettings')
            .select('settings')
            .eq('event_id', eventId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        const normalized = normalizeOrderConfirmationData(data?.settings);
        writeCachedSettings(settingsCacheKey, normalized);
        return normalized;
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
        const { supabase, settingsCacheKey } = await getAuthorizedOrderConfirmationClient(eventId);
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

        writeCachedSettings(settingsCacheKey, normalizedSettings);

        return true;
    } catch (error) {
        console.error("Failed to save order confirmation settings:", error);
        throw error;
    }
}
