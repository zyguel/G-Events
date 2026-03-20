import { notFound } from "next/navigation";
import ReportsClient from "./ReportsClient";
import { getEventById, getEventReports } from "@/lib/actions/events";
import PermissionGate from "@/components/admin/PermissionGate";

export default async function ReportsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    if (!eventId || eventId === 'undefined') {
        console.error('Invalid eventId slug:', eventId);
        return notFound();
    }

    const slug = eventId;
    const idPart = slug.split('-').pop() ?? '';
    const id = parseInt(idPart, 10);
    if (isNaN(id)) return notFound();

    const [data, reports] = await Promise.all([
        getEventById(id),
        getEventReports(id),
    ]);

    if (!data) {
        console.error('Event not found for eventId:', eventId);
        return notFound();
    }

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

    return (
        <PermissionGate permission="View Reports">
            <ReportsClient event={event} reports={reports} />
        </PermissionGate>
    );
}
