import { notFound } from "next/navigation";
import CertificatesClient from './CertificatesClient';
import { getEventData } from "@/lib/api";

interface PageProps {
    params: Promise<{
        eventId: string;
    }>;
}

export default async function CertificatesPage({ params }: PageProps) {
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
        status: data.status,
    };

    return <CertificatesClient event={event} />;
}
