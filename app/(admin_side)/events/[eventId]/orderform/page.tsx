import { notFound } from "next/navigation";
import { getEventData } from "@/lib/api";
import OrderForm from "@/components/admin/OrderForm";

export default async function OrderFormPage({ params }: { params: Promise<{ eventId: string }> }) {
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

    const sidebarEvent = {
        id: data.id,
        name: data.name,
        date: data.date,
        status: data.status
    };

    return (
        <div className="flex flex-col h-screen text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth [scrollbar-gutter:stable]">
                <OrderForm eventId={eventId} />
            </main>
        </div>
    );
}
