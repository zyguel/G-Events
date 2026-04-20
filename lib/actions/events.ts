'use server'

import { createClient } from "@/lib/supabase-server"
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { revalidatePath } from "next/cache"
import { cookies } from 'next/headers'
import { logAuditEntry } from '@/lib/actions/audit'
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants'
import { sendEmail } from '@/lib/emailProvider'
import { buildEticketUrl, buildRegistrationConfirmationEmailHtml } from '@/lib/ticketEmail'
import { buildAndStoreTicketQrImage } from '@/lib/ticketQrStorage'
import { getPublicAppBaseUrl } from '@/lib/appBaseUrl'
import { buildEventSlug } from '@/lib/slug'
import { newTicketToken } from '@/lib/ticketToken'
import {
    getCurrentUserActiveOrganization,
    parseOrganizationId,
} from '@/lib/auth/sessionRole'

export interface CreateEventState {
    success?: boolean
    error?: string
    message?: string
    eventId?: number
}

function isDynamicServerUsageError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const maybeError = error as { digest?: string }
    return maybeError.digest === 'DYNAMIC_SERVER_USAGE'
}

async function getStorageClient(): Promise<SupabaseClient> {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }

    return await createClient()
}

async function ensureEventEditable(eventId: number) {
    const activeOrganizationId = await getActiveOrganizationIdOrThrow()
    const authSupabase = await createClient()
    const { data, error } = await authSupabase
        .from('Event')
        .select('id')
        .eq('id', eventId)
        .eq('organization_id', activeOrganizationId)
        .single()
    if (error || !data) {
        throw new Error('Event not found or access denied')
    }

    return true
}

async function getActiveOrganizationIdOrThrow() {
    const cookieStore = await cookies()
    const preferredOrganizationId = parseOrganizationId(cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value)
    const context = await getCurrentUserActiveOrganization(preferredOrganizationId)

    if (!context.isAuthenticated) {
        throw new Error('Not authenticated')
    }

    if (!context.activeOrganizationId) {
        throw new Error('No active organization selected')
    }

    return context.activeOrganizationId
}

// Helper for uploading
async function uploadFileToStorage(supabase: SupabaseClient, file: File, bucket: string = 'events') {
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

    const supabase = await createClient();

    // Handle Banner Upload
    const bannerFile = formData.get('bannerFile') as File;
    if (bannerFile && bannerFile.size > 0) {
        try {
            console.log('Uploading banner for new event...');
            const adminSupabase = await getStorageClient();
            bannerUrl = await uploadFileToStorage(adminSupabase, bannerFile);
        } catch (e) {
            console.error('Failed to upload banner during create:', e);
            // We continue creating the event even if banner fails, or we could return error.
            // Let's continue but log it.
        }
    }

    try {
        const activeOrganizationId = await getActiveOrganizationIdOrThrow();
        const rawData = {
            title: formData.get('name') as string, // Schema uses 'title' not 'name'
            description: formData.get('description') as string,
            organization_id: activeOrganizationId,
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

        try {
            await logAuditEntry('Event', eventId, 'create', {
                before: null,
                after: eventData
            })
        } catch (e) {
            console.warn('Event audit log failed (create):', e)
        }

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

        revalidatePath('/admin/events')
        return { success: true, message: 'Event created successfully', eventId }

    } catch (e) {
        console.error('Unexpected Error:', e)
        return { error: 'Failed to create event', success: false }
    }
}

const fetchEvents = cache(async (organizationId: number) => {
    const supabase = await createClient();
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
        .eq('organization_id', organizationId)
        .order('event_start_at', { ascending: false })

    if (error) {
        throw error
    }

    const events = data || []
    if (events.length === 0) {
        return []
    }

    const eventIds = events.map((event) => event.id)

    const aggregateClient = await getStorageClient()

    const [ticketRowsResult, registrationRowsResult] = await Promise.all([
        aggregateClient
            .from('Ticket')
            .select('event_id, available_quantity')
            .in('event_id', eventIds),
        aggregateClient
            .from('Registration')
            .select('event_id, status, has_checked_in')
            .in('event_id', eventIds),
    ])

    const totalTicketsByEventId = new Map<number, number>()
    if (!ticketRowsResult.error) {
        for (const row of ticketRowsResult.data || []) {
            const eventId = Number(row.event_id)
            if (Number.isNaN(eventId)) continue

            const ticketCapacity = Number(row.available_quantity) || 0
            totalTicketsByEventId.set(eventId, (totalTicketsByEventId.get(eventId) || 0) + ticketCapacity)
        }
    }

    const ticketsSoldByEventId = new Map<number, number>()
    const attendeesByEventId = new Map<number, number>()
    const pendingOrdersByEventId = new Map<number, number>()
    if (!registrationRowsResult.error) {
        for (const row of registrationRowsResult.data || []) {
            const eventId = Number(row.event_id)
            if (Number.isNaN(eventId)) continue

            const normalizedStatus = String(row.status || '').toLowerCase()
            if (normalizedStatus === 'pending') {
                pendingOrdersByEventId.set(eventId, (pendingOrdersByEventId.get(eventId) || 0) + 1)
            }
            if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
                continue
            }

            ticketsSoldByEventId.set(eventId, (ticketsSoldByEventId.get(eventId) || 0) + 1)
            if (row.has_checked_in) {
                attendeesByEventId.set(eventId, (attendeesByEventId.get(eventId) || 0) + 1)
            }
        }
    }

    return events.map((event) => ({
        ...event,
        tickets_sold_count: ticketsSoldByEventId.get(event.id) || 0,
        attendees_count: attendeesByEventId.get(event.id) || 0,
        total_tickets_count: totalTicketsByEventId.get(event.id) || 0,
        pending_orders_count: pendingOrdersByEventId.get(event.id) || 0,
    }))
})

export async function getEvents() {
    try {
        const activeOrganizationId = await getActiveOrganizationIdOrThrow()
        return await fetchEvents(activeOrganizationId)
    } catch (e) {
        if (isDynamicServerUsageError(e)) {
            throw e
        }
        console.error('Unexpected error fetching events:', e)
        return []
    }
}

/**
 * Fetch all published events for the client/attendee side.
 * This does NOT require organization membership ΓÇö any authenticated user can see published events.
 */
export async function getPublishedEvents() {
    try {
        const storageClient = await getStorageClient()
        const { data, error } = await storageClient
            .from('Event')
            .select(`
                id,
                title,
                location,
                event_start_at,
                event_end_at,
                is_published,
                is_visible,
                capacity,
                banner_image,
                objectives,
                theme,
                registration_open_at
            `)
            .eq('is_published', true)
            .eq('is_visible', true)
            .gte('event_end_at', new Date().toISOString())
            .order('event_start_at', { ascending: true })

        if (error) {
            console.error('Error fetching published events:', error)
            return []
        }

        return data || []
    } catch (e) {
        if (isDynamicServerUsageError(e)) {
            throw e
        }
        console.error('Unexpected error fetching published events:', e)
        return []
    }
}

/**
 * Fetch a specific published event for the client/attendee side by ID.
 * This does NOT require organization membership.
 */
