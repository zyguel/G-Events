"use client";

import { useState } from "react";
import { TrendingUp, Star, Users, DollarSign } from "lucide-react";

interface Event {
    id: string;
    name: string;
    registrations: number;
    revenue: number;
    satisfaction: number;
    attendance: number;
}

interface TopPerformingEventsProps {
    events: Event[];
}

type FilterType = "registrations" | "revenue" | "satisfaction" | "attendance";

export default function TopPerformingEvents({ events }: TopPerformingEventsProps) {
    const [filter, setFilter] = useState<FilterType>("registrations");

    const filterConfig = {
        registrations: { label: "Registrations", icon: Users, format: (v: number) => v.toLocaleString() },
        revenue: { label: "Revenue", icon: DollarSign, format: (v: number) => `$${v.toLocaleString()}` },
        satisfaction: { label: "Avg Rating", icon: Star, format: (v: number) => `${v}/5` },
        attendance: { label: "Attendance", icon: TrendingUp, format: (v: number) => `${v}%` },
    };

    // Sort events by the selected filter
    const sortedEvents = [...events].sort((a, b) => b[filter] - a[filter]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Top Performing Events</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on {filterConfig[filter].label.toLowerCase()}</p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                    className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="registrations">Registrations</option>
                    <option value="revenue">Revenue</option>
                    <option value="satisfaction">Avg Rating</option>
                    <option value="attendance">Attendance</option>
                </select>
            </div>

            <div className="space-y-3">
                {sortedEvents.map((event, index) => {
                    const Icon = filterConfig[filter].icon;
                    const value = event[filter];
                    const maxValue = sortedEvents[0][filter];
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                    return (
                        <div key={event.id} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                                        {event.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                    <Icon size={14} className="text-gray-400 dark:text-gray-500" />
                                    {filterConfig[filter].format(value)}
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${index === 0
                                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                        : "bg-indigo-500 dark:bg-indigo-400"
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
