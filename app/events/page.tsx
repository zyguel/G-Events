"use client";
import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import { Search, Filter, Plus, Calendar, List, Grid, MoreVertical, Users, Ticket, MapPin } from 'lucide-react';

type FilterOption = 'all' | 'drafts' | 'upcoming' | 'past';

interface Event {
    id: number;
    name: string;
    location: string;
    date: string;
    ticketsSold: number;
    totalTickets: number;
    attendees: number;
    status: 'Draft' | 'Upcoming' | 'Live' | 'Completed';
    type: 'draft' | 'upcoming' | 'past';
    image?: string;
}

const eventsData: Event[] = [
    { id: 1, name: 'Google I/O Extended 2025', location: 'USC MR Hall', date: 'July 20, 2025', ticketsSold: 0, totalTickets: 200, attendees: 0, status: 'Draft', type: 'draft' },
    { id: 2, name: 'DevFest Cebu 2025', location: 'USC MR Hall', date: 'November 20, 2025', ticketsSold: 150, totalTickets: 350, attendees: 0, status: 'Upcoming', type: 'upcoming' },
    { id: 3, name: 'DevFest Cebu 2024', location: 'Ayala Center Cebu', date: 'November 25, 2024', ticketsSold: 302, totalTickets: 450, attendees: 290, status: 'Completed', type: 'past' },
    { id: 4, name: 'Google I/O Cebu 2024', location: 'Ayala Center Cebu', date: 'July 15, 2024', ticketsSold: 210, totalTickets: 350, attendees: 198, status: 'Completed', type: 'past' },
    { id: 5, name: 'Women Techmakers 2025', location: 'SMX Convention', date: 'March 8, 2025', ticketsSold: 89, totalTickets: 200, attendees: 0, status: 'Upcoming', type: 'upcoming' },
];

export default function EventsPage() {
    const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const filteredEvents = eventsData.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedFilter === 'all') return matchesSearch;
        if (selectedFilter === 'drafts') return matchesSearch && event.type === 'draft';
        if (selectedFilter === 'upcoming') return matchesSearch && event.type === 'upcoming';
        if (selectedFilter === 'past') return matchesSearch && event.type === 'past';

        return matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
            case 'Upcoming': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
            case 'Live': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
            case 'Completed': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Draft': return '/icons/gray-check.png';
            case 'Upcoming': return '/icons/blue-check.png';
            case 'Live': return '/icons/blue-check.png';
            case 'Completed': return '/icons/green-check.png';
            default: return '/icons/gray-check.png';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="events" />

                <main className="flex-1 ml-20 overflow-y-auto p-8">
                    <div className="space-y-6 max-w-7xl mx-auto">

                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Events
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    Manage and organize all your events
                                </p>
                            </div>

                            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#3D518C] text-white rounded-xl text-sm font-medium hover:bg-[#2d3d6b] transition-all shadow-sm">
                                <Plus size={18} />
                                Create Event
                            </button>
                        </div>

                        {/* Filters and Search Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Search */}
                                <div className="relative flex-1 max-w-md">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex items-center gap-2">
                                    {(['all', 'upcoming', 'drafts', 'past'] as FilterOption[]).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setSelectedFilter(filter)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === filter
                                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* View Toggle */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                    >
                                        <List size={18} className={viewMode === 'list' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                    >
                                        <Grid size={18} className={viewMode === 'grid' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Events List/Grid */}
                        {filteredEvents.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
                                <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No events found</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredEvents.map((event) => (
                                        <div key={event.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                                        {event.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Image
                                                                src={getStatusIcon(event.status)}
                                                                alt={event.status}
                                                                width={18}
                                                                height={18}
                                                            />
                                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{event.name}</h3>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin size={14} /> {event.location}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={14} /> {event.date}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-center hidden md:block">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tickets</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{event.ticketsSold}/{event.totalTickets}</p>
                                                    </div>
                                                    <div className="text-center hidden md:block">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Attendees</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{event.attendees}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                                        {event.status}
                                                    </span>
                                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                                                        <MoreVertical size={18} className="text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredEvents.map((event) => (
                                    <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1">
                                        <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                            <span className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-center gap-2">
                                                <Image
                                                    src={getStatusIcon(event.status)}
                                                    alt={event.status}
                                                    width={18}
                                                    height={18}
                                                />
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{event.name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <MapPin size={14} /> {event.location}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <Calendar size={14} /> {event.date}
                                            </p>
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Ticket size={14} className="text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-300">{event.ticketsSold}/{event.totalTickets}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Users size={14} className="text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-300">{event.attendees} attended</span>
                                                </div>
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
