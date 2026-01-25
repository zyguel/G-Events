import { notFound } from "next/navigation";
import { getEventData } from "@/lib/api";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AnalyticsSidebar from "@/components/AnalyticsSidebar";
import { Calendar, MapPin, Users, Ticket, DollarSign } from "lucide-react";

export default async function EventOverviewPage({ params }: { params: Promise<{ eventId: string }> }) {
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
                    <AnalyticsSidebar event={sidebarEvent} activePage="overview" />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 ml-20 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto space-y-8">

                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{data.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5 text-sm">
                                        <Calendar size={16} />
                                        {data.date}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-sm">
                                        <MapPin size={16} />
                                        USC MR Hall
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${data.status === 'Ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        data.status === 'Completed' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {data.status === 'Ongoing' ? 'Not Yet Published' : data.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
                                    <Users size={20} />
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Registrations</span>
                                </div>
                                <p className="text-2xl font-bold">{data.stats.registrations.toLocaleString()}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-2">
                                    <DollarSign size={20} />
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</span>
                                </div>
                                <p className="text-2xl font-bold">${data.stats.revenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-2">
                                    <Ticket size={20} />
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tickets Available</span>
                                </div>
                                <p className="text-2xl font-bold">{data.stats.totalEvents * 10}</p> {/* Placeholder math */}
                            </div>
                        </div>

                        {/* Overview Details Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-semibold">Event Description</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                    This is the default overview page for <strong>{data.name}</strong>. Here you can find the primary details of your event, track initial registration metrics, and navigate to technical configurations using the sidebar.
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Use the sidebar navigation on the left to set up tickets, configure the registration form, and manage your attendee list. You can also view more detailed performance analytics under the reporting section.
                                </p>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
