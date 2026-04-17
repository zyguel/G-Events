"use server";

import { createClient } from "@/lib/supabase-server";
import {
    DEFAULT_ORDER_CONFIRMATION_DATA,
    normalizeOrderConfirmationData,
    type OrderConfirmationData,
    type OrderConfirmationEmailTemplate,
} from "@/lib/orderConfirmationSettings";

export type EmailTemplate = OrderConfirmationEmailTemplate;

export type { OrderConfirmationData };

/**
 * Fetch the order confirmation settings for a specific event
 */
export async function getOrderConfirmationSettings(eventId: number): Promise<OrderConfirmationData> {
    try {
        const supabase = await createClient();
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
        const supabase = await createClient();
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
