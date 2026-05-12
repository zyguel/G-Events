"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import ClientHeader from '@/components/client/ClientHeader';
import ClientMobileNav from '@/components/client/ClientMobileNav';
import { getPublishedEvents } from '@/lib/actions/events';
import { buildEventSlug } from '@/lib/slug';
import Link from 'next/link';
import { Calendar, MapPin, ChevronRight, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

export default function ClientDashboardPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState<string>('Guest');

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            const metadataName = data.user?.user_metadata?.name as string | undefined;
            setUserName(metadataName || data.user?.email || 'Guest');
        };
        fetchUser();

        const loadEvents = async () => {
            try {
                // Fetch published events (already filtered server-side)
                const data = await getPublishedEvents();

                const now = new Date();

                // Map events
                const mappedFilteredEvents = data
                    .map((e: any) => {
                        const startDate = e.event_start_at ? new Date(e.event_start_at) : null;
                        const endDate = e.event_end_at ? new Date(e.event_end_at) : null;
                        const registrationOpenAt = e.registration_open_at ? new Date(e.registration_open_at) : null;
                        const registrationCloseAt = e.registration_close_at ? new Date(e.registration_close_at) : null;

                        let statusText = "Upcoming";
                        let statusColor = "bg-gray-400";

                        if (endDate && endDate < now) {
                            statusText = "Completed";
                            statusColor = "bg-gray-400";
                        } else if (startDate && endDate && startDate <= now && endDate >= now) {
                            statusText = "Ongoing";
                            statusColor = "bg-[#00D05C]";
                        } else if (
                            e.is_published
                            && registrationOpenAt
                            && registrationOpenAt <= now
                            && (!registrationCloseAt || registrationCloseAt >= now)
                        ) {
                            statusText = "Registration Open";
                            statusColor = "bg-[#00D05C]";
                        }

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
                            imageUrl: e.banner_image || e.settings?.banner_url || '/placeholder-event.png'
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
            <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-600/10" />
            <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] h-[560px] w-[560px] rounded-full bg-indigo-400/20 blur-[120px] dark:bg-purple-600/10" />

            <ClientHeader />

            <div className="flex flex-1 overflow-hidden z-10">

                <main className="flex-1 overflow-y-auto w-full">
                    <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-24 md:p-12 md:pb-12 lg:p-16">

                        {/* Greeting Section */}
                        <div className="group relative mb-10 animate-fade-in-up sm:mb-14">
                            <h1 className="mb-3 text-pretty text-[26px] font-extrabold leading-tight tracking-tight text-[#1e293b] transition-all duration-500 dark:text-white sm:text-[28px] md:text-[34px]">
                                Hey <span className="text-blue-600 dark:text-blue-400">{firstName}</span>! <br className="sm:hidden" /> Here&apos;s what awaits you
                            </h1>
                            <p className="mt-2 max-w-2xl text-[15px] font-medium text-gray-500 dark:text-gray-400">
                                Discover and manage your upcoming extraordinary events with real-time updates.
                            </p>
                            <div className="h-1 w-24 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full mt-6 group-hover:w-32 transition-all duration-500"></div>
                        </div>

                        {/* Events List */}
                        {isLoading ? (
                            <div className="space-y-8">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white/70 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-6 flex flex-col md:flex-row gap-8 shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                                        <div className="h-44 w-full rounded-2xl bg-gray-200 dark:bg-gray-700/50 md:h-52 md:w-[320px]"></div>
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
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="group relative bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-sm rounded-4xl p-5 md:p-6 flex flex-col md:flex-row gap-6 lg:gap-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 dark:border-gray-800/80 transition-all duration-300"
                                    >
                                        {/* Event Image Banner (Mockup Style) */}
<<<<<<< Updated upstream
                                        <div className="relative flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm transition-shadow duration-300 sm:h-48 md:h-52 md:w-72">
=======
                                        <div className="w-full md:w-70 h-45 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl overflow-hidden relative shrink-0 shadow-sm transition-shadow duration-300 flex items-center justify-center">
>>>>>>> Stashed changes
                                            {event.imageUrl !== '/placeholder-event.png' ? (
                                                <Image src={event.imageUrl} alt={event.title} fill sizes="(max-width: 768px) 100vw, 288px" className="object-cover" priority />
                                            ) : (
                                                <div className="text-6xl font-black text-white text-opacity-90">{event.title.substring(0, 1)}</div>
                                            )}
                                        </div>

                                        {/* Event Details */}
                                        <div className="flex-1 flex flex-col justify-between py-1 relative">
                                            <div>
                                                <h2 className="mb-3 text-pretty text-[22px] font-extrabold tracking-tight text-[#0f172a] dark:text-white sm:text-[26px] md:text-[30px]">
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

                                            <div className="relative z-10 mt-4 flex w-full flex-col justify-between gap-4 md:flex-row md:items-end md:gap-5">
                                                {/* Status Indicator */}
                                                <div className="flex items-center gap-2.5 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm w-fit h-fit">
                                                    <span className={`inline-flex rounded-full h-2.5 w-2.5 ${event.statusColor}`}></span>
                                                    <span className="text-[13px] font-bold text-[#475569] dark:text-gray-300">
                                                        {event.status}
                                                    </span>
                                                </div>

                                                {/* Button placed to bottom right */}
                                                <Link
                                                    href={`/events/${buildEventSlug(event.title, event.id)}`}
                                                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-6 py-3 text-[14px] font-semibold text-white shadow-md transition-all hover:bg-[#1e293b] md:w-auto md:min-w-[148px] touch-manipulation"
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

            <ClientMobileNav activePage="dashboard" />
        </div>
    );
}
