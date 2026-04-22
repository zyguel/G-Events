"use client";

import { useRouter } from "next/navigation";
import { Search, X, Calendar, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

import { EventSummary } from "@/lib/types";
import { buildEventSlug } from "@/lib/slug";

interface EventSelectorProps {
    events: EventSummary[];
    currentEventId: string;
    selectedYear: number | null;
    onYearChange: (year: number | null) => void;
    showSearch?: boolean;
    showYear?: boolean;
    showClear?: boolean;
}

// Extract year from date string like "July 22, 2025"
function extractYear(dateString: string): number {
    const match = dateString.match(/\d{4}/);
    return match ? parseInt(match[0]) : new Date().getFullYear();
}

export default function EventSelector({ 
    events, 
    currentEventId, 
    selectedYear, 
    onYearChange,
    showSearch = true,
    showYear = true,
    showClear = true
}: EventSelectorProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const yearContainerRef = useRef<HTMLDivElement>(null);

    // Close search results when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSearchQuery("");
            }
            if (yearContainerRef.current && !yearContainerRef.current.contains(event.target as Node)) {
                setIsYearDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get unique years from events + always include the current year so the dropdown is never empty
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        years.add(2026); // requested default/most recent
        years.add(new Date().getFullYear()); 
        events.forEach(event => years.add(extractYear(event.date)));
        return Array.from(years).sort((a, b) => b - a); // Most recent first
    }, [events]);

    // Filter events based on search query AND selected year
    const filteredEvents = useMemo(() => {
        if (!searchQuery.trim()) return []; // Only show results when searching
        return events.filter(event => {
            const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesYear = selectedYear === null || extractYear(event.date) === selectedYear;
            return matchesSearch && matchesYear;
        });
    }, [events, searchQuery, selectedYear]);

    const handleSelect = (event: EventSummary) => {
        const slug = buildEventSlug(event.name, event.id);
        setSearchQuery("");
        router.push(`/admin/events/${slug}/analytics`);
    };

    const handleYearSelect = (year: number | null) => {
        onYearChange(year);
        setIsYearDropdownOpen(false);
    };

    const showResults = searchQuery.trim().length > 0;

    return (
        <div className="flex items-center gap-2">
            {/* Search Input */}
            {showSearch && (
                <div className="relative" ref={searchContainerRef}>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[220px] pl-9 pr-9 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
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

                    {/* Search Results Dropdown - only shows when searching */}
                    {showResults && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-64 overflow-y-auto">
                                {filteredEvents.length > 0 ? (
                                    filteredEvents.map((event) => (
                                        <button
                                            key={event.id}
                                            onClick={() => handleSelect(event)}
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
                                        No events found matching &quot;{searchQuery}&quot;
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Year Filter Button */}
            {showYear && (
                <div className="relative" ref={yearContainerRef}>
                    <button
                        onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                    >
                        <Calendar size={16} className="text-gray-400" />
                        {selectedYear || "All Years"}
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isYearDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isYearDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => handleYearSelect(year)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedYear === year ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200"
                                        }`}
                                >
                                    {year}
                                </button>
                            ))}
                            <button
                                onClick={() => handleYearSelect(null)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700 ${selectedYear === null ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200"
                                    }`}
                            >
                                All Years
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Clear Filter Button */}
            {showClear && (
                <button
                    onClick={() => onYearChange(null)}
                    disabled={selectedYear === null}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${selectedYear !== null
                        ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer"
                        : "bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        }`}
                >
                    <X size={16} />
                    Clear Filter
                </button>
            )}
        </div>
    );
}
