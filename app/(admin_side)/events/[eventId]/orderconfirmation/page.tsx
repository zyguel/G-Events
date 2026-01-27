import { notFound } from "next/navigation";
import { getEventData } from "@/lib/api";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import EventsSidebar from "@/components/admin/EventsSidebar";
import OrderConfirmation from "@/components/admin/OrderConfirmation";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    const data = await getEventData(eventId);

    if (!data) {
        return notFound();
    }

    const sidebarEvent = {
        id: data.id,
        name: data.name,
        date: data.date,
        status: data.status
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                {/* Main Navigation Sidebar */}
                <Sidebar activePage="events" disableExpand={true} />

                {/* Event Specific Sidebar */}
                <div className="ml-20 hidden lg:block h-full flex-shrink-0">
                    <EventsSidebar event={sidebarEvent} activePage="orderconfirmation" />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth">
                    <OrderConfirmation eventId={eventId} />
                </main>
            </div>
        </div>
    );
}
