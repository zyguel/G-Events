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

export async function getEventAnalytics(eventId: number) {
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

    // 7. Satisfaction — two-step, fully isolated
    let avgSatisfaction = 0;
    try {
        const { data: feedbackForms } = await supabase
            .from('FeedbackForm')
            .select('id')
            .eq('event_id', eventId);

        const formIds = (feedbackForms || []).map((f: any) => f.id);
        if (formIds.length > 0) {
            const { data: feedbackAnswers } = await supabase
                .from('FeedbackAnswer')
                .select('answer, FeedbackQuestion(input_format)')
                .in('feedback_form_id', formIds);

            const ratings = (feedbackAnswers || [])
                .filter((f: any) => f.FeedbackQuestion?.input_format === 'rating')
                .map((f: any) => parseFloat(f.answer))
                .filter((v: number) => !isNaN(v) && v >= 1 && v <= 5);

            if (ratings.length > 0) {
                avgSatisfaction = parseFloat(
                    (ratings.reduce((s: number, v: number) => s + v, 0) / ratings.length).toFixed(1)
                );
            }
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
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────


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

// ─── General (All-Events) Analytics ──────────────────────────────────────────

export async function getGeneralAnalytics() {
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

        // 8. Top performing events — registrations + revenue + attendance per event
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
                satisfaction: 0,     // would need per-event feedback query — defaulting to 0
                attendance: registrations > 0 ? Math.round((checkedIn / registrations) * 100) : 0,
            }))
            .sort((a, b) => b.registrations - a.registrations)
            .slice(0, 5);

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
