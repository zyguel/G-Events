import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions/events";
import { getOrdersByEventId } from "@/lib/actions/orders";
import ManageOrdersClient from "./ManageOrdersClient";

export const metadata = {
    title: 'Orders',
};

export default async function ManageOrdersPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // eventId is a slug like "my-event-123"
    const slug = eventId;
    const idPart = slug.split("-").pop() ?? "";
    const id = parseInt(idPart, 10);
    if (isNaN(id)) return notFound();

    const data = await getEventById(id);

    if (!data) {
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

    const initialOrders = await getOrdersByEventId(id);

    return <ManageOrdersClient event={event} initialOrders={initialOrders as any} />;
}
