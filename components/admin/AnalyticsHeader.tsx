"use client";

import EventSelector from "@/components/admin/EventSelector";
import ExportButton from "@/components/admin/ExportButton";
import { useState } from "react";

import { EventSummary } from "@/lib/api";

interface AnalyticsHeaderProps {
    events: EventSummary[];
    currentEventId: string;
    data: any; // Full data object for ExportButton
    title?: string;
    description?: string;
}

export default function AnalyticsHeader({ events, currentEventId, data, title = "Analytics", description = "Track and analyze your event performance metrics" }: AnalyticsHeaderProps) {
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {description}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Event Search, Year Filter & Clear Filter - all in EventSelector */}
                <EventSelector
                    events={events}
                    currentEventId={currentEventId}
                    selectedYear={selectedYear}
                    onYearChange={setSelectedYear}
                />

                <div className="w-full sm:w-auto">
                    <ExportButton data={data} />
                </div>
            </div>
        </div>
    );
}
