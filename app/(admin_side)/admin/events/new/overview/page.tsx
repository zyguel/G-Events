import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import EventsSidebar from "@/components/admin/EventsSidebar";
import EventOverview from "@/components/admin/EventOverview";

export const metadata = {
    title: 'New Event',
};

export default function NewEventOverviewPage() {
    // Empty state data for a new event
    const newEventData = {
        id: "new",
        name: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        description: "",
        theme: "",
        objectives: [],
        agenda: [],
        bannerUrl: "",
        status: "Draft"
    };

    const sidebarEvent = {
        id: "new",
        name: "New Event",
        date: "Date TBD",
        status: "Draft" as const
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                {/* Main Navigation Sidebar */}
                <Sidebar activePage="events" disableExpand={true} />

                {/* Event Specific Sidebar */}
                <div className="lg:ml-20 hidden lg:block h-full flex-shrink-0">
                    <EventsSidebar event={sidebarEvent} />
                </div>

                {/* Main Content Area — ml-14 below lg: fixed primary Sidebar; EventsSidebar hidden on small screens */}
                <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth lg:ml-0">
                    <EventOverview initialData={newEventData} />
                </main>
            </div>
        </div>
    );
}