export async function getPublishedEventById(id: number) {
    try {
        const storageClient = await getStorageClient()

        const { data, error } = await storageClient
            .from('Event')
            .select(`
                *,
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
            .eq('is_published', true)
            .eq('is_visible', true)
            .single()

        if (error) {
            console.error(`Error fetching published event ${id}:`, error)
            return null
        }

        return data
    } catch (e) {
        if (isDynamicServerUsageError(e)) {
            throw e
        }
        console.error(`Unexpected error fetching published event ${id}:`, e)
        return null
    }
}

/**
 * Fetch breakout sessions for a published event on the client/attendee side.
 * Does NOT require authentication.
 */
export async function getPublicBreakoutSessions(eventId: number) {
    try {
        const storageClient = await getStorageClient()

        const { data, error } = await storageClient
            .from('BreakoutSession')
            .select('id, name, description, room_name, room_capacity, speaker_name, BreakoutSessionRegistration(id)')
            .eq('event_id', eventId)
            .order('id', { ascending: true })

        if (error) {
            console.error(`Error fetching breakout sessions for event ${eventId}:`, error)
            return []
        }

        return (data || []).map((row: any) => {
            let meta: any = {}
            try {
                meta = row.description ? JSON.parse(row.description) : {}
            } catch { meta = {} }

            const currentAttendees = Array.isArray(row.BreakoutSessionRegistration)
                ? row.BreakoutSessionRegistration.length
                : 0

            const speakers: string[] = row.speaker_name
                ? String(row.speaker_name).split(',').map((n: string) => n.trim()).filter(Boolean)
                : []

            return {
                id: row.id.toString(),
                name: row.name || '',
                type: (meta.type === 'In-Person' ? 'In-Person' : 'Online') as 'Online' | 'In-Person',
                status: (['Ongoing', 'Completed', 'Cancelled'].includes(meta.status) ? meta.status : 'Not Started') as 'Not Started' | 'Ongoing' | 'Completed' | 'Cancelled',
                date: meta.date || '',
                time: meta.time || '',
                location: row.room_name || '',
                joinLink: meta.joinLink || '',
                currentAttendees,
                maxCapacity: row.room_capacity || 0,
                speakers,
            }
        })
    } catch (e) {
        if (isDynamicServerUsageError(e)) throw e
        console.error(`Unexpected error fetching breakout sessions for event ${eventId}:`, e)
        return []
    }
}

const fetchEventById = cache(async (id: number, organizationId: number) => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('Event')
        .select(`
            *,
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
        .eq('organization_id', organizationId)
        .single();

    if (error) {
        if (error.code === 'PGRST200') {
            const retry = await supabase
                .from('Event')
                .select('*')
                .eq('id', id)
                .eq('organization_id', organizationId)
                .single();
            return retry.data
        }
        return null
    }

    return data
})

export async function getEventById(id: number) {
    try {
        const activeOrganizationId = await getActiveOrganizationIdOrThrow()
        return await fetchEventById(id, activeOrganizationId)
    } catch (e) {
        if (isDynamicServerUsageError(e)) {
            throw e
        }
        console.error('Unexpected error fetching event:', e)
        return null
    }
}

function normalizeIsoDate(value: unknown): string | null {
    if (!value || typeof value !== 'string') return null
    const ms = Date.parse(value)
    if (!Number.isFinite(ms)) return null
    return new Date(ms).toISOString()
}

const RESCHEDULE_TICKET_BUFFER_DAYS = 5
const RESCHEDULE_TICKET_BUFFER_MS = RESCHEDULE_TICKET_BUFFER_DAYS * 24 * 60 * 60 * 1000

function toEpochMs(value: unknown): number | null {
    const iso = normalizeIsoDate(value)
    if (!iso) return null
    const ms = Date.parse(iso)
    return Number.isFinite(ms) ? ms : null
}

type TicketWindowRow = {
    id: number
    selling_start_at: string | null
    selling_end_at: string | null
}

async function adjustTicketWindowsForEarlierEventEnd(params: {
    supabase: SupabaseClient
    eventId: number
    beforeEventEndAt: unknown
    afterEventEndAt: unknown
}): Promise<{ adjustedTickets: number }> {
    const beforeEndMs = toEpochMs(params.beforeEventEndAt)
    const afterEndMs = toEpochMs(params.afterEventEndAt)

    if (beforeEndMs === null || afterEndMs === null || afterEndMs >= beforeEndMs) {
        return { adjustedTickets: 0 }
    }

    const { data: ticketRows, error: ticketError } = await params.supabase
        .from('Ticket')
        .select('id, selling_start_at, selling_end_at')
        .eq('event_id', params.eventId)

    if (ticketError) {
        throw new Error(`Failed to load tickets for reschedule adjustment: ${ticketError.message}`)
    }

    let adjustedTickets = 0
    const rows = (ticketRows || []) as TicketWindowRow[]

    for (const row of rows) {
        const currentStartMs = toEpochMs(row.selling_start_at)
        const currentEndMs = toEpochMs(row.selling_end_at)

        let nextStartMs = currentStartMs
        let nextEndMs = currentEndMs
        let changed = false

        const bothBeyondEarlierEnd =
            currentStartMs !== null
            && currentEndMs !== null
            && currentStartMs > afterEndMs
            && currentEndMs > afterEndMs

        if (bothBeyondEarlierEnd) {
            nextEndMs = afterEndMs
            nextStartMs = afterEndMs - RESCHEDULE_TICKET_BUFFER_MS
            changed = true
        } else {
            if (currentEndMs !== null && currentEndMs > afterEndMs) {
                nextEndMs = afterEndMs
                changed = true
            }

            if (currentStartMs !== null && currentStartMs > afterEndMs) {
                nextStartMs = afterEndMs - RESCHEDULE_TICKET_BUFFER_MS
                changed = true
            }
        }

        if (nextStartMs !== null && nextEndMs !== null && nextStartMs >= nextEndMs) {
            nextStartMs = nextEndMs - RESCHEDULE_TICKET_BUFFER_MS
            changed = true
        }

        if (!changed) {
            continue
        }

        const nextStartIso = nextStartMs !== null ? new Date(nextStartMs).toISOString() : null
        const nextEndIso = nextEndMs !== null ? new Date(nextEndMs).toISOString() : null

        const sameStart = normalizeIsoDate(row.selling_start_at) === normalizeIsoDate(nextStartIso)
        const sameEnd = normalizeIsoDate(row.selling_end_at) === normalizeIsoDate(nextEndIso)
        if (sameStart && sameEnd) {
            continue
        }

        const { error: updateTicketError } = await params.supabase
            .from('Ticket')
            .update({
                selling_start_at: nextStartIso,
                selling_end_at: nextEndIso,
            })
            .eq('id', row.id)
            .eq('event_id', params.eventId)

        if (updateTicketError) {
            throw new Error(`Failed to adjust ticket ${row.id} after event reschedule: ${updateTicketError.message}`)
        }

        adjustedTickets += 1
    }

    return { adjustedTickets }
}

function eventDatesChanged(beforeEvent: any, afterEvent: any): boolean {
    const beforeStart = normalizeIsoDate(beforeEvent?.event_start_at)
    const afterStart = normalizeIsoDate(afterEvent?.event_start_at)
    const beforeEnd = normalizeIsoDate(beforeEvent?.event_end_at)
    const afterEnd = normalizeIsoDate(afterEvent?.event_end_at)
    return beforeStart !== afterStart || beforeEnd !== afterEnd
}

function formatDateForEmail(value: unknown): string | null {
    const iso = normalizeIsoDate(value)
    if (!iso) return null
    return new Date(iso).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    })
}

