import { getEvents } from '@/lib/actions/events';
import EventsPageClient, { type Event } from './EventsPageClient';

function deriveStatus(
    isPublished: boolean,
    startAt: string | null,
    endAt: string | null,
    nowMs: number,
): Event['status'] {
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

export default async function EventsPage() {
    const data = await getEvents();
    const nowMs = new Date().getTime();

    type EventRow = Awaited<ReturnType<typeof getEvents>>[number];

    const mappedEvents: Event[] = data.map((event: EventRow) => {
        const status = deriveStatus(
            Boolean(event.is_published),
            event.event_start_at ?? null,
            event.event_end_at ?? null,
            nowMs,
        );

        return {
            id: event.id,
            name: event.title,
            location: event.location || 'TBD',
            date: event.event_start_at ? String(event.event_start_at).split('T')[0] : '',
            ticketsSold: 0,
            totalTickets: event.capacity || 100,
            attendees: 0,
            status,
            type: status === 'Completed' ? 'past' : 'upcoming',
            image: event.banner_image,
            analyticsId: String(event.id),
        };
    });

    return <EventsPageClient initialEvents={mappedEvents} />;
}
