"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, FileText, BarChart3, Ticket, ClipboardList, CheckCircle, Send, Users, Mail, UserCheck, Award, Clock, Presentation } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EventSummary } from "@/lib/types";
import { buildEventSlug } from "@/lib/slug";
import { usePermissions } from "@/contexts/PermissionContext";

interface EventsSidebarProps {
    event: EventSummary;
}

export default function EventsSidebar({ event }: EventsSidebarProps) {
    const pathname = usePathname();
    const { hasPermission, isAdmin, role, loading } = usePermissions();
    const permResolved = !loading && role !== '';
    const [eventName, setEventName] = useState(event?.name || '');
    const [eventDate, setEventDate] = useState(event?.date || '');
    const [eventStatus, setEventStatus] = useState(event?.status || 'Draft');

    useEffect(() => {
        if (event?.id && event.id.startsWith('evt-')) {
            try {
                const storedEvents = JSON.parse(localStorage.getItem('mock_created_events') || '[]');
                const localEvent = storedEvents.find((e: { id: string; name: string; date: string; status: string }) => e.id === event.id);
                if (localEvent) {
                    setEventName(localEvent.name);
                    setEventDate(localEvent.date);
                    setEventStatus(localEvent.status);
                }
            } catch (e) {
                console.error("Error loading local event data", e);
            }
        } else {
            if (event?.name) setEventName(event.name);
            if (event?.date) setEventDate(event.date);
            if (event?.status) setEventStatus(event.status);
        }
    }, [event?.id, event?.name, event?.date, event?.status]);

    // Safety check: validate event ID
    if (!event?.id || event.id === 'undefined') {
        // Only warn in development or if strict
        // console.warn('EventsSidebar received invalid event ID:', event?.id);
        return (
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors duration-300">
                <div className="p-4 flex items-center justify-center h-full">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Invalid event data</p>
                    </div>
                </div>
            </aside>
        );
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                // timeZone: 'UTC' // Optional: keep if you want UTC, or remove for local time
            }).format(date);
        }
        return dateStr;
    };

    const slug = buildEventSlug(eventName || event.name, event.id);

    // Helper to check if link is active
    const isActive = (path: string) => {
        if (path === 'overview') {
            // Match slug-based or ID-based URLs for backwards compatibility
            const idBase = `/events/${event.id}`;
            const slugBase = `/events/${slug}`;
            return (
                pathname === idBase ||
                pathname === slugBase ||
                pathname.endsWith(`${idBase}/overview`) ||
                pathname.endsWith(`${slugBase}/overview`)
            );
        }
        return pathname.includes(`/${path}`);
    };

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors duration-300">

            {/* 1. Event Context Card - Fixed height with truncation */}
            <div className="p-4 flex-shrink-0">
                <div className="bg-gradient-to-br from-[#3D518C] to-[#091540] rounded-lg p-4 text-white shadow-lg relative overflow-hidden h-[120px]">
                    <div className="relative z-10">
                        <h2 className="font-bold text-lg leading-tight line-clamp-2" title={eventName}>{eventName}</h2>
                        <p className="text-xs text-indigo-100 mt-1">{formatDate(eventDate)}</p>
                        <div className={`mt-2 inline-block px-2 py-1 rounded text-[10px] font-semibold ${eventStatus === "Ongoing"
                            ? "bg-green-500/30 text-green-100"
                            : "bg-gray-500/30 text-gray-100"
                            }`}>
                            ● {eventStatus === "Ongoing" ? "Live" : eventStatus}
                        </div>
                    </div>
                    {/* Decorative circle */}
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
                </div>
            </div>

            {/* 2. Navigation List */}
            <div className="flex-1 overflow-y-auto py-2">
                <nav className="px-4 space-y-5">

                    {/* Section: Event Page */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Event Page</h3>
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href={event.id === 'new' ? '#' : `/events/${slug}/overview`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${isActive('overview')
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <LayoutDashboard size={16} />
                                    Overview
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Section: Order Options */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Order Options</h3>
                        <ul className="space-y-1">
                            {['tickets', 'orderform', 'orderconfirmation', 'publish'].map((page) => (
                                <li key={page} className={event.id === 'new' ? 'opacity-50 pointer-events-none' : ''}>
                                    <Link
                                        href={event.id === 'new' ? '#' : `/events/${slug}/${page}`}
                                        className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${isActive(page)
                                            ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            } ${event.id === 'new' ? 'cursor-not-allowed' : ''}`}>
                                        {page === 'tickets' && <Ticket size={16} />}
                                        {page === 'orderform' && <ClipboardList size={16} />}
                                        {page === 'orderconfirmation' && <CheckCircle size={16} />}
                                        {page === 'publish' && <Send size={16} />}
                                        {page === 'tickets' && 'Tickets'}
                                        {page === 'orderform' && 'Order Form'}
                                        {page === 'orderconfirmation' && 'Order Confirmation'}
                                        {page === 'publish' && 'Publish Event'}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Section: Manage Attendees */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Manage Attendees</h3>
                        <ul className="space-y-1">
                            {[
                                { page: 'orders', icon: <Users size={16} />, label: 'Manage Orders', perm: 'View List of Attendees' },
                                { page: 'email-attendees', icon: <Mail size={16} />, label: 'Email to Attendees', perm: 'Send Emails' },
                                { page: 'checkin', icon: <UserCheck size={16} />, label: 'Check-In', perm: 'Check In Attendees' },
                                { page: 'certificates', icon: <Award size={16} />, label: 'Certificates', perm: 'View E-Certificates' },
                                { page: 'waitlist', icon: <Clock size={16} />, label: 'Manage Waitlist', perm: 'Manage Waitlist' },
                                { page: 'breakouts', icon: <Presentation size={16} />, label: 'Manage Breakout Sessions', perm: 'Create Breakout Sessions' },
                            ].map(({ page, icon, label, perm }) => {
                                // While loading, show all (fail-open). After load, check permission.
                                if (permResolved && !isAdmin && !hasPermission(perm)) return null;
                                return (
                                    <li key={page} className={event.id === 'new' ? 'opacity-50 pointer-events-none' : ''}>
                                        <Link
                                            href={event.id === 'new' ? '#' : `/events/${slug}/${page}`}
                                            className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${isActive(page) ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                } ${event.id === 'new' ? 'cursor-not-allowed' : ''}`}>
                                            {icon}{label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Section: Reporting */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Reporting</h3>
                        <ul className="space-y-1">
                            {[
                                { page: 'reports', icon: <FileText size={16} />, label: 'Event Reports', perm: 'View Reports' },
                                { page: 'analytics', icon: <BarChart3 size={16} />, label: 'Analytics', perm: 'View Reports' },
                            ].map(({ page, icon, label, perm }) => {
                                if (permResolved && !isAdmin && !hasPermission(perm)) return null;
                                return (
                                    <li key={page} className={event.id === 'new' ? 'opacity-50 pointer-events-none' : ''}>
                                        <Link
                                            href={event.id === 'new' ? '#' : `/events/${slug}/${page}`}
                                            className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${isActive(page) ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                } ${event.id === 'new' ? 'cursor-not-allowed' : ''}`}>
                                            {icon}{label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                </nav>
            </div>
        </aside>
    );
}
