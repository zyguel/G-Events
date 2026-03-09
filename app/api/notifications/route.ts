import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

        const [regsToday, pendingOrders, upcomingEvents, waitlistEntries, updatedEvents] = await Promise.allSettled([
            // 1. Registrations created today
            supabase
                .from('Registration')
                .select('id, event_id, Event(title)', { count: 'exact' })
                .gte('created_at', todayStart)
                .neq('status', 'cancelled'),

            // 2. Pending registrations (need review)
            supabase
                .from('Registration')
                .select('id, Event(title)', { count: 'exact' })
                .eq('status', 'pending'),

            // 3. Events starting within next 24 hours
            supabase
                .from('Event')
                .select('id, title, event_start_at')
                .eq('is_published', true)
                .gte('event_start_at', now.toISOString())
                .lte('event_start_at', in24h)
                .order('event_start_at', { ascending: true }),

            // 4. Pending waitlist entries
            supabase
                .from('WaitlistEntry')
                .select('id, event_id, Event(title)', { count: 'exact' })
                .eq('status', 'pending'),

            // 5. Events updated in the last 24 hours
            supabase
                .from('Event')
                .select('id, title, updated_at')
                .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
                .order('updated_at', { ascending: false }),
        ]);

        const notifications: Array<{
            id: string;
            type: 'info' | 'success' | 'warning' | 'alert';
            title: string;
            message: string;
            timestamp: string;
            read: boolean;
        }> = [];

        // New registrations today
        if (regsToday.status === 'fulfilled' && (regsToday.value.count ?? 0) > 0) {
            const count = regsToday.value.count!;
            // Get most common event name from today's regs
            const rows: any[] = regsToday.value.data || [];
            const eventCounts: Record<string, { name: string; count: number }> = {};
            rows.forEach((r: any) => {
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

        // Pending orders
        if (pendingOrders.status === 'fulfilled' && (pendingOrders.value.count ?? 0) > 0) {
            const count = pendingOrders.value.count!;
            const rows: any[] = pendingOrders.value.data || [];
            // Most common pending event
            const eventCounts: Record<string, { name: string; count: number }> = {};
            rows.forEach((r: any) => {
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

        // Events starting soon
        if (upcomingEvents.status === 'fulfilled' && (upcomingEvents.value.data?.length ?? 0) > 0) {
            const events: any[] = upcomingEvents.value.data!;
            events.forEach((event: any, i: number) => {
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

        // Waitlist entries
        if (waitlistEntries.status === 'fulfilled' && (waitlistEntries.value.count ?? 0) > 0) {
            const count = waitlistEntries.value.count!;
            const rows: any[] = waitlistEntries.value.data || [];
            const eventCounts: Record<string, { name: string; count: number }> = {};
            rows.forEach((r: any) => {
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

        // Updated events
        if (updatedEvents.status === 'fulfilled' && (updatedEvents.value.data?.length ?? 0) > 0) {
            const events: any[] = updatedEvents.value.data!;
            events.forEach((event: any) => {
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

        return NextResponse.json({ success: true, data: notifications });
    } catch (e: any) {
        console.error('Notifications API error:', e);
        return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
}
