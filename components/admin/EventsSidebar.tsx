"use client";

import { LayoutDashboard, FileText, BarChart3, Ticket, ClipboardList, CheckCircle, Send, Users, Mail, UserCheck, Award, Clock, Presentation } from "lucide-react";
import Link from "next/link";

interface SidebarEvent {
    id: string;
    name: string;
    date: string;
    status: "Ongoing" | "Completed";
}




interface EventsSidebarProps {
    event: SidebarEvent;
    activePage?: 'overview' | 'analytics' | 'orders' | 'attendees' | 'reports' | 'tickets' | 'orderform' | 'confirmation' | 'orderconfirmation' | 'email-attendees' | 'publish' | 'checkin' | 'certificates' | 'waitlist' | 'breakouts';
}



export default function EventsSidebar({ event, activePage }: EventsSidebarProps) {
    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors duration-300">

            {/* 1. Event Context Card - Fixed height with truncation */}
            <div className="p-4 flex-shrink-0">
                <div className="bg-gradient-to-br from-[#3D518C] to-[#091540] rounded-lg p-4 text-white shadow-lg relative overflow-hidden h-[120px]">
                    <div className="relative z-10">
                        <h2 className="font-bold text-lg leading-tight line-clamp-2" title={event.name}>{event.name}</h2>
                        <p className="text-xs text-indigo-100 mt-1">{event.date}</p>
                        <div className={`mt-2 inline-block px-2 py-1 rounded text-[10px] font-semibold ${event.status === "Ongoing"
                            ? "bg-green-500/30 text-green-100"
                            : "bg-gray-500/30 text-gray-100"
                            }`}>
                            ● {event.status === "Ongoing" ? "Not Yet Published" : event.status}
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
                                    href={`/events/${event.id}/overview`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'overview'
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
                            <li>
                                <Link
                                    href={`/events/${event.id}/tickets`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'tickets'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                    <Ticket size={16} />
                                    Tickets
                                </Link>
                            </li>
                           
                            <li>
                                <Link
                                    href={`/events/${event.id}/orderform`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'orderform'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                    <ClipboardList size={16} />
                                    Order Form
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/events/${event.id}/orderconfirmation`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'orderconfirmation'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                    <CheckCircle size={16} />
                                    Order Confirmation
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/events/${event.id}/publish`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'publish'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Send size={16} />
                                    Publish Event
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Section: Manage Attendees */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Manage Attendees</h3>
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href={`/events/${event.id}/orders`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'orders'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                    <Users size={16} />
                                    Manage Orders
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/events/${event.id}/email-attendees`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'email-attendees'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Mail size={16} />
                                    Email to Attendees
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/events/${event.id}/checkin`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'checkin'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <UserCheck size={16} />
                                    Check-In
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/events/${event.id}/certificates`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'certificates'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Award size={16} />
                                    Certificates
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/events/${event.id}/waitlist`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'waitlist'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Clock size={16} />
                                    Manage Waitlist
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/events/${event.id}/breakouts`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'breakouts'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Presentation size={16} />
                                    Manage Breakout Sessions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Section: Reporting */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Reporting</h3>
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href={`/events/${event.id}/reports`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'reports'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <FileText size={16} />
                                    Event Reports
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/analytics/${event.id}`}
                                    className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-300 ${activePage === 'analytics'
                                        ? 'bg-[#ABD2FA] text-[#3D518C] shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <BarChart3 size={16} />
                                    Analytics
                                </Link>
                            </li>
                        </ul>
                    </div>

                </nav>
            </div>
        </aside>
    );
}
