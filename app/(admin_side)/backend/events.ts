'use server'

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface CreateEventState {
    success?: boolean
    error?: string
    message?: string
    eventId?: number
}

// Helper for uploading
async function uploadFileToStorage(file: File, bucket: string = 'events') {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

    return publicUrl
}

export async function createEvent(prevState: CreateEventState, formData: FormData): Promise<CreateEventState> {
    let bannerUrl = null;

    // Handle Banner Upload
    const bannerFile = formData.get('bannerFile') as File;
    if (bannerFile && bannerFile.size > 0) {
        try {
            console.log('Uploading banner for new event...');
            bannerUrl = await uploadFileToStorage(bannerFile);
        } catch (e) {
            console.error('Failed to upload banner during create:', e);
            // We continue creating the event even if banner fails, or we could return error.
            // Let's continue but log it.
        }
    }

    const rawData = {
        title: formData.get('name') as string, // Schema uses 'title' not 'name'
        description: formData.get('description') as string,
        organization_id: 1, // Placeholder
        event_start_at: formData.get('date') ? new Date(`${formData.get('date')}T${formData.get('startTime') || '00:00'}:00`).toISOString() : null,
        event_end_at: formData.get('date') ? new Date(`${formData.get('date')}T${formData.get('endTime') || '23:59'}:00`).toISOString() : null,
        location: formData.get('location') as string,
        banner_image: bannerUrl, // Add banner URL
        // Default values for required fields
        capacity: 100, // Default capacity
        is_published: false, // Default to draft
        is_visible: true,
        allow_group_registration: true,
        allow_waitlist: true,
        allow_breakout_sessions: false,
        objectives: formData.get('objectives') ? JSON.parse(formData.get('objectives') as string) : [],
        theme: formData.get('theme') as string,
    }

    try {
        console.log('Inserting Event:', rawData)
        const { data: eventData, error: eventError } = await supabase
            .from('Event')
            .insert([rawData])
            .select()
            .single()

        if (eventError) {
            console.error('Supabase Event Error:', eventError)
            return { error: eventError.message, success: false }
        }

        const eventId = eventData.id

        // Serialize agenda and objectives
        // Handle Agenda Items
        const agendaJson = formData.get('agenda') as string
        if (agendaJson) {
            try {
                const agendaItems = JSON.parse(agendaJson)
                if (Array.isArray(agendaItems) && agendaItems.length > 0) {
                    const agendaPayload = agendaItems.map((item: any, index: number) => ({
                        event_id: eventId,
                        title: item.title,
                        description: item.description,
                        speaker_name: item.speaker,
                        start_time: item.startTime ? new Date(`${formData.get('date')}T${item.startTime}:00`).toISOString() : null,
                        end_time: item.endTime ? new Date(`${formData.get('date')}T${item.endTime}:00`).toISOString() : null,
                        order: index
                    }))

                    const { error: agendaError } = await supabase
                        .from('AgendaSlot')
                        .insert(agendaPayload)

                    if (agendaError) {
                        console.error('Agenda Insert Error:', agendaError)
                    }
                }
            } catch (e) {
                console.error('Error parsing agenda:', e)
            }
        }

        revalidatePath('/events')
        return { success: true, message: 'Event created successfully', eventId }

    } catch (e) {
        console.error('Unexpected Error:', e)
        return { error: 'Failed to create event', success: false }
    }
}

export async function getEvents() {
    try {
        const { data, error } = await supabase
            .from('Event')
            .select(`
                id,
                title,
                location,
                event_start_at,
                event_end_at,
                is_published,
                capacity,
                banner_image,
                objectives,
                theme
            `)
            .order('event_start_at', { ascending: false })

        if (error) {
            console.error('Error fetching events:', error)
            return []
        }

        // Map to frontend friendly format if needed, or return raw
        // For now returning raw, frontend will handle mapping
        return data || []
    } catch (e) {
        console.error('Unexpected error fetching events:', e)
        return []
    }
}

