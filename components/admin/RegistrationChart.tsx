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

// Mock yearly data for demonstration
const yearlyData: Record<string, number[]> = {
    "2025": [350, 520, 680, 920, 1180, 1450, 1720, 1980, 2250, 2520, 2800, 3100],
    "2024": [280, 420, 580, 780, 950, 1200, 1450, 1680, 1900, 2150, 2400, 2650],
    "2023": [180, 320, 450, 620, 780, 980, 1200, 1380, 1550, 1750, 1950, 2150],
};

const allMonthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const quarterRanges: Record<string, { start: number; end: number; labels: string[] }> = {
    "Full Year": { start: 0, end: 12, labels: allMonthLabels },
    "Q1": { start: 0, end: 3, labels: ["Jan", "Feb", "Mar"] },
    "Q2": { start: 3, end: 6, labels: ["Apr", "May", "Jun"] },
    "Q3": { start: 6, end: 9, labels: ["Jul", "Aug", "Sep"] },
    "Q4": { start: 9, end: 12, labels: ["Oct", "Nov", "Dec"] },
};

export default function RegistrationChart({ data }: RegistrationChartProps) {
    // Determine which format to use
    const isMonthly = data.monthly && data.monthLabels;

    // State for filters (only used in monthly/all-events view)
    const [selectedYear, setSelectedYear] = useState("2025");
    const [selectedQuarter, setSelectedQuarter] = useState("Full Year");

    // Get data and labels based on view type
    let currentData: number[];
    let labels: string[];

    if (isMonthly) {
        // Monthly view with year and quarter filters
        const yearData = yearlyData[selectedYear] || yearlyData["2025"];
        const quarterRange = quarterRanges[selectedQuarter];
        currentData = yearData.slice(quarterRange.start, quarterRange.end);
        labels = quarterRange.labels;
    } else {
        // Weekly view for individual events
        currentData = data.weekly || [];
        labels = data.weekLabels || [];
    }

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
                            All events • {selectedQuarter === "Full Year" ? selectedYear : `${selectedQuarter} ${selectedYear}`}
                        </p>
                    )}
                </div>

                {/* Filters for monthly view */}
                {isMonthly ? (
                    <div className="flex items-center gap-2">
                        {/* Year Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all hover:border-indigo-400"
                            >
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>

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
            <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-l border-gray-200 dark:border-gray-600">
                {(() => {
                    const maxValue = Math.max(...currentData);
                    return currentData.map((value, index) => (
                        <div
                            key={index}
                            className="w-full bg-indigo-500 dark:bg-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-300 rounded-t-sm transition-all duration-500 relative group"
                            style={{ height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                {value} Registrations
                            </div>
                        </div>
                    ));
                })()}
            </div>

            {/* Dynamic Labels */}
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 px-2">
                {labels.map((label, i) => (
                    <span key={i} className="text-center" title={label}>{label}</span>
                ))}
            </div>
        </div>
    );
}
