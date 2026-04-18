
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import EventsSidebar from "@/components/admin/EventsSidebar";
import CompactEventMobileBar from "@/components/admin/CompactEventMobileBar";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions/events";
import { EventDataProvider } from "./EventDataContext";

export default async function EventLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;

    // Treat the route segment as a slug like "event-name-123"
    if (!eventId) return notFound();

    const slug = eventId;
    const idPart = slug.split("-").pop() ?? "";
    const numericId = parseInt(idPart, 10);
    if (isNaN(numericId)) return notFound();

    const data = await getEventById(numericId);

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
        status: status,
        allowWaitlist: data.allow_waitlist ?? false,
        allowBreakouts: data.allow_breakout_sessions ?? false
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <CompactEventMobileBar eventTitle={data.title} eventId={String(data.id)} />

            <div className="flex flex-1 overflow-hidden">
                {/* Main Navigation Sidebar */}
                <Sidebar activePage="events" disableExpand={true} />

                {/* Event Specific Sidebar */}
                <div className="ml-14 hidden lg:block h-full shrink-0">
                    <EventsSidebar event={sidebarEvent} />
                </div>

                {/* Main Content Area — ml-14 below lg: primary Sidebar is fixed; EventsSidebar is hidden so content must clear the rail */}
                <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth [scrollbar-gutter:stable] ml-14 lg:ml-0">
                    <EventDataProvider initialEvent={data}>
                        {children}
                    </EventDataProvider>
                </main>
            </div>
        </div>
    );
}
