import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import EventsSidebar from "@/components/admin/EventsSidebar";
import EventOverview from "@/components/admin/EventOverview";

export default function NewEventOverviewPage() {
    // Empty state data for a new event
    const newEventData = {
        id: "new",
        name: "",
        subtitle: "",
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
                <div className="ml-20 hidden lg:block h-full flex-shrink-0">
                    <EventsSidebar event={sidebarEvent} activePage="overview" />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth">
                    <EventOverview initialData={newEventData} />
                </main>
            </div>
        </div>
    );
}
