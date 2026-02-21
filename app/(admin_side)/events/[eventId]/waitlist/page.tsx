import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions/events";
import WaitlistClient from "./WaitlistClient";

export default async function WaitlistPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // Validate eventId
    if (!eventId || eventId === 'undefined') {
        console.error('Invalid eventId:', eventId);
        return notFound();
    }

    const id = parseInt(eventId);
    if (isNaN(id)) return notFound();

    const data = await getEventById(id);

    if (!data) {
        console.error('Event not found for eventId:', eventId);
        return notFound();
    }

    // Derive status
    const now = new Date();
    const startDate = data.event_start_at ? new Date(data.event_start_at) : null;
    const endDate = data.event_end_at ? new Date(data.event_end_at) : null;

    let status: "Draft" | "Completed" | "Ongoing" | "Published" | "Not Yet Published" | "Not Started" | "Cancelled" = 'Draft';
    if (data.is_published) {
        if (endDate && endDate < now) {
            status = 'Completed';
        } else if (startDate && startDate <= now && endDate && endDate >= now) {
            status = 'Ongoing';
        } else {
            status = 'Published';
        }
    }

    const event = {
        id: data.id.toString(),
        name: data.title,
        date: data.event_start_at || '',
        status: status
    };

    return <WaitlistClient event={event} />;
}
