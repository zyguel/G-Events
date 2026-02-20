import { notFound } from "next/navigation";
import { getEventById } from "@/app/(admin_side)/backend/events";
import OrderConfirmation from "@/components/admin/OrderConfirmation";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    const id = parseInt(eventId);
    if (isNaN(id)) return notFound();

    const data = await getEventById(id);

    if (!data) {
        return notFound();
    }



    return (
        <div className="flex flex-col h-screen text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth">
                <OrderConfirmation eventId={eventId} />
            </main>
        </div>
    );
}
