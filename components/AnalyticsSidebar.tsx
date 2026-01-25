"use client";

import { Settings, LayoutDashboard, FileText, BarChart3, Ticket, ClipboardList, CheckCircle, Send, Users, Mail, UserCheck, Award, Clock, Presentation } from "lucide-react";
import Link from "next/link";

interface SidebarEvent {
    id: string;
    name: string;
    date: string;
    status: "Ongoing" | "Completed";
}

interface AnalyticsSidebarProps {
    event: SidebarEvent;
}

export default function AnalyticsSidebar({ event }: AnalyticsSidebarProps) {
    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors duration-300">

            {/* 1. Event Context Card - Fixed height with truncation */}
            <div className="p-4 flex-shrink-0">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 rounded-lg p-4 text-white shadow-lg relative overflow-hidden h-[120px]">
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
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-indigo-500 rounded-full opacity-50"></div>
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
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <LayoutDashboard size={16} />
                                    Overview
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Section: Order Options */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Order Options</h3>
                        <ul className="space-y-1">
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <Ticket size={16} />
                                    Tickets
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <ClipboardList size={16} />
                                    Order Form
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <CheckCircle size={16} />
                                    Order Confirmation
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <Send size={16} />
                                    Publish Event
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Section: Manage Attendees */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Manage Attendees</h3>
                        <ul className="space-y-1">
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <Users size={16} />
                                    Manage Orders
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <Mail size={16} />
                                    Email to Attendees
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <UserCheck size={16} />
                                    Check-In
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <Award size={16} />
                                    Certificates
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <Clock size={16} />
                                    Manage Waitlist
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <Presentation size={16} />
                                    Manage Breakout Sessions
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Section: Reporting */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Reporting</h3>
                        <ul className="space-y-1">
                            <li>
                                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors">
                                    <FileText size={16} />
                                    Event Reports
                                </a>
                            </li>
                            <li>
                                <Link
                                    href={`/analytics/${event.id}`}
                                    className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-md px-2 py-1.5 -mx-2 transition-colors"
                                >
                                    <BarChart3 size={16} />
                                    Analytics
                                </Link>
                            </li>
                        </ul>
                    </div>

                </nav>
            </div>

            {/* 3. Bottom Settings Icon */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <Settings size={20} />
                </button>
            </div>
        </aside>
    );
}
