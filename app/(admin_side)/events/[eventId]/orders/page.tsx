import { notFound } from "next/navigation";
import { getEventData } from "@/lib/api";
import ManageOrdersClient from "./ManageOrdersClient";

export default async function ManageOrdersPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    const data = await getEventData(eventId);

    if (!data) {
        return notFound();
    }

    const event = {
        id: data.id,
        name: data.name,
        date: data.date,
        status: data.status
    };

    return <ManageOrdersClient event={event} />;
}
