"use client";

import { useState } from "react";
import RegistrationChart from "./RegistrationChart";
import TopPerformingEvents from "./TopPerformingEvents";

// Define the data types expected by this component
interface DashboardData {
    trends: {
        registrations: {
            allTime: number[];
            last30Days: number[];
            last7Days: number[];
        };
        attendance: {
            checkedIn: number;
            noShow: number;
            waitlisted: number;
        };
    };
    stats: {
        revenue: number;
        satisfaction: number;
        expenses: number;
        netProfit: number;
    };
    comments: {
        user: string;
        rating: number;
        text: string;
        time: string;
        eventName?: string;
    }[];
    revenueBreakdown: { name: string; value: number; percentage: number }[];
    recentTransactions: { id: string; user: string; type: string; amount: number; date: string; status: string }[];
    topEvents?: { id: string; name: string; registrations: number; revenue: number; satisfaction: number; attendance: number }[];
}

export default function DashboardTabs({ data }: { data: DashboardData }) {
    const [activeTab, setActiveTab] = useState("registrations");

    return (
        <div className="space-y-6">
            {/* --- Tab Navigation --- */}
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab("registrations")}
                    className={`pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === "registrations"
                        ? "border-indigo-500 text-gray-900 dark:border-indigo-400 dark:text-white"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                >
                    Registrations
                </button>
                <button
                    onClick={() => setActiveTab("revenue")}
                    className={`pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === "revenue"
                        ? "border-indigo-500 text-gray-900 dark:border-indigo-400 dark:text-white"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                >
                    Revenue
                </button>
                <button
                    onClick={() => setActiveTab("feedback")}
                    className={`pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === "feedback"
                        ? "border-indigo-500 text-gray-900 dark:border-indigo-400 dark:text-white"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                >
                    Feedback
                </button>
            </div>

            {/* --- Content Area --- */}
            <div>

                {/* === REGISTRATIONS TAB === */}
                {activeTab === "registrations" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Top Row: Chart and Attendance */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* The Main Chart */}
                            <RegistrationChart data={data.trends.registrations} />

                            {/* Attendance Breakdown */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
                                <h3 className="w-full font-semibold text-gray-900 dark:text-white mb-2 text-left">Attendance Breakdown</h3>
                                <p className="w-full text-xs text-gray-500 dark:text-gray-400 mb-4 text-left">Current attendance status for all events</p>

                                {/* Donut Chart with labels */}
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    <div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: `conic-gradient(
                        rgb(99, 102, 241) 0deg,
                        rgb(99, 102, 241) ${data.trends.attendance.checkedIn * 3.6}deg,
                        rgb(251, 191, 36) ${data.trends.attendance.checkedIn * 3.6}deg,
                        rgb(251, 191, 36) ${(data.trends.attendance.checkedIn + data.trends.attendance.waitlisted) * 3.6}deg,
                        rgb(156, 163, 175) ${(data.trends.attendance.checkedIn + data.trends.attendance.waitlisted) * 3.6}deg,
                        rgb(156, 163, 175) 360deg
                      )`
                                        }}
                                    ></div>
                                    <div className="absolute w-28 h-28 rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Checked In</span>
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">{data.trends.attendance.checkedIn}%</span>
                                    </div>
                                </div>

                                {/* Stats around the chart */}
                                <div className="mt-4 w-full grid grid-cols-2 gap-2 text-xs">
                                    <div className="text-right pr-2">
                                        <span className="text-gray-500 dark:text-gray-400">Waitlisted: </span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{data.trends.attendance.waitlisted}%</span>
                                    </div>
                                    <div className="text-left pl-2">
                                        <span className="text-gray-500 dark:text-gray-400">No Show: </span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{data.trends.attendance.noShow}%</span>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-700 dark:text-gray-300 justify-center">
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 dark:bg-indigo-400"></div> Checked In</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> Waitlisted</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div> No Show</div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Top Performing Events */}
                        {data.topEvents && data.topEvents.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <TopPerformingEvents events={data.topEvents} />
                            </div>
                        )}
                    </div>
                )}

                {/* === REVENUE TAB === */}
                {activeTab === "revenue" && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">

                        {/* 1. Financial Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Gross Revenue */}
                            <div className="p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gross Revenue</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    ${data.stats.revenue.toLocaleString()}
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                    +15% vs last event
                                </span>
                            </div>

                            {/* Expenses */}
                            <div className="p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    ${data.stats.expenses.toLocaleString()}
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Includes venue, food, & marketing</p>
                            </div>

                            {/* Net Profit */}
                            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-sm">
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Net Profit</p>
                                <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-200 mt-1">
                                    ${data.stats.netProfit.toLocaleString()}
                                </h3>
                                <div className="w-full bg-indigo-200 dark:bg-indigo-900/50 rounded-full h-1.5 mt-3">
                                    <div className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                                <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2">65% Profit Margin</p>
                            </div>
                        </div>

                        {/* 2. Breakdown & Transactions Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Revenue Breakdown */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Revenue Sources</h3>
                                <div className="space-y-6">
                                    {data.revenueBreakdown.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600 dark:text-gray-300 font-medium">{item.name}</span>
                                                <span className="text-gray-900 dark:text-white font-bold">${item.value.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                                <div
                                                    className="bg-indigo-600 dark:bg-indigo-400 h-2.5 rounded-full"
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Transactions Table */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
                                    <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">View All</button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                <th className="pb-3 font-medium">User</th>
                                                <th className="pb-3 font-medium">Type</th>
                                                <th className="pb-3 font-medium">Amount</th>
                                                <th className="pb-3 font-medium">Status</th>
                                                <th className="pb-3 font-medium text-right">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {data.recentTransactions.map((tx, i) => (
                                                <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="py-4 border-b border-gray-50 dark:border-gray-700 text-gray-900 dark:text-white font-medium">
                                                        {tx.user} <span className="block text-xs text-gray-400 dark:text-gray-500 font-normal">{tx.id}</span>
                                                    </td>
                                                    <td className="py-4 border-b border-gray-50 dark:border-gray-700 text-gray-600 dark:text-gray-300">{tx.type}</td>
                                                    <td className="py-4 border-b border-gray-50 dark:border-gray-700 text-gray-900 dark:text-white font-bold">${tx.amount.toLocaleString()}</td>
                                                    <td className="py-4 border-b border-gray-50 dark:border-gray-700">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "Success" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                                            tx.status === "Pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                                            }`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 border-b border-gray-50 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-right">{tx.date}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === FEEDBACK TAB === */}
                {activeTab === "feedback" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">

                        {/* Overall Score */}
                        <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-fit">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Overall Satisfaction</h3>
                            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                {data.stats.satisfaction} <span className="text-lg text-gray-400 dark:text-gray-500 font-normal">/ 5.0</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2">
                                <div
                                    className="bg-green-500 dark:bg-green-400 h-2 rounded-full"
                                    style={{ width: `${(data.stats.satisfaction / 5) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Based on post-event surveys</p>
                        </div>

                        {/* Recent Comments Feed */}
                        <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Feedback</h3>
                            <div className="space-y-4">
                                {data.comments.map((comment, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{comment.user}</span>
                                                <span className="text-xs text-yellow-500">{"★".repeat(comment.rating)}</span>
                                                {comment.eventName && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded font-medium">
                                                        {comment.eventName}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">{comment.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">"{comment.text}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
