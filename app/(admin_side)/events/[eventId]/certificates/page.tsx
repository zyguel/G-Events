import CertificatesClient from './CertificatesClient';

interface PageProps {
    params: Promise<{
        eventId: string;
    }>;
}

export default async function CertificatesPage({ params }: PageProps) {
    const { eventId } = await params;

    // Validate eventId
    if (!eventId || eventId === 'undefined') {
        throw new Error('Invalid event ID');
    }

    const event = {
        id: eventId,
        name: 'DevFest Cebu 2025',
        date: '2025-03-15',
        status: 'Ongoing' as const,
    };

    return <CertificatesClient event={event} />;
}
