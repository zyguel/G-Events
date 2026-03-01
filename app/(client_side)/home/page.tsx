"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import ClientHeader from '@/components/client/ClientHeader';
import ClientSidebar from '@/components/client/ClientSidebar';
import { getEvents } from '@/lib/actions/events';
import { buildEventSlug } from '@/lib/slug';
import Link from 'next/link';
import { Calendar, MapPin, ChevronRight, Clock } from 'lucide-react';

export default function ClientDashboardPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState<string>('Guest');

    useEffect(() => {
        // Simulate fetching the authenticated user's name
        const fetchUser = async () => {
            // In a real app, this would be await supabase.auth.getUser()
            setTimeout(() => {
                setUserName("Karylle Bernate");
            }, 500);
        };
        fetchUser();

        const loadEvents = async () => {
            try {
                // Fetch published events
                const data = await getEvents();

                const now = new Date();

                // Filter and map events
                const mappedFilteredEvents = data
                    .filter((e: any) => e.is_published)
                    .map((e: any) => {
                        const startDate = e.event_start_at ? new Date(e.event_start_at) : null;
                        const endDate = e.event_end_at ? new Date(e.event_end_at) : null;

                        let statusText = "Upcoming";
                        let statusColor = "bg-gray-400";

                        // Using logic to mock the visual "green dot" or "gray dot"
                        // as requested in the screenshot

                        return {
                            id: e.id,
                            title: e.title,
                            location: e.location || 'Seda Ayala Center Cebu',
                            date: startDate ? startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD',
                            time: (startDate && endDate) ?
                                `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}` :
                                '2:00 PM - 8:00 PM PST',
                            status: statusText,
                            statusColor: statusColor,
                            imageUrl: e.settings?.banner_url || '/placeholder-event.png'
                        };
                    });

                setEvents(mappedFilteredEvents);
            } catch (error) {
                console.error("Error loading events:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadEvents();
    }, []);

    // Get first name for greeting
    const firstName = userName.split(' ')[0];

    return (
        <div className="flex flex-col h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 relative overflow-hidden">
            {/* Ambient Background Glows for Modern Aesthetic */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-400/20 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <ClientHeader />

            <div className="flex flex-1 overflow-hidden z-10">
                <ClientSidebar activePage="dashboard" />

                <main className="flex-1 ml-20 overflow-y-auto w-full">
                    <div className="max-w-6xl mx-auto p-8 md:p-12 lg:p-16">

                        {/* Greeting Section */}
                        <div className="mb-14 relative group animate-fade-in-up">
                            <h1 className="text-[28px] md:text-[34px] font-extrabold text-[#1e293b] dark:text-white tracking-tight leading-tight mb-3 transition-all duration-500">
                                Hey <span className="text-blue-600 dark:text-blue-400">{firstName}</span>! <br className="md:hidden" /> Here's What Awaits You
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-[15px] mt-2 max-w-2xl">
                                Discover and manage your upcoming extraordinary events with real-time updates.
                            </p>
                            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-6 group-hover:w-32 transition-all duration-500"></div>
                        </div>

                        {/* Events List */}
                        {isLoading ? (
                            <div className="space-y-8">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white/70 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-6 flex flex-col md:flex-row gap-8 shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                                        <div className="w-full md:w-[320px] h-[200px] bg-gray-200 dark:bg-gray-700/50 rounded-2xl"></div>
                                        <div className="flex-1 space-y-5 py-4">
                                            <div className="h-10 bg-gray-200 dark:bg-gray-700/50 rounded-lg w-3/4"></div>
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700/50 rounded-md w-1/2"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded-md w-1/3 mt-4"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded-md w-1/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-20 px-6 bg-white/60 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
                                <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                    <Calendar size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No upcoming events</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">It looks like there are no published events right now. Check back later for exciting opportunities!</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                                {events.map((event, index) => (
                                    <div
                                        key={event.id}
                                        className="group relative bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-sm rounded-[32px] p-5 md:p-6 flex flex-col md:flex-row gap-6 lg:gap-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 dark:border-gray-800/80 transition-all duration-300"
                                    >
                                        {/* Event Image Banner (Mockup Style) */}
                                        <div className="w-full md:w-[280px] h-[180px] bg-[#161a2b] rounded-2xl overflow-hidden relative flex-shrink-0 shadow-sm transition-shadow duration-300 flex items-center justify-center">
                                            {event.imageUrl !== '/placeholder-event.png' ? (
                                                <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                                            ) : (
                                                <div className="text-6xl font-black text-gray-300 opacity-90">{event.title.substring(0, 1)}</div>
                                            )}
                                        </div>

                                        {/* Event Details */}
                                        <div className="flex-1 flex flex-col justify-between py-1 relative">
                                            <div>
                                                <h2 className="text-[26px] md:text-[30px] font-extrabold text-[#0f172a] dark:text-white mb-3 tracking-tight">
                                                    {event.title}
                                                </h2>

                                                <div className="flex flex-col gap-3 text-gray-600 dark:text-gray-400 text-[14px] font-medium">
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 w-fit px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-1 z-10 relative">
                                                        <MapPin size={16} className="text-indigo-500 dark:text-indigo-400" />
                                                        <span>{event.location}</span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
                                                            <Calendar size={14} className="text-blue-500 dark:text-blue-400" />
                                                        </div>
                                                        <span className="text-gray-800 dark:text-gray-200">{event.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/30">
                                                            <Clock size={14} className="text-indigo-500 dark:text-indigo-400" />
                                                        </div>
                                                        <span>{event.time}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-5 relative z-10 w-full">
                                                {/* Status Indicator */}
                                                <div className="flex items-center gap-2.5 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm w-fit h-fit">
                                                    <span className={`inline-flex rounded-full h-2.5 w-2.5 ${index % 2 === 0 ? 'bg-[#00D05C]' : 'bg-gray-400'}`}></span>
                                                    <span className="text-[13px] font-bold text-[#475569] dark:text-gray-300">
                                                        {index % 2 === 0 ? 'Pre-registration has started' : 'Full - Waitlist Available'}
                                                    </span>
                                                </div>

                                                {/* Button placed to bottom right */}
                                                <Link
                                                    href={`/events/${buildEventSlug(event.title, event.id)}`}
                                                    className="px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white text-[14px] font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-w-[140px]"
                                                >
                                                    Check Event
                                                    <ChevronRight size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
