"use server";

import { supabase } from "@/lib/supabase";

export interface EmailTemplate {
    subject: string;
    body: string;
}

export interface OrderConfirmationData {
    submissionMessage: string;
    submissionEmail: EmailTemplate;
    confirmationEmail: EmailTemplate;
    rejectionEmail: EmailTemplate;
}

/**
 * Fetch the order confirmation settings for a specific event
 */
export async function getOrderConfirmationSettings(eventId: number): Promise<OrderConfirmationData | null> {
    try {


        const { data, error } = await supabase
            .from('OrderConfirmationSettings')
            .select('settings')
            .eq('event_id', eventId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null;
            }
            throw error;
        }

        return data?.settings as OrderConfirmationData;
    } catch (error) {
        console.error("Failed to fetch order confirmation settings:", error);
        return null; // Return null instead of throwing to avoid breaking the UI
    }
}

/**
 * Create or update the order confirmation settings for a specific event
 */
export async function saveOrderConfirmationSettings(eventId: number, settings: OrderConfirmationData): Promise<boolean> {
    try {


        // Use an upsert since event_id is unique. This updates the existing row or inserts a new one.
        const { error } = await supabase
            .from('OrderConfirmationSettings')
            .upsert({
                event_id: eventId,
                settings: settings,
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
