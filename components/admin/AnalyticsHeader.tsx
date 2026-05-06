"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import EventSelector from "@/components/admin/EventSelector";
import ExportButton from "@/components/admin/ExportButton";
import { useEffect, useState, useTransition } from "react";
import { DollarSign, Loader2 } from "lucide-react";

import { EventSummary } from "@/lib/types";

interface AnalyticsHeaderProps {
    events: EventSummary[];
    currentEventId: string;
    data: any; // Full data object for ExportButton
    title?: string;
    description?: string;
    usePeso?: boolean;
    onCurrencyToggle?: () => void;
}

export default function AnalyticsHeader({ events, currentEventId, data, title = "Analytics", description = "Track and analyze your event performance metrics", usePeso = false, onCurrencyToggle }: AnalyticsHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    
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
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const isPerEvent = currentEventId !== "all";

    if (isPerEvent) {
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
                <div className="flex flex-wrap items-center gap-3">
                    <EventSelector
                        events={events}
                        currentEventId={currentEventId}
                        selectedYear={searchYear}
                        onYearChange={setSearchYear}
                        showYear={true}
                        showSearch={true}
                        showClear={true}
                    />
                    <ExportButton data={data} />
                </div>
            </div>
        );
    }

    return (
        <>
            {isPending && (
                <div className="fixed inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px] flex items-center justify-center z-[100]">
                    <div className="flex flex-col items-center gap-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Updating Analytics...</p>
                    </div>
                </div>
            )}
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
                {onCurrencyToggle && (
                    <button
                        onClick={onCurrencyToggle}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title={`Switch to ${usePeso ? 'USD' : 'PHP'}`}
                    >
                        <DollarSign size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {usePeso ? '₱ (PHP)' : '$ (USD)'}
                        </span>
                    </button>
                )}
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
        </>
    );
}
