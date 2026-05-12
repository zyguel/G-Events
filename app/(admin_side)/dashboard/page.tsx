import { createClient } from '@/lib/supabase-server';
import { getEvents } from '@/lib/actions/events';
import DashboardPageClient, {
    type DashboardActivity,
    type DashboardEvent,
} from './DashboardPageClient';

function deriveStatus(
    isPublished: boolean,
    startAt: string | null,
    endAt: string | null,
    nowMs: number,
): DashboardEvent['status'] {
    if (!isPublished) {
        return 'Draft';
    }

    const startMs = startAt ? Date.parse(startAt) : Number.NaN;
    const endMs = endAt ? Date.parse(endAt) : Number.NaN;

    if (!Number.isNaN(endMs) && endMs < nowMs) {
        return 'Completed';
    }

    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && startMs <= nowMs && endMs >= nowMs) {
        return 'Live';
    }

    return 'Upcoming';
}

function parseEventTime(value: string | null): number {
    return value ? Date.parse(value) : Number.NaN;
}

function formatRelativeDate(value: string | null, nowMs: number): string {
    if (!value) return 'Date TBD';

    const eventMs = Date.parse(value);
    if (Number.isNaN(eventMs)) return 'Date TBD';

    const diffMs = nowMs - eventMs;
    const absMinutes = Math.floor(Math.abs(diffMs) / 60000);

    if (absMinutes < 1) return 'Just now';
    if (absMinutes < 60) return diffMs >= 0 ? `${absMinutes} min ago` : `In ${absMinutes} min`;

    const absHours = Math.floor(absMinutes / 60);
    if (absHours < 24) return diffMs >= 0 ? `${absHours} hour${absHours === 1 ? '' : 's'} ago` : `In ${absHours} hour${absHours === 1 ? '' : 's'}`;

    const absDays = Math.floor(absHours / 24);
    if (absDays < 30) return diffMs >= 0 ? `${absDays} day${absDays === 1 ? '' : 's'} ago` : `In ${absDays} day${absDays === 1 ? '' : 's'}`;

    return new Date(eventMs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export const metadata = {
    title: 'Dashboard',
};

export default async function DashboardPage() {
    const events = await getEvents();
    const nowMs = new Date().getTime();

    type EventRow = Awaited<ReturnType<typeof getEvents>>[number];

    const mappedEvents: DashboardEvent[] = events.map((event: EventRow) => {
        const status = deriveStatus(
            Boolean(event.is_published),
            event.event_start_at ?? null,
            event.event_end_at ?? null,
            nowMs,
        );

        return {
            id: event.id,
            name: event.title,
            date: event.event_start_at
                ? new Date(event.event_start_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                })
                : 'TBD',
            registrations: Number((event as { tickets_sold_count?: number }).tickets_sold_count || 0),
            pendingOrders: Number((event as { pending_orders_count?: number }).pending_orders_count || 0),
            status,
            image: event.banner_image ?? null,
            rawDate: event.event_start_at ?? null,
        };
    });

    const totalRegistrations = mappedEvents.reduce((sum, event) => sum + event.registrations, 0);

    const upcoming = mappedEvents
        .filter((event) => {
            if (event.status === 'Upcoming' || event.status === 'Live') {
                return true;
            }

            if (event.status !== 'Draft') {
                return false;
            }

            const eventMs = parseEventTime(event.rawDate);
            return !Number.isNaN(eventMs) && eventMs > nowMs;
        })
        .sort((a, b) => {
            const aMs = parseEventTime(a.rawDate);
            const bMs = parseEventTime(b.rawDate);

            if (Number.isNaN(aMs) && Number.isNaN(bMs)) return 0;
            if (Number.isNaN(aMs)) return 1;
            if (Number.isNaN(bMs)) return -1;
            return aMs - bMs;
        });

    const nextEvent = upcoming.length > 0 ? upcoming[0] : null;
    const pendingOrdersCount = mappedEvents
        .filter((event) => event.status === 'Upcoming')
        .reduce((sum, event) => sum + event.pendingOrders, 0);

    let activities: DashboardActivity[] = [];
    if (mappedEvents.length > 0) {
        const eventIds = mappedEvents.map(e => e.id);
        const supabase = await createClient();

        // Fetch recent audit logs for the organization's events
        const { data: auditLogs } = await supabase
            .from('AuditLog')
            .select('*')
            .eq('entity_type', 'Event')
            .in('entity_id', eventIds)
            .order('created_at', { ascending: false })
            .limit(10);

        if (auditLogs) {
            activities = auditLogs.slice(0, 4).map((log, index) => {
                const event = mappedEvents.find(e => e.id === log.entity_id);
                let actionName = 'Event updated';
                if (log.action === 'create') actionName = 'Event created';
                if (log.action === 'delete') actionName = 'Event deleted';

                return {
                    id: `log-${log.audit_hash || index}`,
                    action: actionName,
                    user: 'Organizer',
                    event: event?.name || 'Unknown Event',
                    time: formatRelativeDate(log.created_at, nowMs),
                };
            });
        }
    }

    return (
        <DashboardPageClient
            initialAllEvents={mappedEvents}
            initialDashboardEvents={upcoming}
            initialActivities={activities}
            initialNextEvent={nextEvent}
            totalRegistrations={totalRegistrations}
            pendingOrdersCount={pendingOrdersCount}
        />
    );
}
