'use server'

import { createClient, createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { OrderFormData, OrderFormEntry } from "@/lib/types"
import { logAuditEntry } from '@/lib/actions/audit'

interface OrderFormSectionInput {
    fieldIdentifier?: string
    answer?: string | number | boolean | string[] | null
}

interface OrderFormSection {
    inputs?: OrderFormSectionInput[]
}

interface OrderFormEntryRow {
    form_data?: { sections?: OrderFormSection[] }
    submitted_at: string
    user_email?: string
}

export interface SaveOrderFormEntryState {
    success?: boolean
    error?: string
    message?: string
    entryId?: number
}

export interface SaveOrderFormState {
    success?: boolean
    error?: string
    message?: string
    formId?: number
}

/**
 * Save/Update order form configuration (structure with sections and fields)
 * @param eventId - The event ID
 * @param title - Form title
 * @param description - Form description
 * @param formData - The complete form structure (sections, inputs, options)
 * @param formId - Optional: if updating existing form
 */
export async function saveOrderForm(
    eventId: number,
    title: string,
    description: string,
    formData: OrderFormData,
    formId?: number
): Promise<SaveOrderFormState> {
    const supabase = await createClient();

    try {
        if (formId) {
            // Update existing form
            const { data: beforeData } = await supabase
                .from('OrderForm')
                .select('*')
                .eq('id', formId)
                .single()

            const { data, error } = await supabase
                .from('OrderForm')
                .update({
                    title,
                    description,
                    form_data: formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', formId)
                .select()
                .single()

            if (error) {
                console.error('Supabase Error:', error)
                return { error: error.message, success: false }
            }

            try {
                await logAuditEntry('OrderForm', formId, 'update', {
                    before: beforeData || null,
                    after: data
                })
            } catch (e) {
                console.warn('OrderForm audit log failed (update):', e)
            }

            revalidatePath(`/events/${eventId}/orderform`)

            return {
                success: true,
                message: 'Form updated successfully',
                formId: data.id
            }
        } else {
            // Create new form
            const { data, error } = await supabase
                .from('OrderForm')
                .insert([
                    {
                        event_id: eventId,
                        title,
                        description,
                        form_data: formData
                    }
                ])
                .select()
                .single()

            if (error) {
                console.error('Supabase Error:', error)
                return { error: error.message, success: false }
            }

            revalidatePath(`/events/${eventId}/orderform`)

            try {
                await logAuditEntry('OrderForm', data.id, 'create', {
                    before: null,
                    after: data
                })
            } catch (e) {
                console.warn('OrderForm audit log failed (create):', e)
            }

            revalidatePath(`/events/${eventId}/orderform`)

            return {
                success: true,
                message: 'Form created successfully',
                formId: data.id
            }
        }
    } catch (e) {
        console.error('Error saving form:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            success: false
        }
    }
}

/**
 * Get order form by ID
 */
export async function getOrderFormById(formId: number) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('id', formId)
            .single()

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, data: null }
        }

        return { success: true, data }
    } catch (e) {
        console.error('Error fetching form:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            data: null
        }
    }
}

/**
 * Get all order forms for an event
 */
export async function getOrderFormsByEvent(eventId: number) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, data: null }
        }

        return { success: true, data }
    } catch (e) {
        console.error('Error fetching forms:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            data: null
        }
    }
}

/**
 * Delete order form
 */
export async function deleteOrderForm(formId: number, eventId: number) {
    const supabase = await createClient();

    try {
        const { data: beforeData, error: beforeError } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('id', formId)
            .single()

        if (beforeError) {
            console.error('Supabase Error:', beforeError)
            return { error: beforeError.message, success: false }
        }

        const { error } = await supabase
            .from('OrderForm')
            .delete()
            .eq('id', formId)

        if (error) {
            console.error('Supabase Error:', error)
            return { error: error.message, success: false }
        }

        try {
            await logAuditEntry('OrderForm', formId, 'delete', {
                before: beforeData || null,
                after: null
            })
        } catch (e) {
            console.warn('OrderForm audit log failed (delete):', e)
        }

        revalidatePath(`/events/${eventId}/orderform`)

        return {
            success: true,
            message: 'Form deleted successfully'
        }
    } catch (e) {
        console.error('Error deleting form:', e)
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            success: false
        }
    }
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
    const supabase = await createClient();

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

        try {
            await logAuditEntry('OrderFormEntry', data.id, 'create', {
                before: null,
                after: data
            })
        } catch (e) {
            console.warn('OrderFormEntry audit log failed:', e)
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

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Get all order forms for an event — uses service role to bypass RLS.
 * Safe for public/attendee-facing pages (read-only, form structure only).
 */
export async function getOrderFormsByEventPublic(eventId: number) {
    // Use the raw Supabase JS client to fully bypass Next.js SSR cookie interference
    // Add .trim() to prevent invisible newlines from breaking HTTP Authorization headers
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or Service Role Key for Admin Client');
        return { error: "Server Configuration Error", data: null };
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase
            .from('OrderForm')
            .select('*')
            .eq('event_id', eventId)
        if (error) {
            // Enhanced logging to catch hidden TypeError properties
            console.error('Supabase Error (public) Name:', (error as any).name);
            console.error('Supabase Error (public) Message:', (error as any).message);
            console.error('Supabase Error (public) Full:', error);
            
            return { error: (error as any).message || 'Unknown Supabase Error', data: null }
        }

        return { success: true, data }
    } catch (e: any) {
        console.error('Catch Error fetching forms (public):', e?.name, e?.message);
        return {
            error: e instanceof Error ? e.message : 'An unexpected error occurred',
            data: null
        }
    }
}
export async function getOrderFormEntriesByEvent(eventId: number) {
    const supabase = await createClient();

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
    const supabase = await createClient();

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
    const supabase = await createClient();

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
    const supabase = await createClient();

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
    const supabase = await createClient();

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
        data.forEach((entry: OrderFormEntryRow) => {
            const formData = entry.form_data
            if (formData?.sections) {
                formData.sections.forEach((section) => {
                    section.inputs?.forEach((input) => {
                        const id = input.fieldIdentifier
                        if (id) {
                            fieldIdentifiers.add(id)
                        }
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

                fieldIdentifiers.forEach((fieldId) => {
                    let value = ''
                    const sections = entry.form_data?.sections
                    if (sections) {
                        sections.forEach((section: OrderFormSection) => {
                            section.inputs?.forEach((input) => {
                                if (input.fieldIdentifier === fieldId) {
                                    if (Array.isArray(input.answer)) {
                                        value = input.answer.join('; ')
                                    } else {
                                        value = input.answer !== undefined && input.answer !== null ? String(input.answer) : ''
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