function buildEventDateChangeReason(beforeEvent: any, afterEvent: any): string {
    const oldStart = formatDateForEmail(beforeEvent?.event_start_at)
    const oldEnd = formatDateForEmail(beforeEvent?.event_end_at)
    const newStart = formatDateForEmail(afterEvent?.event_start_at)
    const newEnd = formatDateForEmail(afterEvent?.event_end_at)

    const newRange = [newStart, newEnd].filter(Boolean).join(' to ')
    const oldRange = [oldStart, oldEnd].filter(Boolean).join(' to ')

    if (newRange && oldRange) {
        return `Event has changed date to ${newRange} (previously ${oldRange}).`
    }

    if (newRange) {
        return `Event has changed date to ${newRange}.`
    }

    return 'Event schedule has changed. Please use this updated QR code for check-in.'
}

async function reissueEventTicketQrs(params: {
    eventId: number
    eventTitle: string
    eventSlug: string
    breakoutsEnabled?: boolean
    updateReason?: string
}): Promise<{ reissued: number; emailed: number; failed: number }> {
    const supabase = await getStorageClient()

    const { data: registrations, error } = await supabase
        .from('Registration')
        .select('id, profile_pending, User(name, email), Ticket(name)')
        .eq('event_id', params.eventId)
        .not('status', 'in', '(cancelled,rejected)')

    if (error) {
        throw new Error(`Failed loading registrations for QR reissue: ${error.message}`)
    }

    const baseUrl = getPublicAppBaseUrl()
    let reissued = 0
    let emailed = 0
    let failed = 0

    for (const reg of registrations || []) {
        const row = reg as {
            id?: number
            profile_pending?: boolean | null
            User?: { name?: string | null; email?: string | null } | Array<{ name?: string | null; email?: string | null }> | null
            Ticket?: { name?: string | null } | Array<{ name?: string | null }> | null
        }

        const user = Array.isArray(row.User) ? row.User[0] : row.User
        const ticket = Array.isArray(row.Ticket) ? row.Ticket[0] : row.Ticket

        const registrationId = Number(row.id)
        if (!Number.isFinite(registrationId)) {
            failed += 1
            continue
        }

        // Keep group member completion links stable until profiles are completed.
        if (row.profile_pending === true) {
            continue
        }

        const attendeeEmail = String(user?.email || '').trim().toLowerCase()
        if (!attendeeEmail) {
            failed += 1
            continue
        }

        const token = newTicketToken()
        const { error: updateError } = await supabase
            .from('Registration')
            .update({ ticket_token: token })
            .eq('id', registrationId)
            .eq('event_id', params.eventId)

        if (updateError) {
            failed += 1
            continue
        }

        reissued += 1

        try {
            const ticketUrl = buildEticketUrl(baseUrl, params.eventSlug, token)
            const qrImageUrl = await buildAndStoreTicketQrImage({
                supabase,
                ticketUrl,
                folder: `event-${params.eventId}/tickets`,
            })

            const attendeeName = String(user?.name || '').trim() || 'Attendee'
            const ticketName = String(ticket?.name || '').trim() || 'General Admission'

            await sendEmail({
                to: attendeeEmail,
                subject: `Updated e-ticket QR - ${params.eventTitle}`,
                html: buildRegistrationConfirmationEmailHtml({
                    attendeeName,
                    eventTitle: params.eventTitle,
                    ticketName,
                    qrImageUrl,
                    ticketUrl,
                    breakoutsEnabled: !!params.breakoutsEnabled,
                    updateReason: params.updateReason,
                }),
            })

            emailed += 1
        } catch (sendError) {
            console.error('Failed sending updated ticket email:', sendError)
            failed += 1
        }
    }

    return { reissued, emailed, failed }
}

export async function updateEvent(id: number, data: Partial<any>) {
    const supabase = await createClient();

    try {
        const activeOrganizationId = await getActiveOrganizationIdOrThrow();
        const { data: beforeData, error: beforeError } = await supabase
            .from('Event')
            .select('*')
            .eq('id', id)
            .eq('organization_id', activeOrganizationId)
            .single()

        if (beforeError) {
            console.error('Error fetching event before update:', beforeError)
            return { success: false, error: beforeError.message }
        }

        const { data: updatedEvent, error } = await supabase
            .from('Event')
            .update(data)
            .eq('id', id)
            .eq('organization_id', activeOrganizationId)
            .select()
            .single()

        if (error) {
            console.error('Error updating event:', error)
            return { success: false, error: error.message }
        }

        let ticketWindowAdjustments: { adjustedTickets: number } | null = null
        try {
            ticketWindowAdjustments = await adjustTicketWindowsForEarlierEventEnd({
                supabase,
                eventId: id,
                beforeEventEndAt: beforeData?.event_end_at,
                afterEventEndAt: updatedEvent?.event_end_at,
            })
        } catch (ticketWindowError) {
            console.error('Failed adjusting ticket windows after event reschedule:', ticketWindowError)
        }

        let qrRefreshStats: { reissued: number; emailed: number; failed: number } | null = null
        if (eventDatesChanged(beforeData, updatedEvent)) {
            try {
                const eventSlug = buildEventSlug(String(updatedEvent.title || ''), id)
                const updateReason = buildEventDateChangeReason(beforeData, updatedEvent)
                qrRefreshStats = await reissueEventTicketQrs({
                    eventId: id,
                    eventTitle: String(updatedEvent.title || `Event #${id}`),
                    eventSlug,
                    breakoutsEnabled: !!updatedEvent.allow_breakout_sessions,
                    updateReason,
                })
            } catch (refreshError) {
                console.error('Failed to reissue attendee QR codes after event date change:', refreshError)
            }
        }

        try {
            await logAuditEntry('Event', id, 'update', {
                before: beforeData,
                after: updatedEvent
            })
        } catch (e) {
            console.warn('Event audit log failed (update):', e)
        }

        revalidatePath('/admin/events')
        revalidatePath(`/events/${id}`)
        return { success: true, qrRefreshStats, ticketWindowAdjustments }
    } catch (e) {
        console.error('Unexpected error updating event:', e)
        return { success: false, error: 'Failed to update event' }
    }
}

