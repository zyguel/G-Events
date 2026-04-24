"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import EventSelector from "@/components/admin/EventSelector";
import ExportButton from "@/components/admin/ExportButton";
import { useEffect, useState } from "react";

import { EventSummary } from "@/lib/types";

interface AnalyticsHeaderProps {
    events: EventSummary[];
    currentEventId: string;
    data: any; // Full data object for ExportButton
    title?: string;
    description?: string;
}

export default function AnalyticsHeader({ events, currentEventId, data, title = "Analytics", description = "Track and analyze your event performance metrics" }: AnalyticsHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Default to 2026 if no year param is present
    const [selectedYear, setSelectedYear] = useState<number | null>(() => {
        const yearParam = searchParams.get("year");
        if (yearParam === "all") return null;
        return yearParam ? parseInt(yearParam, 10) : 2026;
    });

    const [searchYear, setSearchYear] = useState<number | null>(null);

    useEffect(() => {
        const yearParam = searchParams.get("year");
        if (yearParam === "all") {
            setSelectedYear(null);
        } else if (yearParam) {
            setSelectedYear(parseInt(yearParam, 10));
        } else {
            setSelectedYear(2026); // Default when no param
        }
    }, [searchParams]);

    const handleYearChange = (year: number | null) => {
        setSelectedYear(year);
        const params = new URLSearchParams(searchParams.toString());
        if (year === null) {
            params.set("year", "all");
        } else {
            params.set("year", year.toString());
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {description}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Section: Filter Analytics */}
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                        filter analytics by year
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <EventSelector
                            events={events}
                            currentEventId={currentEventId}
                            selectedYear={selectedYear}
                            onYearChange={handleYearChange}
                            showSearch={false}
                        />
                        <ExportButton data={data} />
                    </div>
                </div>

                {/* Right Section: Find an Event */}
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                        find an event
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <EventSelector
                            events={events}
                            currentEventId={currentEventId}
                            selectedYear={searchYear}
                            onYearChange={setSearchYear}
                            showYear={true}
                            showSearch={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
