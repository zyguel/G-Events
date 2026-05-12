"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useAdminCompactMode } from '@/contexts/AdminCompactModeContext';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Plus, Calendar, List, Grid, MoreVertical, Users, Ticket, MapPin, Eye, Trash2 } from 'lucide-react';

import { deleteEvent } from '@/lib/actions/events';
import { buildEventSlug } from '@/lib/slug';
import Modal, { ModalFooter } from '@/components/admin/Modal';

type FilterOption = 'all' | 'drafts' | 'upcoming' | 'past';

export interface Event {
    id: number | string;
    name: string;
    location: string;
    date: string;
    ticketsSold: number;
    totalTickets: number;
    attendees: number;
        status: string;
    type: 'draft' | 'upcoming' | 'past';
    image?: string;
    analyticsId?: string; // Maps to the API event ID for analytics
}

interface EventsPageClientProps {
    initialEvents: Event[];
}

export default function EventsPageClient({ initialEvents }: EventsPageClientProps) {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const isLoading = false;
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { isCompactAdmin } = useAdminCompactMode();

    // Close dropdown on outside click or scroll
    useEffect(() => {
        if (openMenuId === null) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        const handleScroll = () => setOpenMenuId(null);
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [openMenuId]);

    // Load view mode from local storage on mount
    useEffect(() => {
        const savedView = localStorage.getItem('admin_events_view_mode');
        if (savedView === 'grid' || savedView === 'list') {
            setViewMode(savedView as 'list' | 'grid');
        }
    }, []);

    // Helper to change view mode and save to storage
    const handleSetViewMode = (mode: 'list' | 'grid') => {
        setViewMode(mode);
        localStorage.setItem('admin_events_view_mode', mode);
    };

    const toggleMenu = useCallback((e: React.MouseEvent, eventId: string | number) => {
        e.preventDefault();
        e.stopPropagation();
        if (openMenuId === eventId) {
            setOpenMenuId(null);
            setMenuPos(null);
            return;
        }
        const btn = e.currentTarget as HTMLElement;
        const rect = btn.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 176 }); // 176 = w-44 (11rem)
        setOpenMenuId(eventId);
    }, [openMenuId]);

    const handleDeleteClick = (e: React.MouseEvent, event: Event) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(null);
        setEventToDelete(event);
        setIsDeleteModalOpen(true);
    };

    const handleOverviewClick = (e: React.MouseEvent, event: Event) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(null);
        const slug = buildEventSlug(event.name, event.id);
        router.push(`/admin/events/${slug}/overview`);
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        setIsDeleting(true);
        try {
            const res = await deleteEvent(eventToDelete.id as number);
            if (res.success) {
                setEvents((prev) => prev.filter((event) => event.id !== eventToDelete.id));
                setIsDeleteModalOpen(false);
                setEventToDelete(null);
            } else {
                alert(res.error || 'Failed to delete event');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to delete event');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase());

        const status = event.status;
        const isDraft = status === 'Draft';
        // Expanded status list based on likely DB values
        const isUpcoming = ['Upcoming', 'Live', 'Published', 'Not Yet Published', 'Ongoing', 'Not Started'].includes(status);
        const isPast = ['Completed', 'Past', 'Cancelled'].includes(status);

        if (selectedFilter === 'all') return matchesSearch;
        if (selectedFilter === 'drafts') return matchesSearch && isDraft;
        if (selectedFilter === 'upcoming') return matchesSearch && isUpcoming;
        if (selectedFilter === 'past') return matchesSearch && isPast;

        return matchesSearch;
    });

    const eventListHref = (event: Event) => {
        const slug = buildEventSlug(event.name, event.id);
        if (!event.analyticsId) return '#';
        if (isCompactAdmin) return `/admin/events/${slug}/checkin`;
        return `/admin/events/${slug}/overview`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
            case 'Upcoming':
            case 'Published':
            case 'Not Yet Published':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
            case 'Live': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
            case 'Completed': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Draft': return '/icons/gray-check.png';
            case 'Upcoming':
            case 'Published':
            case 'Not Yet Published':
                return '/icons/blue-check.png';
            case 'Live': return '/icons/blue-check.png';
            case 'Completed': return '/icons/green-check.png';
            default: return '/icons/gray-check.png';
        }
    };

    const getDisplayStatus = (status: string) => {
        if (status === 'Published' || status === 'Not Yet Published') return 'Upcoming';
        return status;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";

        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC'
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="events" />

                <main className="flex-1 lg:ml-20 overflow-y-auto p-4 md:p-8">
                    <div className="space-y-6 max-w-7xl mx-auto">

                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Events
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    {isCompactAdmin
                                        ? 'Select an event to open check-in, scan QRs, and view attendee status.'
                                        : 'Manage and organize all your events'}
                                </p>
                            </div>

                            {!isCompactAdmin ? (
                                <Link href="/admin/events/new/overview" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3D518C] text-white rounded-xl text-sm font-medium hover:bg-[#2d3d6b] transition-all shadow-sm w-full md:w-auto">
                                    <Plus size={18} />
                                    Create Event
                                </Link>
                            ) : null}
                        </div>

                        {/* Filters and Search Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                                    {/* Search */}
                                    <div className="relative flex-1">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search events..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    {/* Filter Tabs & View Toggle */}
                                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                        <div className="flex items-center gap-2">
                                            {(['all', 'upcoming', 'drafts', 'past'] as FilterOption[]).map((filter) => (
                                                <button
                                                    key={filter}
                                                    onClick={() => setSelectedFilter(filter)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedFilter === filter
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* View Toggle - Hidden on mobile, forced to list or grid depending on preference, or kept small */}
                                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 ml-auto shrink-0">
                                            <button
                                                onClick={() => handleSetViewMode('list')}
                                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                            >
                                                <List size={18} className={viewMode === 'list' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'} />
                                            </button>
                                            <button
                                                onClick={() => handleSetViewMode('grid')}
                                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                            >
                                                <Grid size={18} className={viewMode === 'grid' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Events List/Grid */}
                        {isLoading ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                {viewMode === 'list' ? (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="p-4 md:p-5">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0"></div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse"></div>
                                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-60 animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 pl-16 md:pl-0">
                                                        <div className="text-center hidden md:block w-32">
                                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-12 mx-auto animate-pulse"></div>
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-16 mx-auto mt-1 animate-pulse"></div>
                                                        </div>
                                                        <div className="text-center hidden md:block w-24">
                                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-12 mx-auto animate-pulse"></div>
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-12 mx-auto mt-1 animate-pulse"></div>
                                                        </div>
                                                        <div className="min-w-[80px]">
                                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse mx-auto"></div>
                                                        </div>
                                                        <div className="p-2">
                                                            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                                <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                                <div className="p-5 space-y-3">
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse"></div>
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-36 animate-pulse"></div>
                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-20 animate-pulse"></div>
                                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
                                <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No events found</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredEvents.map((event) => {
                                        const href = eventListHref(event);

                                        return (
                                            <div
                                                key={event.id}
                                                onClick={() => {
                                                    if (href !== '#') router.push(href);
                                                }}
                                                className="p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                                                            {event.image ? (
                                                                <Image
                                                                    src={event.image}
                                                                    alt={event.name}
                                                                    fill
                                                                    sizes="(max-width: 768px) 48px, 56px"
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                event.name.charAt(0)
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Image
                                                                    src={getStatusIcon(event.status)}
                                                                    alt={event.status}
                                                                    width={16}
                                                                    height={16}
                                                                    className="w-4 h-4 md:w-[18px] md:h-[18px]"
                                                                />
                                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm md:text-base">{event.name}</h3>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin size={12} className="md:w-[14px] md:h-[14px]" /> {event.location}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={12} className="md:w-[14px] md:h-[14px]" /> {formatDate(event.date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 pl-16 md:pl-0">
                                                        <div className="text-center hidden md:block w-32">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Registered</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{event.ticketsSold}</p>
                                                        </div>
                                                        <div className="text-center hidden md:block w-24">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Attendees</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{event.attendees}</p>
                                                        </div>
                                                        <div className="min-w-[80px] md:w-28 flex justify-center">
                                                            <span className={`px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${getStatusColor(event.status)}`}>
                                                                {getDisplayStatus(event.status)}
                                                            </span>
                                                        </div>
                                                        {!isCompactAdmin ? (
                                                            <button
                                                                onClick={(e) => toggleMenu(e, event.id)}
                                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                title="More options"
                                                            >
                                                                <MoreVertical size={18} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            // ... existing grid view code ...
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                {filteredEvents.map((event) => {
                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => router.push(eventListHref(event))}
                                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1"
                                        >
                                            <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                                                {event.image ? (
                                                    <Image
                                                        src={event.image}
                                                        alt={event.name}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                                )}
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                                <span className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium z-10 ${getStatusColor(event.status)}`}>
                                                    {getDisplayStatus(event.status)}
                                                </span>
                                                {!isCompactAdmin && (
                                                    <div className="absolute top-3 left-3 z-20">
                                                        <button
                                                            onClick={(e) => toggleMenu(e, event.id)}
                                                            className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-lg transition-colors"
                                                            title="More options"
                                                        >
                                                            <MoreVertical size={16} className="text-white" />
                                                        </button>
                                                    </div>
                                                )}
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
                                                    <Calendar size={14} /> {formatDate(event.date)}
                                                </p>
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Ticket size={14} className="text-gray-400" />
                                                        <span className="text-gray-600 dark:text-gray-300">{event.ticketsSold} registered</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Users size={14} className="text-gray-400" />
                                                        <span className="text-gray-600 dark:text-gray-300">{event.attendees} attended</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Portal-rendered dropdown menu */}
            {openMenuId !== null && menuPos && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    className="fixed w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5"
                    style={{ top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => {
                            const event = events.find(ev => ev.id === openMenuId);
                            if (event) handleOverviewClick(e, event);
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
                    >
                        <Eye size={15} className="text-gray-400" />
                        Overview
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button
                        onClick={(e) => {
                            const event = events.find(ev => ev.id === openMenuId);
                            if (event) handleDeleteClick(e, event);
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg"
                    >
                        <Trash2 size={15} />
                        Delete Event
                    </button>
                </div>,
                document.body
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title="Delete Event"
                subtitle="This action cannot be undone."
                size="sm"
            >
                <div className="text-sm border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-r-lg mb-6">
                    <p className="text-red-700 dark:text-red-400">
                        Are you sure you want to delete the event <strong>{eventToDelete?.name}</strong>? All associated data will be permanently deleted.
                    </p>
                </div>

                <ModalFooter
                    onCancel={() => setIsDeleteModalOpen(false)}
                    cancelText="Keep Event"
                    onSave={confirmDelete}
                    saveText="Delete Event"
                    isSubmitting={isDeleting}
                    isDanger={true}
                    submitType="button"
                />
            </Modal>
        </div>
    );
}
