"use client";

import React from 'react';
import Link from 'next/link';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { Calendar, Users, Clock, ChevronRight, Bell } from 'lucide-react';

import { getEvents } from '@/lib/actions/events';

export default function DashboardPage() {
    // 1. Static Initial Data
    const initialRecentActivity = [
        { id: "1", action: "New registration", user: "Juan Dela Cruz", event: "DevFest Cebu 2025", time: "2 mins ago" },
        { id: "2", action: "Ticket purchased", user: "Maria Santos", event: "DevFest Cebu 2025", time: "15 mins ago" },
        { id: "3", action: "Event updated", user: "Admin", event: "Google I/O Extended", time: "1 hour ago" },
        { id: "4", action: "New registration", user: "Juan", event: "DevFest Cebu 2025", time: "2 hours ago" },
    ];

    // 2. State
    const [dashboardEvents, setDashboardEvents] = React.useState<any[]>([]);
    const [activities, setActivities] = React.useState(initialRecentActivity);
    const [nextEvent, setNextEvent] = React.useState<any>(null);

    // 3. Load from Supabase
    React.useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getEvents();

                // Map to Dashboard format
                const mappedEvents = data.map((e: any) => {
                    const now = new Date();
                    const startDate = e.event_start_at ? new Date(e.event_start_at) : null;
                    const endDate = e.event_end_at ? new Date(e.event_end_at) : null;

                    let status = 'Draft';

                    if (e.is_published) {
                        if (endDate && endDate < now) {
                            status = 'Completed';
                        } else if (startDate && startDate <= now && endDate && endDate >= now) {
                            status = 'Live';
                        } else {
                            status = 'Upcoming';
                        }
                    }

                    return {
                        id: e.id,
                        name: e.title,
                        date: e.event_start_at ? new Date(e.event_start_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD',
                        registrations: 0, // Mock
                        status: status,
                        // Helper for sorting/filtering
                        rawDate: e.event_start_at
                    };
                });

                // Filter for Upcoming/Published
                const upcoming = mappedEvents.filter((e: any) =>
                    ['Upcoming', 'Live'].includes(e.status) ||
                    (e.status === 'Draft' && new Date(e.rawDate) > new Date()) // include future drafts if desired, or just strict status
                );

                // Sort by date ascending for "Next Event"
                upcoming.sort((a: any, b: any) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

                setDashboardEvents(upcoming);

                if (upcoming.length > 0) {
                    setNextEvent(upcoming[0]);
                }

                // For activities, we could mock based on new events if we wanted, but leaving static for now as per plan
                // unless we want to show "Event Created" activities
                const recentEvents = [...mappedEvents].sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()).slice(0, 3);
                const newActivities = recentEvents.map((e: any, index: number) => ({
                    id: `new-${index}`,
                    action: "Event Created",
                    user: "System",
                    event: e.name,
                    time: "Recently"
                }));
                setActivities([...newActivities, ...initialRecentActivity]);

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            }
        };

        loadData();
    }, []);

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
                                    Welcome back! Here's an overview of your events.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                                    <Calendar size={16} />
                                    This Month
                                </button>
                                <Link href="/events/new/overview" className="flex items-center gap-2 px-4 py-2.5 bg-[#3D518C] text-white rounded-xl text-sm font-medium hover:bg-[#2d3d6b] transition-all shadow-sm">
                                    <span>+ Create Event</span>
                                </Link>
                            </div>
                        </div>

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <Link href={`/events/${nextEvent?.id}/overview`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-indigo-100 text-sm font-medium">Next Event</p>
                                            <h3 className="text-xl font-bold mt-1 truncate max-w-[200px]">{nextEvent?.name || "No Upcoming Events"}</h3>
                                            <p className="text-indigo-200 text-sm mt-2">{nextEvent?.date || "--"}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                            <Calendar size={24} />
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-emerald-100 text-sm font-medium">Today's Registrations</p>
                                        <h3 className="text-xl font-bold mt-1">0 new</h3>
                                        <p className="text-emerald-200 text-sm mt-2">No data available</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <Users size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-rose-100 text-sm font-medium">Pending Reviews</p>
                                        <h3 className="text-xl font-bold mt-1">0 applications</h3>
                                        <p className="text-rose-200 text-sm mt-2">All caught up!</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <Clock size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Upcoming Events */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your scheduled events</p>
                                    </div>
                                    <Link href="/events" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1">
                                        View All <ChevronRight size={16} />
                                    </Link>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {dashboardEvents.slice(0, 5).map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.id}/overview`}
                                            className="block p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {event.name.charAt(0)}
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
                                                    <span className={`inline-flex items-center justify-center min-w-[80px] px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${(event.status === 'Upcoming' || event.status === 'Published') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                        (event.status === 'Completed' || event.status === 'Live') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {event.status === 'Published' ? 'Upcoming' : event.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest updates</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    {activities.map((activity: any) => (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
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
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