export async function uploadEventBanner(formData: FormData) {
    const supabase = await createClient();

    try {
        const file = formData.get('file') as File
        if (!file) {
            return { success: false, error: 'No file provided' }
        }

        const eventIdStr = formData.get('event_id') as string | null
        if (eventIdStr) {
            const eventId = parseInt(eventIdStr, 10)
            if (!Number.isNaN(eventId)) {
                await ensureEventEditable(eventId)
            }
        }

        const storageClient = await getStorageClient()
        const publicUrl = await uploadFileToStorage(storageClient, file)
        return { success: true, url: publicUrl }
    } catch (e: any) {
        console.error('Unexpected error uploading banner:', e)
        return { success: false, error: e.message || 'Failed to upload banner' }
    }
}

function parseHHMMToMinutes(value: string | null | undefined): number | null {
    if (!value) return null
    const match = String(value).trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/)
    if (!match) return null
    return Number(match[1]) * 60 + Number(match[2])
}

function parseIsoToUtcMinutes(value: unknown): number | null {
    if (!value || typeof value !== 'string') return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.getUTCHours() * 60 + parsed.getUTCMinutes()
}

export async function saveAgendaSlot(event_id: number, slot: { id?: string, title: string, description?: string, speaker?: string, startTime: string, endTime: string }) {
    const supabase = await createClient();

    try {
        const activeOrganizationId = await getActiveOrganizationIdOrThrow();
        const payload: any = {
            event_id,
            title: slot.title,
            description: slot.description,
            speaker_name: slot.speaker,
        };

        const agendaStartMinutes = parseHHMMToMinutes(slot.startTime)
        const agendaEndMinutes = parseHHMMToMinutes(slot.endTime)

        if (agendaStartMinutes === null || agendaEndMinutes === null) {
            return { success: false, error: 'Agenda start and end time are required.' }
        }

        if (agendaStartMinutes >= agendaEndMinutes) {
            return { success: false, error: 'Agenda end time must be later than start time.' }
        }

        // Fetch event date to construct timestamp
        const { data: event } = await supabase
            .from('Event')
            .select('event_start_at, event_end_at')
            .eq('id', event_id)
            .eq('organization_id', activeOrganizationId)
            .single();

        if (!event) throw new Error("Event not found");

        const eventStartMinutes = parseIsoToUtcMinutes(event.event_start_at)
        const eventEndMinutes = parseIsoToUtcMinutes(event.event_end_at)

        if (eventStartMinutes !== null && agendaStartMinutes < eventStartMinutes) {
            return { success: false, error: 'Agenda cannot start earlier than the event start time.' }
        }

        if (eventEndMinutes !== null && agendaEndMinutes > eventEndMinutes) {
            return { success: false, error: 'Agenda cannot end later than the event end time.' }
        }

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
    const supabase = await createClient();

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

export async function getEventAnalytics(eventId: number) {
    const supabase = await createClient();

    // Run all independent queries in parallel, each with its own error handling
    const [
        registrationCountResult,
        revenueResult,
        attendanceResult,
        trendResult,
        ticketRevenueResult,
        recentRegsResult,
    ] = await Promise.allSettled([
        // 1. Total registrations (non-cancelled)
        supabase
            .from('Registration')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .neq('status', 'cancelled'),

        // 2. Revenue (confirmed registrations)
        supabase
            .from('Registration')
            .select('final_price_paid')
            .eq('event_id', eventId)
            .eq('status', 'confirmed'),

        // 3. Attendance breakdown
        supabase
            .from('Registration')
            .select('has_checked_in, is_waitlisted, status')
            .eq('event_id', eventId),

        // 4. Weekly trend data
        supabase
            .from('Registration')
            .select('created_at')
            .eq('event_id', eventId)
            .neq('status', 'cancelled')
            .order('created_at', { ascending: true }),

        // 5. Revenue by ticket type
        supabase
            .from('Registration')
            .select('final_price_paid, ticket_id')
            .eq('event_id', eventId)
            .eq('status', 'confirmed'),

        // 6. Recent registrations
        supabase
            .from('Registration')
            .select('id, created_at, status, final_price_paid, ticket_id')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
            .limit(5),
    ]);

    // Extract registration count
    const registrationCount =
        registrationCountResult.status === 'fulfilled'
            ? (registrationCountResult.value.count || 0)
            : 0;

    // Extract revenue
    const revenueRows =
        revenueResult.status === 'fulfilled' ? (revenueResult.value.data || []) : [];
    const totalRevenue = revenueRows.reduce(
        (sum: number, r: any) => sum + (parseFloat(r.final_price_paid) || 0), 0
    );

    // Extract attendance
    const attendanceRows =
        attendanceResult.status === 'fulfilled' ? (attendanceResult.value.data || []) : [];
    const checkedIn = attendanceRows.filter((r: any) => r.has_checked_in).length;
    const waitlisted = attendanceRows.filter((r: any) => r.is_waitlisted).length;
    const totalRegistered = attendanceRows.filter((r: any) => r.status !== 'cancelled').length;
    const noShow = Math.max(0, totalRegistered - checkedIn - waitlisted);

    // Extract trend data
    const trendRows =
        trendResult.status === 'fulfilled' ? (trendResult.value.data || []) : [];
    const weeklyTrend = buildWeeklyTrend(trendRows);

    // Build ticket revenue breakdown (look up ticket names separately)
    const ticketRows =
        ticketRevenueResult.status === 'fulfilled' ? (ticketRevenueResult.value.data || []) : [];

    // Get unique ticket IDs to look up names
    const ticketIds = [...new Set(ticketRows.map((r: any) => r.ticket_id).filter(Boolean))];
    let ticketNameMap: Record<number, string> = {};
    if (ticketIds.length > 0) {
        const { data: ticketData } = await supabase
            .from('Ticket')
            .select('id, name')
            .in('id', ticketIds as number[]);
        (ticketData || []).forEach((t: any) => { ticketNameMap[t.id] = t.name; });
    }

    const ticketMap: Record<string, number> = {};
    ticketRows.forEach((r: any) => {
        const name = ticketNameMap[r.ticket_id] || 'General';
        ticketMap[name] = (ticketMap[name] || 0) + (parseFloat(r.final_price_paid) || 0);
    });
    const revenueBreakdown = Object.entries(ticketMap).map(([name, value]) => ({
        name,
        value,
        percentage: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0
    }));

    // 7. Satisfaction + Comments ΓÇö handles both new (feedback_submission_id) and old (registration_id) rows
    let avgSatisfaction = 0;
    let comments: { user: string; rating: number; text: string; time: string }[] = [];
    try {
        const { data: feedbackForms } = await supabase
            .from('FeedbackForm')
            .select('id')
            .eq('event_id', eventId);

        const formIds = (feedbackForms || []).map((f: any) => f.id);
        if (formIds.length > 0) {
            // Fetch all answers for this form (works for both old & new rows)
            const { data: allAnswers } = await supabase
                .from('FeedbackAnswer')
                .select('feedback_submission_id, registration_id, answer, FeedbackQuestion(input_format)')
                .in('feedback_form_id', formIds)
                .limit(200);

            const answerRows = (allAnswers || []) as any[];

            // Satisfaction from all rating answers
            const ratings = answerRows
                .filter((f: any) => f.FeedbackQuestion?.input_format === 'rating')
                .map((f: any) => parseFloat(f.answer))
                .filter((v: number) => !isNaN(v) && v >= 1 && v <= 5);

            if (ratings.length > 0) {
                avgSatisfaction = parseFloat(
                    (ratings.reduce((s: number, v: number) => s + v, 0) / ratings.length).toFixed(1)
                );
            }

            // Fetch FeedbackSubmission rows (new-style) for names + timestamps
            const { data: submissions } = await supabase
                .from('FeedbackSubmission')
                .select('id, submitter_name, submitted_at')
                .in('feedback_form_id', formIds)
                .order('submitted_at', { ascending: false })
                .limit(50);

            const commentMap: Record<string, { user: string; rating: number; text: string; time: string }> = {};

            // Seed new-style entries
            (submissions || []).forEach((s: any) => {
                commentMap[`sub_${s.id}`] = {
                    user: s.submitter_name || 'Anonymous',
                    rating: 0,
                    text: '',
                    time: formatRelativeTime(s.submitted_at),
                };
            });

            // Seed old-style entries
            answerRows
                .filter((a: any) => !a.feedback_submission_id && a.registration_id)
                .forEach((a: any) => {
                    const key = `reg_${a.registration_id}`;
                    if (!commentMap[key]) {
                        commentMap[key] = { user: 'Anonymous', rating: 0, text: '', time: 'Previous' };
                    }
                });

            answerRows.forEach((a: any) => {
                const key = a.feedback_submission_id
                    ? `sub_${a.feedback_submission_id}`
                    : a.registration_id
                    ? `reg_${a.registration_id}`
                    : null;
                if (!key || !commentMap[key]) return;
                if (a.FeedbackQuestion?.input_format === 'rating') {
                    const v = parseFloat(a.answer);
                    if (!isNaN(v)) commentMap[key].rating = v;
                } else if (String(a.answer || '').trim()) {
                    commentMap[key].text = commentMap[key].text
                        ? `${commentMap[key].text}\n${String(a.answer).trim()}`
                        : String(a.answer).trim();
                }
            });

            comments = Object.values(commentMap)
                .filter((c) => c.text.length > 0 || c.rating > 0)
                .slice(0, 20);
        }
    } catch (e) {
        console.warn('Could not fetch satisfaction data:', e);
    }

    // Build recent transactions (look up ticket names from already-fetched map)
    const recentRows =
        recentRegsResult.status === 'fulfilled' ? (recentRegsResult.value.data || []) : [];
    const recentTransactions = recentRows.map((r: any) => ({
        id: `REG-${r.id}`,
        user: 'Attendee',
        type: ticketNameMap[r.ticket_id] || 'General',
        amount: parseFloat(r.final_price_paid) || 0,
        date: formatRelativeTime(r.created_at),
        status: r.status === 'confirmed' ? 'Success'
            : r.status === 'pending' ? 'Pending'
                : 'Cancelled'
    }));

    return {
        stats: {
            registrations: registrationCount,
            revenue: totalRevenue,
            expenses: 0,
            netProfit: totalRevenue,
            satisfaction: avgSatisfaction,
        },
        trends: {
            registrations: weeklyTrend,
            attendance: { checkedIn, noShow, waitlisted }
        },
        revenueBreakdown,
        recentTransactions,
        comments,
    };
}

/**
 * Fetch all ticket types for a specific event.
 */
export async function getEventTickets(eventId: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('Ticket')
        .select('id, name')
        .eq('event_id', eventId)
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching event tickets:', error);
        return [];
    }

    return data || [];
}

/**
 * Fetch registration trend data for an event, optionally filtered by ticket type.
 */
export async function getRegistrationTrendData(eventId: number, ticketTypeId?: number) {
    const supabase = await createClient();
    
    let query = supabase
        .from('Registration')
        .select('created_at')
        .eq('event_id', eventId)
        .neq('status', 'cancelled');

    if (ticketTypeId && ticketTypeId > 0) {
        query = query.eq('ticket_id', ticketTypeId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching registration trend data:', error);
        return { weekly: [], weekLabels: [], registrationOpenDate: '', eventDate: '' };
    }

    return buildWeeklyTrend(data || []);
}


// ΓöÇΓöÇΓöÇ Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ


function buildWeeklyTrend(registrations: { created_at: string }[]) {
    if (registrations.length === 0) {
        return { weekly: [], weekLabels: [], registrationOpenDate: '', eventDate: '' };
    }

    const firstDate = new Date(registrations[0].created_at);
    const lastDate = new Date(registrations[registrations.length - 1].created_at);

    // Build week buckets
    const weeks: { label: string; start: Date; end: Date }[] = [];
    const cursor = new Date(firstDate);
    cursor.setHours(0, 0, 0, 0);
    // Align to start of week (Monday)
    cursor.setDate(cursor.getDate() - cursor.getDay() + 1);

    while (cursor <= lastDate) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weeks.push({
            label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            start: weekStart,
            end: weekEnd
        });
        cursor.setDate(cursor.getDate() + 7);
    }

    // Count registrations per week (cumulative)
    let cumulative = 0;
    const weekly = weeks.map(week => {
        const count = registrations.filter(r => {
            const d = new Date(r.created_at);
            return d >= week.start && d <= week.end;
        }).length;
        cumulative += count;
        return cumulative;
    });

    return {
        weekly,
        weekLabels: weeks.map(w => w.label),
        registrationOpenDate: firstDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        eventDate: lastDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
}

function formatRelativeTime(isoString: string): string {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ΓöÇΓöÇΓöÇ General (All-Events) Analytics ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export async function getGeneralAnalytics() {
    const supabase = await createClient();

    try {
        // 1. Total events (published or not)
        const { count: totalEvents } = await supabase
            .from('Event')
            .select('*', { count: 'exact', head: true });

        // 2. Total registrations across all events (non-cancelled)
        const { count: totalRegistrations } = await supabase
            .from('Registration')
            .select('*', { count: 'exact', head: true })
            .neq('status', 'cancelled');

        // 3. Total revenue across all confirmed registrations
        const { data: revenueData } = await supabase
            .from('Registration')
            .select('final_price_paid')
            .eq('status', 'confirmed');

        const totalRevenue = (revenueData || []).reduce(
            (sum: number, r: any) => sum + (parseFloat(r.final_price_paid) || 0), 0
        );

        // 4. Avg satisfaction across all events (rating questions)
        const { data: feedbackData } = await supabase
            .from('FeedbackAnswer')
            .select('answer, FeedbackQuestion(input_format)')
            .eq('FeedbackQuestion.input_format', 'rating');

        const ratings = (feedbackData || [])
            .map((f: any) => parseFloat(f.answer))
            .filter((v: number) => !isNaN(v) && v >= 1 && v <= 5);
        const avgSatisfaction = ratings.length > 0
            ? parseFloat((ratings.reduce((s: number, v: number) => s + v, 0) / ratings.length).toFixed(1))
            : 0;

        // 5. Monthly registration trend for current year
        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const { data: trendData } = await supabase
            .from('Registration')
            .select('created_at')
            .neq('status', 'cancelled')
            .gte('created_at', yearStart)
            .order('created_at', { ascending: true });

        const monthlyTrend = buildMonthlyTrend(trendData || []);

        // 6. Attendance breakdown across all events
        const { data: attendanceData } = await supabase
            .from('Registration')
            .select('has_checked_in, is_waitlisted, status');

        const checkedIn = (attendanceData || []).filter((r: any) => r.has_checked_in).length;
        const waitlisted = (attendanceData || []).filter((r: any) => r.is_waitlisted).length;
        const totalReg = (attendanceData || []).filter((r: any) => r.status !== 'cancelled').length;
        const noShow = Math.max(0, totalReg - checkedIn - waitlisted);

        // 7. Revenue breakdown by ticket type
        const { data: ticketRevData } = await supabase
            .from('Registration')
            .select('final_price_paid, Ticket(name)')
            .eq('status', 'confirmed');

        const ticketMap: Record<string, number> = {};
        (ticketRevData || []).forEach((r: any) => {
            const name = r.Ticket?.name || 'General';
            ticketMap[name] = (ticketMap[name] || 0) + (parseFloat(r.final_price_paid) || 0);
        });
        const revenueBreakdown = Object.entries(ticketMap).map(([name, value]) => ({
            name,
            value,
            percentage: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0
        }));

        // 8. Top performing events ΓÇö registrations + revenue + attendance per event
        const { data: topEventsData } = await supabase
            .from('Registration')
            .select('event_id, status, final_price_paid, has_checked_in, Event(title)')
            .neq('status', 'cancelled');

        const eventMap: Record<string, {
            name: string; registrations: number; revenue: number; checkedIn: number;
        }> = {};
        (topEventsData || []).forEach((r: any) => {
            const eid = r.event_id?.toString();
            if (!eid) return;
            if (!eventMap[eid]) {
                eventMap[eid] = { name: r.Event?.title || `Event ${eid}`, registrations: 0, revenue: 0, checkedIn: 0 };
            }
            eventMap[eid].registrations += 1;
            if (r.status === 'confirmed') eventMap[eid].revenue += parseFloat(r.final_price_paid) || 0;
            if (r.has_checked_in) eventMap[eid].checkedIn += 1;
        });
        const topEvents = Object.entries(eventMap)
            .map(([id, { name, registrations, revenue, checkedIn }]) => ({
                id,
                name,
                registrations,
                revenue,
                satisfaction: 0,     // would need per-event feedback query ΓÇö defaulting to 0
                attendance: registrations > 0 ? Math.round((checkedIn / registrations) * 100) : 0,
            }))
            .sort((a, b) => b.registrations - a.registrations)
            .slice(0, 5);

        // 9. Recent transactions across all events
        const { data: recentRows } = await supabase
            .from('Registration')
            .select('id, status, final_price_paid, created_at, Event(title), User(name)')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })
            .limit(20);

        const recentTransactions = (recentRows || []).map((r: any) => ({
            id: `REG-${r.id}`,
            user: r.User?.name || 'Attendee',
            type: r.Event?.title || 'Event Registration',
            amount: parseFloat(r.final_price_paid) || 0,
            date: formatRelativeTime(r.created_at),
            status: r.status === 'confirmed' ? 'Success'
                : r.status === 'pending' ? 'Pending'
                    : 'Cancelled',
        }));

        // 10. Feedback comments across events ΓÇö use FeedbackSubmission for rich data
        let comments: { user: string; rating: number; text: string; time: string; eventName?: string }[] = [];
        try {
            // Fetch all FeedbackAnswer rows with question type + form/event name
            const { data: allAnswerRows } = await supabase
                .from('FeedbackAnswer')
                .select('feedback_submission_id, registration_id, answer, FeedbackQuestion(input_format), FeedbackForm(Event(title))')
                .limit(200);

            // Fetch FeedbackSubmission rows (new-style) for name + timestamp
            const { data: submissionRows } = await supabase
                .from('FeedbackSubmission')
                .select('id, submitter_name, submitted_at, FeedbackForm(Event(title))')
                .order('submitted_at', { ascending: false })
                .limit(60);

            const commentMap: Record<string, { user: string; rating: number; text: string; time: string; eventName?: string }> = {};

            // Seed new-style entries
            (submissionRows || []).forEach((s: any) => {
                commentMap[`sub_${s.id}`] = {
                    user: s.submitter_name || 'Anonymous',
                    rating: 0,
                    text: '',
                    time: formatRelativeTime(s.submitted_at),
                    eventName: s?.FeedbackForm?.Event?.title || undefined,
                };
            });

            // Seed old-style entries
            (allAnswerRows || []).forEach((a: any) => {
                if (!a.feedback_submission_id && a.registration_id) {
                    const key = `reg_${a.registration_id}`;
                    if (!commentMap[key]) {
                        commentMap[key] = {
                            user: 'Anonymous',
                            rating: 0,
                            text: '',
                            time: 'Previous',
                            eventName: a?.FeedbackForm?.Event?.title || undefined,
                        };
                    }
                }
            });

            (allAnswerRows || []).forEach((a: any) => {
                const key = a.feedback_submission_id
                    ? `sub_${a.feedback_submission_id}`
                    : a.registration_id
                    ? `reg_${a.registration_id}`
                    : null;
                if (!key || !commentMap[key]) return;
                if (a.FeedbackQuestion?.input_format === 'rating') {
                    const v = parseFloat(a.answer);
                    if (!isNaN(v)) commentMap[key].rating = v;
                } else if (String(a.answer || '').trim()) {
                    commentMap[key].text = commentMap[key].text
                        ? `${commentMap[key].text}\n${String(a.answer).trim()}`
                        : String(a.answer).trim();
                }
            });

            comments = Object.values(commentMap)
                .filter((c) => c.text.length > 0 || c.rating > 0)
                .slice(0, 30);
        } catch (e) {
            console.warn('Could not fetch general feedback comments:', e);
        }

        return {
            stats: {
                totalEvents: totalEvents || 0,
                registrations: totalRegistrations || 0,
                revenue: totalRevenue,
                satisfaction: avgSatisfaction,
            },
            trends: {
                registrations: monthlyTrend,
                attendance: { checkedIn, noShow, waitlisted },
            },
            revenueBreakdown,
            topEvents,
            recentTransactions,
            comments,
        };
    } catch (e: any) {
        console.error('Error fetching general analytics:', e);
        return {
            stats: { totalEvents: 0, registrations: 0, revenue: 0, satisfaction: 0 },
            trends: {
                registrations: { monthly: [], monthLabels: [] },
                attendance: { checkedIn: 0, noShow: 0, waitlisted: 0 },
            },
            revenueBreakdown: [],
            topEvents: [],
            recentTransactions: [],
            comments: [],
        };
    }
}

function buildMonthlyTrend(registrations: { created_at: string }[]) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = Array(12).fill(0);

    registrations.forEach(r => {
        const month = new Date(r.created_at).getMonth(); // 0-indexed
        counts[month] += 1;
    });

    // Return raw counts per month (not cumulative)
    return { monthly: counts, monthLabels: months };
}

