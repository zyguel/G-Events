import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions/events";
import { getOrderFormById } from "@/lib/actions/orderForm";
import OrderForm from "@/components/admin/OrderForm";

export default async function EditOrderFormPage({ 
    params 
}: { 
    params: Promise<{ eventId: string; formId: string }> 
}) {
    const { eventId, formId } = await params;

    // Validate params
    if (!eventId || eventId === 'undefined' || !formId || formId === 'undefined') {
        console.error('Invalid params:', { eventId, formId });
        return notFound();
    }

    const eventIdNum = parseInt(eventId);
    const formIdNum = parseInt(formId);
    if (isNaN(eventIdNum) || isNaN(formIdNum)) return notFound();

    // Verify event exists
    const eventData = await getEventById(eventIdNum);
    if (!eventData) {
        console.error('Event not found for eventId:', eventId);
        return notFound();
    }

    // Verify form exists and belongs to this event
    const formResult = await getOrderFormById(formIdNum);
    if (!formResult.data || formResult.data.event_id !== eventIdNum) {
        console.error('Form not found or does not belong to this event');
        return notFound();
    }

    const formData = formResult.data;

    // Derive event status
    const now = new Date();
    const startDate = eventData.event_start_at ? new Date(eventData.event_start_at) : null;
    const endDate = eventData.event_end_at ? new Date(eventData.event_end_at) : null;

    let status: "Draft" | "Completed" | "Ongoing" | "Published" | "Not Yet Published" | "Not Started" | "Cancelled" = 'Draft';
    if (eventData.is_published) {
        if (endDate && endDate < now) {
            status = 'Completed';
        } else if (startDate && startDate <= now && endDate && endDate >= now) {
            status = 'Ongoing';
        } else {
            status = 'Published';
        }
    }

    const sidebarEvent = {
        id: eventData.id.toString(),
        name: eventData.title,
        date: eventData.event_start_at || '',
        status: status
    };

    return (
        <div className="flex flex-col h-screen text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth [scrollbar-gutter:stable]">
                <OrderForm 
                    eventId={eventId} 
                    formId={formId}
                    initialTitle={formData.title || "Order Form"}
                    initialDescription={formData.description || ""}
                />
            </main>
        </div>
    );
}
