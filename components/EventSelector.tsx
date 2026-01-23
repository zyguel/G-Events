"use client";

import { useRouter } from "next/navigation";
import { Search, X, Calendar, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

interface EventOption {
    id: string;
    name: string;
    date: string;
    status: "Ongoing" | "Completed";
}

interface EventSelectorProps {
    events: EventOption[];
    currentEventId: string;
}

// Extract year from date string like "July 22, 2025"
function extractYear(dateString: string): number {
    const match = dateString.match(/\d{4}/);
    return match ? parseInt(match[0]) : new Date().getFullYear();
}

export default function EventSelector({ events, currentEventId }: EventSelectorProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsYearDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Get unique years from events
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        events.forEach(event => years.add(extractYear(event.date)));
        return Array.from(years).sort((a, b) => b - a); // Most recent first
    }, [events]);

    // Filter events based on search query and year
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesYear = selectedYear === null || extractYear(event.date) === selectedYear;
            return matchesSearch && matchesYear;
        });
    }, [events, searchQuery, selectedYear]);

    const allEventsOption = { id: "all", name: "All Events", date: "All Time", status: "Ongoing" as const };
    const currentEvent = currentEventId === "all"
        ? allEventsOption
        : events.find(e => e.id === currentEventId) || allEventsOption;

    const handleSelect = (eventId: string) => {
        setIsOpen(false);
        setSearchQuery("");
        router.push(`/analytics/${eventId}`);
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedYear(null);
    };

    const hasActiveFilters = searchQuery.length > 0 || selectedYear !== null;

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md min-w-[220px]"
            >
                <Search size={16} className="text-gray-400" />
                <div className="flex-1 text-left">
                    <div className="font-semibold truncate">{currentEvent.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{currentEvent.date}</div>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Search Dropdown Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Search Input & Year Filter */}
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 space-y-2">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Year Filter */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <button
                                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        {selectedYear || "All Years"}
                                    </span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isYearDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isYearDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                                        <button
                                            onClick={() => { setSelectedYear(null); setIsYearDropdownOpen(false); }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedYear === null ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200"
                                                }`}
                                        >
                                            All Years
                                        </button>
                                        {availableYears.map(year => (
                                            <button
                                                key={year}
                                                onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedYear === year ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200"
                                                    }`}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="max-h-64 overflow-y-auto">
                        {/* "All Events" Option */}
                        <button
                            onClick={() => handleSelect("all")}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between border-b border-gray-100 dark:border-gray-700 ${currentEventId === "all"
                                ? "bg-indigo-50 dark:bg-indigo-900/30"
                                : ""
                                }`}
                        >
                            <div>
                                <div className={`font-medium text-sm ${currentEventId === "all"
                                    ? "text-indigo-700 dark:text-indigo-300"
                                    : "text-gray-700 dark:text-gray-200"
                                    }`}>
                                    All Events
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">Aggregated view</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                Overview
                            </span>
                        </button>

                        {/* Filtered Events */}
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map((event) => (
                                <button
                                    key={event.id}
                                    onClick={() => handleSelect(event.id)}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${event.id === currentEventId
                                        ? "bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-indigo-500"
                                        : ""
                                        }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className={`font-medium text-sm truncate ${event.id === currentEventId
                                            ? "text-indigo-700 dark:text-indigo-300"
                                            : "text-gray-700 dark:text-gray-200"
                                            }`}>
                                            {event.name}
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">{event.date}</div>
                                    </div>
                                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${event.status === "Ongoing"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                        }`}>
                                        {event.status}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                <Search size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                No events found matching your search.
                            </div>
                        )}
                    </div>


                </div>
            )}
        </div>
    );
}
