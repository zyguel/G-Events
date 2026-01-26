"use client";

import { useState } from "react";

interface RegistrationChartProps {
    data: {
        allTime: number[];
        last30Days: number[];
        last7Days: number[];
    };
}

export default function RegistrationChart({ data }: RegistrationChartProps) {
    const [filter, setFilter] = useState<"allTime" | "last30Days" | "last7Days">("allTime");
    const currentData = data[filter];


    const chartLabels = {
        allTime: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        last30Days: ["Week 1", "Week 2", "Week 3", "Week 4"],
        last7Days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    };

    return (
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm min-h-[300px] transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">Registration Trends</h3>

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-sm border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-1 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="allTime">All Time</option>
                    <option value="last30Days">Last 30 Days</option>
                    <option value="last7Days">Last 7 Days</option>
                </select>
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

            {/* 3. The New Dynamic Labels */}
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 px-2">
                {chartLabels[filter].map((label, i) => (
                    <span key={i}>{label}</span>
                ))}
            </div>
        </div>
    );
}
