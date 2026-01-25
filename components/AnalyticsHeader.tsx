"use client";

import EventSelector from "@/components/EventSelector";
import ExportButton from "@/components/ExportButton";
import { useState } from "react";

interface EventOption {
    id: string;
    name: string;
    date: string;
    status: "Ongoing" | "Completed";
}

interface AnalyticsHeaderProps {
    events: EventOption[];
    currentEventId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any; // Full data object for ExportButton
}

export default function AnalyticsHeader({ events, currentEventId, data }: AnalyticsHeaderProps) {
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Analytics
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Track and analyze your event performance metrics
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Event Search, Year Filter & Clear Filter - all in EventSelector */}
                <EventSelector
                    events={events}
                    currentEventId={currentEventId}
                    selectedYear={selectedYear}
                    onYearChange={setSelectedYear}
                />

                <ExportButton data={data} />
            </div>
        </div>
    );
}