// ΓöÇΓöÇΓöÇ Event Reports ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export interface ReportRegistrant {
    id: string;
    name: string;
    email: string;
    gender: string;
    age: number;
    birthdate: string;
    ticketType: string;
    registrationType: 'Individual' | 'Group';
    status: 'Confirmed' | 'Pending' | 'Rejected';
    paymentStatus: 'Paid' | 'Pending' | 'Refunded';
    registrationDate: string;
    checkedIn: boolean;
}

export interface ReportBreakoutSession {
    id: string;
    name: string;
    speaker: string;
    room: string;
    capacity: number;
    registered: number;
    checkedIn: number;
    attendanceRate: number;
}

export interface EventReportsData {
    registrants: ReportRegistrant[];
    stats: {
        registration: {
            total: number;
            confirmed: number;
            rejected: number;
            generalAdmission: number;
            premium: number;
            group: number;
            individual: number;
        };
        attendance: {
            totalRegistered: number;
            checkedIn: number;
            noShow: number;
            attendanceRate: number;
            generalAttended: number;
            generalTotal: number;
            premiumAttended: number;
            premiumTotal: number;
        };
    };
    breakoutSessions: ReportBreakoutSession[];
}

export async function getEventReports(eventId: number): Promise<EventReportsData> {
    const supabase = await createClient();

    const empty: EventReportsData = {
        registrants: [],
        stats: {
            registration: { total: 0, confirmed: 0, rejected: 0, generalAdmission: 0, premium: 0, group: 0, individual: 0 },
            attendance: { totalRegistered: 0, checkedIn: 0, noShow: 0, attendanceRate: 0, generalAttended: 0, generalTotal: 0, premiumAttended: 0, premiumTotal: 0 },
        },
        breakoutSessions: [],
    };

    try {
        const normalizeAnswer = (value: unknown): string => {
            if (Array.isArray(value)) {
                return value
                    .map((item) => String(item ?? '').trim())
                    .filter(Boolean)
                    .join(', ');
            }
            return String(value ?? '').trim();
        };

        const extractFieldMap = (formData: any): Record<string, string> => {
            const result: Record<string, string> = {};
            const sections = formData?.sections;
            if (!Array.isArray(sections)) return result;

            for (const section of sections) {
                const inputs = section?.inputs;
                if (!Array.isArray(inputs)) continue;

                for (const input of inputs) {
                    const identifier = String(input?.fieldIdentifier || input?.field_identifier || '').trim();
                    if (!identifier) continue;

                    const answer = input?.answer ?? input?.answers;
                    const normalized = normalizeAnswer(answer);
                    if (!normalized) continue;
                    result[identifier] = normalized;
                }
            }

            return result;
        };

        // ΓöÇΓöÇ 1. Registrations with User + Ticket ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        const { data: regRows, error: regErr } = await supabase
            .from('Registration')
            .select('id, status, has_checked_in, registration_group_id, created_at, final_price_paid, ticket_id, User(name, email), Ticket(name)')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (regErr) {
            console.error('getEventReports: registration query failed', regErr);
            return empty;
        }

        const rows = regRows || [];

        // ΓöÇΓöÇ 2. Order form entries for demographics enrichment ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        const { data: formEntries } = await supabase
            .from('OrderFormEntries')
            .select('registration_id, user_email, form_data')
            .eq('event_id', eventId)
            .order('submitted_at', { ascending: false });

        const entryByRegistrationId = new Map<number, Record<string, string>>();
        const entryByEmail = new Map<string, Record<string, string>>();
        for (const entry of (formEntries || []) as any[]) {
            const mapped = extractFieldMap(entry.form_data);
            if (Object.keys(mapped).length === 0) continue;

            const registrationId = Number(entry.registration_id);
            if (!Number.isNaN(registrationId) && !entryByRegistrationId.has(registrationId)) {
                entryByRegistrationId.set(registrationId, mapped);
            }

            const email = String(entry.user_email || '').toLowerCase().trim();
            if (email && !entryByEmail.has(email)) {
                entryByEmail.set(email, mapped);
            }
        }

        // Map status strings to UI labels
        const mapStatus = (s: string): 'Confirmed' | 'Pending' | 'Rejected' => {
            if (s === 'confirmed') return 'Confirmed';
            if (s === 'rejected' || s === 'cancelled') return 'Rejected';
            return 'Pending';
        };

        const mapPayment = (s: string): 'Paid' | 'Pending' | 'Refunded' => {
            if (s === 'confirmed') return 'Paid';
            if (s === 'cancelled') return 'Refunded';
            return 'Pending';
        };

        const deriveAge = (birthdateRaw: string | undefined): number => {
            if (!birthdateRaw) return 0;
            const birthDate = new Date(birthdateRaw);
            if (Number.isNaN(birthDate.getTime())) return 0;

            const now = new Date();
            let age = now.getFullYear() - birthDate.getFullYear();
            const monthDiff = now.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
                age -= 1;
            }
            return age > 0 ? age : 0;
        };

        const registrants: ReportRegistrant[] = rows.map((r: any) => {
            const rowEmail = String(r.User?.email || '').toLowerCase().trim();
            const fields = entryByRegistrationId.get(Number(r.id)) || entryByEmail.get(rowEmail) || {};
            const birthdate = fields.birthdate || 'N/A';
            const parsedAge = fields.age ? parseInt(fields.age, 10) : 0;
            const age = !Number.isNaN(parsedAge) && parsedAge > 0
                ? parsedAge
                : deriveAge(fields.birthdate);

            return {
                id: r.id.toString(),
                name: r.User?.name || 'Unknown',
                email: r.User?.email || 'ΓÇö',
                gender: fields.gender || 'N/A',
                age,
                birthdate,
                ticketType: r.Ticket?.name || 'General Admission',
                registrationType: r.registration_group_id ? 'Group' : 'Individual',
                status: mapStatus(r.status || ''),
                paymentStatus: mapPayment(r.status || ''),
                registrationDate: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
                checkedIn: !!r.has_checked_in,
            };
        });

        // ΓöÇΓöÇ 3. Aggregate stats ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        const nonCancelled = rows.filter((r: any) => r.status !== 'cancelled');
        const total = nonCancelled.length;
        const confirmed = nonCancelled.filter((r: any) => r.status === 'confirmed').length;
        const rejected = rows.filter((r: any) => r.status === 'rejected' || r.status === 'cancelled').length;
        const group = nonCancelled.filter((r: any) => !!r.registration_group_id).length;
        const individual = total - group;

        // Ticket-type breakdown (treat anything not "Premium" as General Admission)
        const generalAdmissionRows = nonCancelled.filter((r: any) =>
            !(r.Ticket?.name || '').toLowerCase().includes('premium'));
        const premiumRows = nonCancelled.filter((r: any) =>
            (r.Ticket?.name || '').toLowerCase().includes('premium'));

        const checkedInAll = nonCancelled.filter((r: any) => r.has_checked_in).length;
        const noShow = Math.max(0, total - checkedInAll);
        const attendanceRate = total > 0 ? parseFloat(((checkedInAll / total) * 100).toFixed(1)) : 0;

        const generalAttended = generalAdmissionRows.filter((r: any) => r.has_checked_in).length;
        const generalTotal = generalAdmissionRows.length;
        const premiumAttended = premiumRows.filter((r: any) => r.has_checked_in).length;
        const premiumTotal = premiumRows.length;

        // ΓöÇΓöÇ 4. Breakout Sessions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
        const { data: bsRows } = await supabase
            .from('BreakoutSession')
            .select('id, name, speaker_name, room_name, room_capacity, BreakoutSessionRegistration(id, check_in_time, status)')
            .eq('event_id', eventId);

        const breakoutSessions: ReportBreakoutSession[] = (bsRows || []).map((s: any) => {
            const regs: any[] = s.BreakoutSessionRegistration || [];
            const registeredCount = regs.length;
            const checkedInCount = regs.filter((r: any) => !!r.check_in_time || r.status === 'checked_in').length;
            return {
                id: s.id.toString(),
                name: s.name || `Session ${s.id}`,
                speaker: s.speaker_name || 'ΓÇö',
                room: s.room_name || 'ΓÇö',
                capacity: s.room_capacity || 0,
                registered: registeredCount,
                checkedIn: checkedInCount,
                attendanceRate: registeredCount > 0
                    ? parseFloat(((checkedInCount / registeredCount) * 100).toFixed(1))
                    : 0,
            };
        });

        return {
            registrants,
            stats: {
                registration: { total, confirmed, rejected, generalAdmission: generalAdmissionRows.length, premium: premiumRows.length, group, individual },
                attendance: { totalRegistered: total, checkedIn: checkedInAll, noShow, attendanceRate, generalAttended, generalTotal, premiumAttended, premiumTotal },
            },
            breakoutSessions,
        };
    } catch (e) {
        console.error('getEventReports error:', e);
        return empty;
    }
}

