'use server'

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { OrderFormData, OrderFormEntry } from "@/lib/types"

export interface SaveOrderFormEntryState {
    success?: boolean
    error?: string
    message?: string
    entryId?: number
}

/**
 * Save order form entry to database
 * @param eventId - The event ID
 * @param orderFormId - The order form ID
 * @param formData - The form data with answers
 * @param userEmail - Optional email of the user submitting
 * @param registrationId - Optional registration ID if linked to a registration
 */
export async function saveOrderFormEntry(
    eventId: number,
    orderFormId: number,
    formData: OrderFormData,
    userEmail?: string,
    registrationId?: number
): Promise<SaveOrderFormEntryState> {
    try {
        const { data, error } = await supabase
            .from('OrderFormEntries')
            .insert([
                {
                    event_id: eventId,
                    order_form_id: orderFormId,
                    user_email: userEmail,
                    registration_id: registrationId || null,
                    form_data: formData,
                    submitted_at: new Date().toISOString()
                }
            ])
            .select()
            .single()

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, success: false }
        }

        revalidatePath(`/events/${eventId}/orders`)

        return {
            success: true,
            message: 'Form submitted successfully',
            entryId: data.id
        }
    } catch (e) {
        console.error('Error saving form entry:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            success: false
        }
    }
}

/**
 * Get all order form entries for an event
 */
export async function getOrderFormEntriesByEvent(eventId: number) {
    try {
        const { data, error } = await supabase
            .from('OrderFormEntries')
            .select('*')
            .eq('event_id', eventId)
            .order('submitted_at', { ascending: false })

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, data: null }
        }

        return { success: true, data }
    } catch (e) {
        console.error('Error fetching form entries:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            data: null
        }
    }
}

/**
 * Get order form entries for a specific order form
 */
export async function getOrderFormEntriesByForm(orderFormId: number) {
    try {
        const { data, error } = await supabase
            .from('OrderFormEntries')
            .select('*')
            .eq('order_form_id', orderFormId)
            .order('submitted_at', { ascending: false })

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, data: null }
        }

        return { success: true, data }
    } catch (e) {
        console.error('Error fetching form entries:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            data: null
        }
    }
}

/**
 * Get a single order form entry
 */
export async function getOrderFormEntry(entryId: number) {
    try {
        const { data, error } = await supabase
            .from('OrderFormEntries')
            .select('*')
            .eq('id', entryId)
            .single()

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, data: null }
        }

        return { success: true, data }
    } catch (e) {
        console.error('Error fetching form entry:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            data: null
        }
    }
}

/**
 * Delete an order form entry
 */
export async function deleteOrderFormEntry(entryId: number, eventId: number) {
    try {
        const { error } = await supabase
            .from('OrderFormEntries')
            .delete()
            .eq('id', entryId)

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, success: false }
        }

        revalidatePath(`/events/${eventId}/orders`)

        return {
            success: true,
            message: 'Form entry deleted successfully'
        }
    } catch (e) {
        console.error('Error deleting form entry:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            success: false
        }
    }
}

/**
 * Export order form entries as CSV
 */
export async function generateOrderFormEntriesCSV(orderFormId: number) {
    try {
        const { data, error } = await supabase
            .from('OrderFormEntries')
            .select('*')
            .eq('order_form_id', orderFormId)
            .order('submitted_at', { ascending: false })

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, csv: null }
        }

        if (!data || data.length === 0) {
            return { error: 'No entries found', csv: null }
        }

        // Extract all field identifiers from form data
        const fieldIdentifiers = new Set<string>()
        data.forEach(entry => {
            if (entry.form_data?.sections) {
                entry.form_data.sections.forEach((section: any) => {
                    section.inputs?.forEach((input: any) => {
                        fieldIdentifiers.add(input.fieldIdentifier)
                    })
                })
            }
        })

        // Create CSV header
        const headers = ['Submitted At', 'Email', ...Array.from(fieldIdentifiers)]
        const csvContent = [
            headers.join(','),
            ...data.map(entry => {
                const row = [
                    new Date(entry.submitted_at).toISOString(),
                    entry.user_email || ''
                ]

                fieldIdentifiers.forEach(fieldId => {
                    let value = ''
                    if (entry.form_data?.sections) {
                        entry.form_data.sections.forEach((section: any) => {
                            section.inputs?.forEach((input: any) => {
                                if (input.fieldIdentifier === fieldId) {
                                    if (Array.isArray(input.answer)) {
                                        value = input.answer.join('; ')
                                    } else {
                                        value = String(input.answer || '')
                                    }
                                }
                            })
                        })
                    }
                    row.push(`"${value.replace(/"/g, '""')}"`)
                })

                return row.join(',')
            })
        ].join('\n')

        return { success: true, csv: csvContent }
    } catch (e) {
        console.error('Error generating CSV:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            csv: null
        }
    }
}
