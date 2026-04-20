import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions/events";
import OrderForm from "@/components/admin/OrderForm";

export default async function OrderFormPage({ 
    params,
    searchParams
}: { 
    params: Promise<{ eventId: string }>
    searchParams: Promise<{ formId?: string }>
}) {
    const { eventId } = await params;
    const { formId } = await searchParams;

    // Validate and parse eventId slug (e.g. "my-event-123")
    if (!eventId || eventId === 'undefined') {
        console.error('Invalid eventId slug:', eventId);
        return notFound();
    }

    const slug = eventId;
    const idPart = slug.split('-').pop() ?? '';
    const numericId = parseInt(idPart, 10);
    if (isNaN(numericId)) return notFound();

    const data = await getEventById(numericId);

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

    const sidebarEvent = {
        id: data.id.toString(),
        name: data.title,
        date: data.event_start_at || '',
        status: status
    };

    return <OrderForm eventId={numericId.toString()} eventSlug={slug} formId={formId} />;
}