// ΓöÇΓöÇΓöÇ Demographics ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const DEMOGRAPHIC_FIELDS: { identifier: string; label: string }[] = [
    { identifier: 'gender', label: 'Gender' },
    { identifier: 'age', label: 'Age' },
    { identifier: 'city', label: 'City' },
    { identifier: 'country', label: 'Country' },
    { identifier: 'state', label: 'State / Province' },
    { identifier: 'company', label: 'Company' },
    { identifier: 'job_title', label: 'Job Title' },
    { identifier: 'department', label: 'Department' },
    { identifier: 'dietary_restrictions', label: 'Dietary Restrictions' },
    { identifier: 'special_needs', label: 'Special Needs' },
    { identifier: 'newsletter_signup', label: 'Newsletter Signup' },
];

export interface DemographicsFieldData {
    identifier: string;
    label: string;
    distribution: { value: string; count: number }[];
}

export interface DemographicsData {
    totalResponses: number;
    fields: DemographicsFieldData[];
}

export async function getEventDemographics(eventId: number): Promise<DemographicsData> {
    const supabase = await createClient();
    const empty: DemographicsData = { totalResponses: 0, fields: [] };

    try {
        const { data: entries, error } = await supabase
            .from('OrderFormEntries')
            .select('form_data')
            .eq('event_id', eventId);

        if (error) {
            console.error('getEventDemographics query error:', error);
            return empty;
        }

        if (!entries || entries.length === 0) return empty;

        const counts: Record<string, Record<string, number>> = {};

        for (const entry of entries) {
            const formData = entry.form_data as any;
            if (!formData?.sections) continue;

            for (const section of formData.sections) {
                if (!section?.inputs) continue;

                for (const input of section.inputs) {
                    const id: string = input.fieldIdentifier || input.field_identifier;
                    if (!id || id === 'custom') continue;
                    if (!DEMOGRAPHIC_FIELDS.some(f => f.identifier === id)) continue;

                    if (!counts[id]) counts[id] = {};

                    const raw = input.answer ?? input.answers;
                    const values: string[] = Array.isArray(raw)
                        ? raw.filter(Boolean)
                        : raw != null && String(raw).trim() !== ''
                            ? [String(raw).trim()]
                            : [];

                    for (const v of values) {
                        counts[id][v] = (counts[id][v] ?? 0) + 1;
                    }
                }
            }
        }

        const fields: DemographicsFieldData[] = DEMOGRAPHIC_FIELDS
            .filter(f => counts[f.identifier] && Object.keys(counts[f.identifier]).length > 0)
            .map(f => ({
                identifier: f.identifier,
                label: f.label,
                distribution: Object.entries(counts[f.identifier])
                    .map(([value, count]) => ({ value, count }))
                    .sort((a, b) => b.count - a.count),
            }));

        return { totalResponses: entries.length, fields };
    } catch (e) {
        console.error('getEventDemographics error:', e);
        return empty;
    }
}

