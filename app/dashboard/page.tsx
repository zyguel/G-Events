"use client";

import React from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { Calendar, Users, Clock, ChevronRight, Bell } from 'lucide-react';

export default function DashboardPage() {
    // Mock data for upcoming events
    const upcomingEvents = [
        { id: 1, name: "DevFest Cebu 2025", date: "November 20, 2025", registrations: 350, status: "Upcoming" },
        { id: 2, name: "Google I/O Extended", date: "July 20, 2025", registrations: 200, status: "Draft" },
        { id: 3, name: "Women Techmakers 2025", date: "March 8, 2025", registrations: 150, status: "Completed" },
    ];

    // Mock recent activity
    const recentActivity = [
        { id: 1, action: "New registration", user: "Juan Dela Cruz", event: "DevFest Cebu 2025", time: "2 mins ago" },
        { id: 2, action: "Ticket purchased", user: "Maria Santos", event: "DevFest Cebu 2025", time: "15 mins ago" },
        { id: 3, action: "Event updated", user: "Admin", event: "Google I/O Extended", time: "1 hour ago" },
        { id: 4, action: "New registration", user: "Jose Rizal", event: "DevFest Cebu 2025", time: "2 hours ago" },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="dashboard" />

                <main className="flex-1 ml-20 overflow-y-auto p-8">
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
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#3D518C] text-white rounded-xl text-sm font-medium hover:bg-[#2d3d6b] transition-all shadow-sm">
                                    <span>+ Create Event</span>
                                </button>
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Events"
                                value="24"
                                growth="12%"
                                trend="up"
                            />
                            <StatCard
                                title="Active Registrations"
                                value="1,239"
                                growth="8%"
                                trend="up"
                            />
                            <StatCard
                                title="This Month Revenue"
                                value="$45,620"
                                growth="15%"
                                trend="up"
                            />
                            <StatCard
                                title="Avg. Attendance Rate"
                                value="87%"
                                growth="3%"
                                trend="up"
                            />
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
                                    <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1">
                                        View All <ChevronRight size={16} />
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {upcomingEvents.map((event) => (
                                        <div key={event.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md">
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
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${event.status === 'Upcoming' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                        event.status === 'Draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                                                            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                        }`}>
                                                        {event.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
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
                                    {recentActivity.map((activity) => (
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

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-indigo-100 text-sm font-medium">Next Event</p>
                                        <h3 className="text-xl font-bold mt-1">DevFest Cebu 2025</h3>
                                        <p className="text-indigo-200 text-sm mt-2">November 20, 2025</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <Calendar size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-emerald-100 text-sm font-medium">Today's Registrations</p>
                                        <h3 className="text-xl font-bold mt-1">47 new</h3>
                                        <p className="text-emerald-200 text-sm mt-2">+12% from yesterday</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <Users size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-amber-100 text-sm font-medium">Pending Reviews</p>
                                        <h3 className="text-xl font-bold mt-1">23 applications</h3>
                                        <p className="text-amber-200 text-sm mt-2">Needs attention</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <Clock size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
