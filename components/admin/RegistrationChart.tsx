"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface RegistrationChartProps {
    data: {
        // Weekly format for individual events
        weekly?: number[];
        weekLabels?: string[];
        registrationOpenDate?: string;
        eventDate?: string;
        // Monthly format for all events overview
        monthly?: number[];
        monthLabels?: string[];
    };
}

const allMonthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const quarterRanges: Record<string, { start: number; end: number; labels: string[] }> = {
    "Full Year": { start: 0, end: 12, labels: allMonthLabels },
    "Q1": { start: 0, end: 3, labels: ["Jan", "Feb", "Mar"] },
    "Q2": { start: 3, end: 6, labels: ["Apr", "May", "Jun"] },
    "Q3": { start: 6, end: 9, labels: ["Jul", "Aug", "Sep"] },
    "Q4": { start: 9, end: 12, labels: ["Oct", "Nov", "Dec"] },
};

export default function RegistrationChart({ data }: RegistrationChartProps) {
    const isMonthly = !!(data.monthly && data.monthLabels);

    const [selectedQuarter, setSelectedQuarter] = useState("Full Year");

    // Get data and labels based on view type
    let currentData: number[];
    let labels: string[];

    if (isMonthly) {
        // Use REAL monthly data from the server
        const fullMonthly = data.monthly!;
        // Pad to 12 if shorter (months not yet reached will be 0)
        const padded = Array(12).fill(0).map((_, i) => fullMonthly[i] ?? 0);
        const quarterRange = quarterRanges[selectedQuarter];
        currentData = padded.slice(quarterRange.start, quarterRange.end);
        labels = quarterRange.labels;
    } else {
        // Weekly view for individual events
        currentData = data.weekly || [];
        labels = data.weekLabels || [];
    }

    const maxValue = Math.max(...currentData, 1); // avoid division by zero
    const hasData = currentData.some(v => v > 0);
    const currentYear = new Date().getFullYear();

    return (
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm min-h-[300px] transition-colors">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Registration Trends</h3>
                    {!isMonthly && data.registrationOpenDate && data.eventDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {data.registrationOpenDate} → {data.eventDate}
                        </p>
                    )}
                    {isMonthly && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            All events • {selectedQuarter === "Full Year" ? currentYear : `${selectedQuarter} ${currentYear}`}
                        </p>
                    )}
                </div>

                {/* Filters for monthly view */}
                {isMonthly ? (
                    <div className="flex items-center gap-2">
                        {/* Quarter Filter */}
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                            {["Full Year", "Q1", "Q2", "Q3", "Q4"].map((quarter) => (
                                <button
                                    key={quarter}
                                    onClick={() => setSelectedQuarter(quarter)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${selectedQuarter === quarter
                                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                        }`}
                                >
                                    {quarter === "Full Year" ? "All" : quarter}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            Weekly View
                        </span>
                    </div>
                )}
            </div>

            {/* The Bars */}
            {hasData ? (
                <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-l border-gray-200 dark:border-gray-600">
                    {currentData.map((value, index) => (
                        <div
                            key={index}
                            className="w-full bg-indigo-500 dark:bg-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-300 rounded-t-sm transition-all duration-500 relative group"
                            style={{ height: `${(value / maxValue) * 100}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                {value} Registrations
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-b border-l border-gray-200 dark:border-gray-600 mx-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm font-medium">No registration data yet</p>
                    <p className="text-xs mt-1">Data will appear once registrations are recorded</p>
                </div>
            )}

            {/* Dynamic Labels */}
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 px-2">
                {labels.map((label, i) => (
                    <span key={i} className="text-center" title={label}>{label}</span>
                ))}
            </div>
        </div>
    );
}
