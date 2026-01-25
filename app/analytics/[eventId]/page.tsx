import StatCard from "@/components/StatCard";
import DashboardTabs from "@/components/DashboardTabs";
import ExportButton from "@/components/ExportButton";
import AnalyticsSidebar from "@/components/AnalyticsSidebar";
import AnalyticsHeader from "@/components/AnalyticsHeader";
import Sidebar from "@/components/Sidebar";
import { getEventData, getAllEvents, getAggregatedData } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function AnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // Fetch all events for the selector
    const allEvents = await getAllEvents();

    // Fetch data based on whether it's "all" or a specific event
    const data = eventId === "all"
        ? await getAggregatedData()
        : await getEventData(eventId);

    if (!data) {
        return notFound();
    }

    const isAggregated = eventId === "all";

    // Create event object for the sidebar
    const sidebarEvent = {
        id: data.id,
        name: data.name,
        date: data.date,
        status: data.status
    };

    return (
        <>
            {/* Main Navigation Sidebar - disable expansion when analytics sidebar is shown */}
            <Sidebar activePage="analytics" disableExpand={!isAggregated} />

            {/* Analytics Sidebar - only show for specific events, positioned after icon sidebar */}
            {!isAggregated && (
                <div className="ml-20 hidden lg:block">
                    <AnalyticsSidebar event={sidebarEvent} />
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 ml-20 overflow-y-auto p-8">
                <div className="space-y-6 max-w-7xl mx-auto">

                    {/* Header Section */}
                    {isAggregated ? (
                        <AnalyticsHeader
                            events={allEvents}
                            currentEventId={eventId}
                            data={data}
                        />
                    ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {data.name} Analytics
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    ID: {data.id} • Status: {data.status}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <ExportButton data={data} />
                            </div>
                        </div>
                    )}

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Events"
                            value={data.stats.totalEvents.toString()}
                            growth="12%"
                            trend="up"
                        />
                        <StatCard
                            title="Total Registrations"
                            value={data.stats.registrations.toLocaleString()}
                            growth="8%"
                            trend="up"
                        />
                        <StatCard
                            title="Revenue"
                            value={`$${data.stats.revenue.toLocaleString()}`}
                            growth="15%"
                            trend="up"
                        />
                        <StatCard
                            title="Average Satisfaction"
                            value={`${data.stats.satisfaction}/5`}
                            growth="0.2"
                            trend="up"
                        />
                    </div>

                    {/* Tabs System */}
                    <DashboardTabs data={data} />

                </div>
            </main>
        </>
    );
}
