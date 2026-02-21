
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import EventsSidebar from "@/components/admin/EventsSidebar";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions/events";

export default async function EventLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;

    if (!eventId) return notFound();

    const id = parseInt(eventId);
    if (isNaN(id)) return notFound();

    const data = await getEventById(id);

    if (!data) return notFound();

    // Derive status from is_published and dates
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
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                {/* Main Navigation Sidebar */}
                <Sidebar activePage="events" disableExpand={true} />

                {/* Event Specific Sidebar */}
                <div className="ml-20 hidden lg:block h-full flex-shrink-0">
                    <EventsSidebar event={sidebarEvent} />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth [scrollbar-gutter:stable]">
                    {children}
                </main>
            </div>
        </div>
    );
}
