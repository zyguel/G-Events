"use client";

import React, { useState } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import EventsSidebar from '@/components/admin/EventsSidebar';
import { Search, Filter, MoreVertical, CheckCircle, Clock, ChevronDown, UserCheck, UserX, Eye } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { EventSummary } from '@/lib/api';

// --- Types ---
interface Attendee {
    registrationId: string;
    name: string;
    email: string;
    ticketType: string;
    status: 'Checked-In' | 'Not Yet Checked-In';
    checkInTime?: string;
}

interface CheckInClientProps {
    event: EventSummary;
}

// --- Mock Data ---
const INITIAL_ATTENDEES: Attendee[] = [
    { registrationId: "20240502000002", name: "Karylle Bernate", email: "karyllebernate8@gmail.com", ticketType: "General Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000001", name: "Vinz Villarin", email: "vinzvillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In" },
    { registrationId: "20240502000003", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000004", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000005", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000006", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000007", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In", checkInTime: "2025-06-01 09:20 AM" },
];

export default function CheckInClient({ event }: CheckInClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [attendees, setAttendees] = useState<Attendee[]>(INITIAL_ATTENDEES);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'All' | 'Checked-In' | 'Not Yet Checked-In'>('All');

    // Action Menu State
    const [openActionId, setOpenActionId] = useState<string | null>(null);

    // --- Actions ---
    const handleCheckInToggle = (registrationId: string) => {
        setAttendees(prev => prev.map(att => {
            if (att.registrationId === registrationId) {
                const newStatus = att.status === 'Checked-In' ? 'Not Yet Checked-In' : 'Checked-In';
                const newTime = newStatus === 'Checked-In' ? new Date().toLocaleString() : undefined;
                return { ...att, status: newStatus, checkInTime: newTime };
            }
            return att;
        }));
        setOpenActionId(null);
    };

    // --- Filtering ---
    const filteredAttendees = attendees.filter(attendee => {
        const matchesSearch =
            attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.registrationId.includes(searchQuery);

        const matchesFilter = activeFilter === 'All' || attendee.status === activeFilter;

        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: attendees.length,
        checkedIn: attendees.filter(a => a.status === 'Checked-In').length,
        pending: attendees.filter(a => a.status === 'Not Yet Checked-In').length
    };

    // --- UI Components ---

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30 transition-colors duration-300 relative">
            <Header />

            {/* Background Glow Effects (Dark Mode Only) - Adjusted to blend with gray theme */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-0 dark:opacity-50 transition-opacity duration-500">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="flex flex-1 overflow-hidden relative z-10">
                <Sidebar activePage="events" disableExpand={true} />

                <div className="ml-20 hidden lg:block h-full flex-shrink-0">
                    <EventsSidebar event={event} activePage="checkin" />
                </div>

                <main className="flex-1 ml-20 lg:ml-0 overflow-y-auto p-8 scrollbar-hide">
                    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                        {/* Page Header */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                                <UserCheck className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Check-In
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    Manage attendee check-ins and track event attendance
                                </p>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.checkedIn}</span> Checked In
                            </div>
                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.pending}</span> Pending
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="glass-panel p-1.5 rounded-2xl flex flex-col md:flex-row items-center gap-2 bg-white/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 backdrop-blur-xl shadow-sm transition-all duration-300">
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID, Name, or Email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto p-1">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${isFilterOpen || activeFilter !== 'All'
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300'
                                            : 'bg-gray-100/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <Filter size={16} />
                                        <span>{activeFilter === 'All' ? 'Filter' : activeFilter}</span>
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Filter Dropdown */}
                                    <AnimatePresence>
                                        {isFilterOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1.5 z-20 flex flex-col gap-1 backdrop-blur-3xl origin-top-right ring-1 ring-black/5"
                                                >
                                                    {['All', 'Checked-In', 'Not Yet Checked-In'].map((filter) => (
                                                        <button
                                                            key={filter}
                                                            onClick={() => {
                                                                setActiveFilter(filter as any);
                                                                setIsFilterOpen(false);
                                                            }}
                                                            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === filter
                                                                ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                                                }`}
                                                        >
                                                            {filter}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="px-4 py-2.5 bg-gray-100/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-all"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden shadow-sm transition-colors duration-300">
                            <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 transition-colors">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                                        <tr>
                                            <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Registration ID</th>
                                            <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Name</th>
                                            <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Email</th>
                                            <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Ticket Type</th>
                                            <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Status</th>
                                            <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Time</th>
                                            <th className="px-6 py-5 text-center text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredAttendees.length > 0 ? (
                                            filteredAttendees.map((attendee) => (
                                                <tr
                                                    key={attendee.registrationId}
                                                    className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                                                >
                                                    <td className="px-6 py-4 font-mono text-indigo-700 dark:text-indigo-300/80 whitespace-nowrap">{attendee.registrationId}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{attendee.name}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{attendee.email}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{attendee.ticketType}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md ${attendee.status === 'Checked-In'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                            }`}>
                                                            {attendee.status === 'Checked-In' ? (
                                                                <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-500" />
                                                            ) : (
                                                                <Clock size={12} className="text-amber-600 dark:text-amber-500" />
                                                            )}
                                                            {attendee.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-500 text-xs whitespace-nowrap">
                                                        {attendee.checkInTime || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex justify-center relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenActionId(openActionId === attendee.registrationId ? null : attendee.registrationId);
                                                                }}
                                                                className={`p-2 rounded-lg transition-colors ${openActionId === attendee.registrationId
                                                                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                                                                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                                    }`}
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>

                                                            {/* Actions Dropdown */}
                                                            <AnimatePresence>
                                                                {openActionId === attendee.registrationId && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-30" onClick={() => setOpenActionId(null)} />
                                                                        <motion.div
                                                                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                                                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="absolute right-8 top-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1 z-40 flex flex-col backdrop-blur-3xl origin-top-right ring-1 ring-black/5"
                                                                        >
                                                                            <button
                                                                                onClick={() => handleCheckInToggle(attendee.registrationId)}
                                                                                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                                                                            >
                                                                                {attendee.status === 'Checked-In' ? (
                                                                                    <>
                                                                                        <UserX size={16} className="text-rose-500 dark:text-rose-400" />
                                                                                        Undo Check-In
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <UserCheck size={16} className="text-emerald-500 dark:text-emerald-400" />
                                                                                        Check In User
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                            <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                                                                                <Eye size={16} className="text-blue-500 dark:text-blue-400" />
                                                                                View Details
                                                                            </button>
                                                                        </motion.div>
                                                                    </>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                                                        <Search size={40} strokeWidth={1.5} className="opacity-50" />
                                                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No attendees found</p>
                                                        <p className="text-sm">Try adjusting your search or filter</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