export async function getEventById(id: number) {
    console.log('SERVER ACTION: getEventById called with ID:', id);
    try {
        const query = supabase
            .from('Event')
            .select(`
                *,
                objectives,
                theme,
                AgendaSlot (
                    id,
                    title,
                    description,
                    speaker_name,
                    start_time,
                    end_time,
                    order
                )
            `)
            .eq('id', id)
            .single();

        const { data, error } = await query;

        if (error) {
            console.error('SERVER ACTION: Error fetching event by ID:', error);
            // Fallback: try fetching without the join in case that's the issue
            if (error.code === 'PGRST200') { // excessive/ambiguous? No, likely column or relation
                console.log('SERVER ACTION: Retrying without AgendaSlot...');
                const retry = await supabase.from('Event').select('*, objectives, theme').eq('id', id).single();
                return retry.data;
            }
            return null;
        }

        console.log('SERVER ACTION: Success, found event:', data?.title);
        return data
    } catch (e) {
        console.error('SERVER ACTION: Unexpected error fetching event:', e)
        return null
    }
}

export async function updateEvent(id: number, data: Partial<any>) {
    try {
        const { error } = await supabase
            .from('Event')
            .update(data)
            .eq('id', id)

        if (error) {
            console.error('Error updating event:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/events')
        revalidatePath(`/events/${id}`)
        return { success: true }
    } catch (e) {
        console.error('Unexpected error updating event:', e)
        return { success: false, error: 'Failed to update event' }
    }
}

export async function uploadEventBanner(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) {
            return { success: false, error: 'No file provided' }
        }

        const publicUrl = await uploadFileToStorage(file)
        return { success: true, url: publicUrl }
    } catch (e: any) {
        console.error('Unexpected error uploading banner:', e)
        return { success: false, error: e.message || 'Failed to upload banner' }
    }
}

export async function saveAgendaSlot(event_id: number, slot: { id?: string, title: string, description?: string, speaker?: string, startTime: string, endTime: string }) {
    try {
        const payload: any = {
            event_id,
            title: slot.title,
            description: slot.description,
            speaker_name: slot.speaker,
        };

        // Fetch event date to construct timestamp
        const { data: event } = await supabase.from('Event').select('event_start_at').eq('id', event_id).single();

        if (!event) throw new Error("Event not found");

        // Use event date or fallback to today if not set (to allow saving in drafts)
        const eventDate = event.event_start_at
            ? new Date(event.event_start_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        payload.start_time = slot.startTime ? new Date(`${eventDate}T${slot.startTime}:00`).toISOString() : null;
        payload.end_time = slot.endTime ? new Date(`${eventDate}T${slot.endTime}:00`).toISOString() : null;

        const slotIdStr = slot.id ? slot.id.toString() : '';
        let error;
        if (slotIdStr && !slotIdStr.startsWith('new-') && !isNaN(parseInt(slotIdStr))) {
            // Update
            const { error: updateError } = await supabase
                .from('AgendaSlot')
                .update(payload)
                .eq('id', parseInt(slotIdStr));
            error = updateError;
        } else {
            // Insert - Need to calculate order
            // Get current count/max order
            const { count } = await supabase
                .from('AgendaSlot')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event_id);

            payload.order = count || 0;

            const { error: insertError } = await supabase
                .from('AgendaSlot')
                .insert([payload]);
            error = insertError;
        }

        if (error) throw error;

        revalidatePath(`/events/${event_id}`);
        return { success: true };
    } catch (e: any) {
        console.error('Error saving agenda slot:', e);
        return { success: false, error: e.message };
    }
}

export async function deleteAgendaSlot(id: string) {
    try {
        if (!id || isNaN(parseInt(id))) return { success: true }; // Local only item

        const { error } = await supabase
            .from('AgendaSlot')
            .delete()
            .eq('id', parseInt(id));

        if (error) throw error;

        return { success: true };
    } catch (e: any) {
        console.error('Error deleting agenda slot:', e);
        return { success: false, error: e.message };
    }
}
