import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { Calendar, Users, Clock, ChevronRight, Bell } from 'lucide-react';

import { buildEventSlug } from '@/lib/slug';

export interface DashboardEvent {
    id: number;
    name: string;
    date: string;
    registrations: number;
    status: 'Draft' | 'Upcoming' | 'Live' | 'Completed';
    image: string | null;
    rawDate: string | null;
}

export interface DashboardActivity {
    id: string;
    action: string;
    user: string;
    event: string;
    time: string;
}

interface DashboardPageClientProps {
    initialDashboardEvents: DashboardEvent[];
    initialActivities: DashboardActivity[];
    initialNextEvent: DashboardEvent | null;
}

export default function DashboardPageClient({
    initialDashboardEvents,
    initialActivities,
    initialNextEvent,
}: DashboardPageClientProps) {
    const dashboardEvents = initialDashboardEvents;
    const activities = initialActivities;
    const nextEvent = initialNextEvent;
    const isLoading = false;

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="dashboard" />

                <main className="flex-1 ml-20 overflow-y-auto p-4 md:p-8">
                    <div className="space-y-6 max-w-7xl mx-auto">

                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Dashboard
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    Welcome back! Here&apos;s an overview of your events.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                                    <Calendar size={16} />
                                    This Month
                                </button>
                                <Link href="/admin/events/new/overview" className="flex items-center gap-2 px-4 py-2.5 bg-[#3D518C] text-white rounded-xl text-sm font-medium hover:bg-[#2d3d6b] transition-all shadow-sm">
                                    <span>+ Create Event</span>
                                </Link>
                            </div>
                        </div>

                        {/* Quick Stats Row */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl p-6 h-32 animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                    <Link href={nextEvent ? `/admin/events/${buildEventSlug(nextEvent.name, nextEvent.id)}/overview` : '#'}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-indigo-100 text-sm font-medium">Next Event</p>
                                                <h3 className="text-xl font-bold mt-1 truncate max-w-50">{nextEvent?.name || "No Upcoming Events"}</h3>
                                                <p className="text-indigo-200 text-sm mt-2">{nextEvent?.date || "--"}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                <Calendar size={24} />
                                            </div>
                                        </div>
                                    </Link>
                                </div>

                                <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-emerald-100 text-sm font-medium">Today&apos;s Registrations</p>
                                            <h3 className="text-xl font-bold mt-1">0</h3>
                                            <p className="text-emerald-200 text-sm mt-2">No data available</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                            <Users size={24} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-linear-to-br from-rose-500 to-rose-600 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-rose-100 text-sm font-medium">Pending Reviews</p>
                                            <h3 className="text-xl font-bold mt-1">0</h3>
                                            <p className="text-rose-200 text-sm mt-2">All caught up!</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                            <Clock size={24} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Upcoming Events Skeleton */}
                                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <div className="space-y-2">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="p-5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0"></div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
                                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-2">
                                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse ml-auto"></div>
                                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse ml-auto"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Activity Skeleton */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 space-y-2">
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-28 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse"></div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Upcoming Events */}
                                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg self-start">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <div>
                                            <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your scheduled events</p>
                                        </div>
                                        <Link href="/admin/events" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1">
                                            View All <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {dashboardEvents.length === 0 ? (
                                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                                <Calendar size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                                                <p className="text-gray-500 dark:text-gray-400 font-medium">No upcoming events found</p>
                                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Get started by creating your first event!</p>
                                                <Link href="/admin/events/new/overview" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#3D518C] text-white rounded-lg text-sm font-medium hover:bg-[#2d3d6b] transition-all">
                                                    Create Event
                                                </Link>
                                            </div>
                                        ) : (
                                            dashboardEvents.slice(0, 5).map((event) => (
                                                <Link
                                                    key={event.id}
                                                    href={`/admin/events/${buildEventSlug(event.name, event.id)}/overview`}
                                                    className="block p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg relative overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
                                                                {event.image ? (
                                                                    <Image
                                                                        src={event.image}
                                                                        alt={event.name}
                                                                        fill
                                                                        sizes="48px"
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    event.name.charAt(0)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900 dark:text-white">{event.name}</h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                                                    <Calendar size={14} /> {event.date}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.registrations} registered</p>
                                                            <div className="flex justify-end mt-1">
                                                                <span className={`inline-flex items-center justify-center min-w-20 px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'Upcoming' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                                    (event.status === 'Completed' || event.status === 'Live') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                                    }`}>
                                                                    {event.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                        <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest updates</p>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {activities.length > 0 ? (
                                            activities.map((activity) => (
                                                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                        <Bell size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {activity.user} • {activity.event}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{activity.time}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
