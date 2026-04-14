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

    const activities: DashboardActivity[] = [...mappedEvents]
        .sort((a, b) => {
            const aMs = parseEventTime(a.rawDate);
            const bMs = parseEventTime(b.rawDate);

            if (Number.isNaN(aMs) && Number.isNaN(bMs)) return 0;
            if (Number.isNaN(aMs)) return 1;
            if (Number.isNaN(bMs)) return -1;
            return bMs - aMs;
        })
        .slice(0, 4)
        .map((event, index) => ({
            id: `event-${index}`,
            action: 'Event Created',
            user: 'System',
            event: event.name,
            time: 'Recently',
        }));

    return (
        <DashboardPageClient
            initialDashboardEvents={upcoming}
            initialActivities={activities}
            initialNextEvent={nextEvent}
            totalRegistrations={totalRegistrations}
        />
    );
}
