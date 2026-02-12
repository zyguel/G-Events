import { notFound } from "next/navigation";
import { getEventData } from "@/lib/api";
import WaitlistClient from "./WaitlistClient";

export default async function WaitlistPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // Validate eventId
    if (!eventId || eventId === 'undefined') {
        console.error('Invalid eventId:', eventId);
        return notFound();
    }

    const data = await getEventData(eventId);

    if (!data) {
        console.error('Event not found for eventId:', eventId);
        return notFound();
    }

    const event = {
        id: data.id,
        name: data.name,
        date: data.date,
        status: data.status
    };

    return <WaitlistClient event={event} />;
}
