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

    const sidebarEvent = {
        id: data.id.toString(),
        name: data.title,
        date: data.event_start_at || '',
        status: status
    };

    return (
        <div className="flex flex-col h-screen text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth [scrollbar-gutter:stable]">
                <OrderForm eventId={eventId} formId={formId} />
            </main>
        </div>
    );
}