export async function deleteEvent(id: number) {
    const supabase = await createClient();

    try {
        const { data: eventBefore, error: beforeError } = await supabase
            .from('Event')
            .select('*')
            .eq('id', id)
            .single();

        if (beforeError) {
            console.error('Error fetching event before delete:', beforeError);
            return { success: false, error: beforeError.message };
        }

        // Find forms to delete their answers first
        const { data: forms } = await supabase
            .from('FeedbackForm')
            .select('id')
            .eq('event_id', id);

        if (forms && forms.length > 0) {
            const formIds = forms.map((f: any) => f.id);
            await supabase.from('FeedbackAnswer').delete().in('feedback_form_id', formIds);
            await supabase.from('FeedbackForm').delete().eq('event_id', id);
        }

        // Delete Registration-related data (AddOnRedemption references Registration)
        const { data: regs } = await supabase
            .from('Registration')
            .select('id')
            .eq('event_id', id);

        if (regs && regs.length > 0) {
            const regIds = regs.map((r: any) => r.id);
            await supabase.from('AddOnRedemption').delete().in('registration_id', regIds);
        }

        // Delete other related tables
        await Promise.all([
            supabase.from('AgendaSlot').delete().eq('event_id', id),
            supabase.from('Ticket').delete().eq('event_id', id),
            supabase.from('AddOn').delete().eq('event_id', id),
            supabase.from('PromoCode').delete().eq('event_id', id),
            supabase.from('Registration').delete().eq('event_id', id), // Finally delete registrations
            supabase.from('OrderForm').delete().eq('event_id', id)
        ]);

        // Attempt to delete order form entries
        try {
            await supabase.from('OrderFormEntries').delete().eq('event_id', id);
        } catch (e) { /* ignore if doesn't exist */ }

        // Finally, delete the Event itself
        const { error } = await supabase
            .from('Event')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting event:', error);
            // It might fail if there are still constraints we missed, but we try to supply a better error.
            return { success: false, error: error.details || error.message };
        }

        try {
            await logAuditEntry('Event', id, 'delete', {
                before: eventBefore,
                after: null
            });
        } catch (e) {
            console.warn('Event audit log failed (delete):', e);
        }

        revalidatePath('/admin/events');
        return { success: true };
    } catch (e: any) {
        console.error('Unexpected error deleting event:', e);
        return { success: false, error: e.message || 'Failed to delete event' };
    }
}
