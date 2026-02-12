import React from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import DashboardTabs from '@/components/admin/DashboardTabs';
import AnalyticsHeader from '@/components/admin/AnalyticsHeader';
import { getAggregatedData, getAllEvents } from '@/lib/api';

export default async function AggregatedAnalyticsPage() {
    const data = await getAggregatedData();
    const events = await getAllEvents();

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="analytics" />

                <main className="flex-1 ml-20 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Header Section with Event Selector & Export */}
                        <AnalyticsHeader
                            events={events}
                            currentEventId="all"
                            data={data}
                            title="Analytics Overview"
                            description="Comprehensive performance data across all your events"
                        />

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Events"
                                value="54"
                                growth=""
                                trend="up"
                            />
                            <StatCard
                                title="Registrations"
                                value="7,506"
                                growth=""
                                trend="up"
                            />
                            <StatCard
                                title="Total Revenue"
                                value="$356,950"
                                growth=""
                                trend="up"
                            />
                            <StatCard
                                title="Satisfaction"
                                value="4.7/5.0"
                                growth=""
                                trend="up"
                            />
                        </div>

                        {/* Summary & Trends Section */}
                        <DashboardTabs data={data} />
                    </div>
                </main>
            </div>
        </div>
    );
}
