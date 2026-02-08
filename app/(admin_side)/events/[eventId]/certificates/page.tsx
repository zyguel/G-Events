import CertificatesClient from './CertificatesClient';

interface PageProps {
    params: {
        eventId: string;
    };
}

export default function CertificatesPage({ params }: PageProps) {
    const event = {
        id: params.eventId,
        name: 'DevFest Cebu 2025',
        date: '2025-03-15',
        status: 'Ongoing' as const,
    };

    return <CertificatesClient event={event} />;
}
