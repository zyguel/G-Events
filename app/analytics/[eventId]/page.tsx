import StatCard from "@/components/StatCard";
import DashboardTabs from "@/components/DashboardTabs";
import EventSelector from "@/components/EventSelector";
import ExportButton from "@/components/ExportButton";
import { Filter, Calendar } from "lucide-react";
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isAggregated ? "Analytics" : `${data.name} Analytics`}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {isAggregated
                            ? "Track and analyze your event performance metrics"
                            : `ID: ${data.id} • Status: ${data.status}`
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Event Selector Dropdown */}
                    <EventSelector events={allEvents} currentEventId={eventId} />

                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Calendar size={16} />
                        {data.date}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Filter size={16} />
                        Filter
                    </button>
                    <ExportButton data={data} />
                </div>
            </div>

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
    );
}
