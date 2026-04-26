import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireUser, getAuthErrorResponse } from '@/lib/apiAuth';
import {
    ACTIVE_ORGANIZATION_COOKIE_NAME,
    SESSION_ROLE,
    SESSION_ROLE_COOKIE_NAME,
} from '@/lib/constants';
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole';

export const dynamic = 'force-dynamic';

async function getNotificationsData(activeOrganizationId: number | null) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const supabase = await createClient();

    let registrationsTodayQuery = supabase
        .from('Registration')
        .select('id, event_id, Event!inner(title, organization_id)', { count: 'exact' })
        .gte('created_at', todayStart)
        .neq('status', 'cancelled');

    let pendingOrdersQuery = supabase
        .from('Registration')
        .select('id, Event!inner(title, organization_id)', { count: 'exact' })
        .eq('status', 'pending');

    let upcomingEventsQuery = supabase
        .from('Event')
        .select('id, title, event_start_at')
        .eq('is_published', true)
        .gte('event_start_at', now.toISOString())
        .lte('event_start_at', in24h)
        .order('event_start_at', { ascending: true });

    let waitlistEntriesQuery = supabase
        .from('WaitlistEntry')
        .select('id, event_id, Event!inner(title, organization_id)', { count: 'exact' })
        .eq('status', 'pending');

    let updatedEventsQuery = supabase
        .from('Event')
        .select('id, title, updated_at')
        .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: false });

    if (activeOrganizationId) {
        registrationsTodayQuery = registrationsTodayQuery.eq('Event.organization_id', activeOrganizationId);
        pendingOrdersQuery = pendingOrdersQuery.eq('Event.organization_id', activeOrganizationId);
        waitlistEntriesQuery = waitlistEntriesQuery.eq('Event.organization_id', activeOrganizationId);
        upcomingEventsQuery = upcomingEventsQuery.eq('organization_id', activeOrganizationId);
        updatedEventsQuery = updatedEventsQuery.eq('organization_id', activeOrganizationId);
    }

    const [regsToday, pendingOrders, upcomingEvents, waitlistEntries, updatedEvents] = await Promise.allSettled([
        registrationsTodayQuery,
        pendingOrdersQuery,
        upcomingEventsQuery,
        waitlistEntriesQuery,
        updatedEventsQuery,
    ]);

    const notifications: Array<{
        id: string;
        type: 'info' | 'success' | 'warning' | 'alert';
        title: string;
        message: string;
        timestamp: string;
        read: boolean;
    }> = [];

    type EventTitleJoinRow = {
        event_id?: number | null;
        Event?: { title?: string | null } | null;
    };

    type EventSoonRow = {
        id: number;
        title: string;
        event_start_at: string;
    };

    type EventUpdatedRow = {
        id: number;
        title: string;
        updated_at: string;
    };

    if (regsToday.status === 'fulfilled' && (regsToday.value.count ?? 0) > 0) {
        const count = regsToday.value.count!;
        const rows = (regsToday.value.data || []) as EventTitleJoinRow[];
        const eventCounts: Record<string, { name: string; count: number }> = {};
        rows.forEach((r) => {
            const eid = r.event_id?.toString();
            if (!eid) return;
            if (!eventCounts[eid]) eventCounts[eid] = { name: r.Event?.title || 'an event', count: 0 };
            eventCounts[eid].count++;
        });
        const topEvent = Object.values(eventCounts).sort((a, b) => b.count - a.count)[0];
        notifications.push({
            id: 'regs-today',
            type: 'success',
            title: 'New Registrations',
            message: `${count} registration${count !== 1 ? 's' : ''} today${topEvent ? ` for ${topEvent.name}` : ''}!`,
            timestamp: now.toISOString(),
            read: false,
        });
    }

    if (pendingOrders.status === 'fulfilled' && (pendingOrders.value.count ?? 0) > 0) {
        const count = pendingOrders.value.count!;
        const rows = (pendingOrders.value.data || []) as EventTitleJoinRow[];
        const eventCounts: Record<string, { name: string; count: number }> = {};
        rows.forEach((r) => {
            const title = r.Event?.title;
            if (!title) return;
            if (!eventCounts[title]) eventCounts[title] = { name: title, count: 0 };
            eventCounts[title].count++;
        });
        const topEvent = Object.values(eventCounts).sort((a, b) => b.count - a.count)[0];
        notifications.push({
            id: 'pending-orders',
            type: 'warning',
            title: 'Orders Pending Review',
            message: `${count} order${count !== 1 ? 's' : ''} need${count === 1 ? 's' : ''} review${topEvent ? ` for ${topEvent.name}` : ''}`,
            timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
            read: false,
        });
    }

    if (upcomingEvents.status === 'fulfilled' && (upcomingEvents.value.data?.length ?? 0) > 0) {
        const events = upcomingEvents.value.data as EventSoonRow[];
        events.forEach((event, i) => {
            const startAt = new Date(event.event_start_at);
            const diffHours = Math.round((startAt.getTime() - now.getTime()) / 3600000);
            const timeStr = diffHours < 1 ? 'less than an hour' : `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
            notifications.push({
                id: `event-soon-${event.id}`,
                type: 'info',
                title: 'Event Starting Soon',
                message: `${event.title} starts in ${timeStr}!`,
                timestamp: new Date(now.getTime() - (i + 1) * 30 * 60 * 1000).toISOString(),
                read: false,
            });
        });
    }

    if (waitlistEntries.status === 'fulfilled' && (waitlistEntries.value.count ?? 0) > 0) {
        const count = waitlistEntries.value.count!;
        const rows = (waitlistEntries.value.data || []) as EventTitleJoinRow[];
        const eventCounts: Record<string, { name: string; count: number }> = {};
        rows.forEach((r) => {
            const title = r.Event?.title;
            if (!title) return;
            if (!eventCounts[title]) eventCounts[title] = { name: title, count: 0 };
            eventCounts[title].count++;
        });
        const topEvent = Object.values(eventCounts).sort((a, b) => b.count - a.count)[0];
        notifications.push({
            id: 'waitlist',
            type: 'warning',
            title: 'Waitlist Growing',
            message: `${count} attendee${count !== 1 ? 's' : ''} on the waitlist${topEvent ? ` for ${topEvent.name}` : ''}`,
            timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
            read: false,
        });
    }

    if (updatedEvents.status === 'fulfilled' && (updatedEvents.value.data?.length ?? 0) > 0) {
        const events = updatedEvents.value.data as EventUpdatedRow[];
        events.forEach((event) => {
            notifications.push({
                id: `event-update-${event.id}-${event.updated_at}`,
                type: 'info',
                title: 'Event Updated',
                message: `Details for ${event.title} were recently modified`,
                timestamp: event.updated_at,
                read: false,
            });
        });
    }

    return notifications;
}

export async function GET(request: NextRequest) {
    try {
        await requireUser();

        const sessionRole = request.cookies.get(SESSION_ROLE_COOKIE_NAME)?.value;
        let activeOrganizationId: number | null = null;

        if (sessionRole === SESSION_ROLE.ORGANIZER) {
            const preferredOrganizationId = parseOrganizationId(
                request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
            );
            const orgContext = await getCurrentUserActiveOrganization(preferredOrganizationId);
            activeOrganizationId = orgContext.activeOrganizationId;
        }

        // Stop if organizer has no active organization
        if (sessionRole === SESSION_ROLE.ORGANIZER && !activeOrganizationId) {
            return NextResponse.json({ success: true, data: [] });
        }

        const data = await getNotificationsData(activeOrganizationId);
        
        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        const authResponse = getAuthErrorResponse(error);
        if (authResponse) {
            return authResponse;
        }

        if (process.env.NODE_ENV === 'development') {
            console.error('Notifications API error:', error);
        }
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}
