import React from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import DashboardTabs from '@/components/admin/DashboardTabs';
import AnalyticsHeader from '@/components/admin/AnalyticsHeader';
import { getEvents, getGeneralAnalytics } from '@/lib/actions/events';
import PermissionGate from '@/components/admin/PermissionGate';

export default async function AggregatedAnalyticsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
    const resolvedParams = await searchParams;
    const yearParam = resolvedParams.year ? parseInt(resolvedParams.year, 10) : undefined;

    // Fetch real data in parallel
    const [analytics, allEventsRaw] = await Promise.all([
        getGeneralAnalytics(yearParam),
        getEvents(),
    ]);

    // Format helpers
    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
    const formatNumber = (v: number) =>
        new Intl.NumberFormat('en-US').format(v);

    // Map events for the selector dropdown
    const events = allEventsRaw.map((e: any) => {
        const now = new Date();
        const start = e.event_start_at ? new Date(e.event_start_at) : null;
        const end = e.event_end_at ? new Date(e.event_end_at) : null;
        let status: "Draft" | "Completed" | "Ongoing" | "Published" | "Not Yet Published" | "Not Started" | "Cancelled" = 'Draft';
        if (e.is_published) {
            if (end && end < now) status = 'Completed';
            else if (start && start <= now && end && end >= now) status = 'Ongoing';
            else status = 'Published';
        }
        return { id: e.id.toString(), name: e.title, date: e.event_start_at || '', status };
    });

    // Shape data for DashboardTabs (uses the same structure as per-event analytics)
    const data = {
        id: 'all',
        name: 'Analytics Overview',
        date: new Date().getFullYear().toString(),
        status: 'Ongoing' as const,
        stats: {
            totalEvents: analytics.stats.totalEvents,
            registrations: analytics.stats.registrations,
            revenue: analytics.stats.revenue,
            expenses: 0,
            netProfit: analytics.stats.revenue,
            satisfaction: analytics.stats.satisfaction,
        },
        trends: analytics.trends,
        revenueBreakdown: analytics.revenueBreakdown,
        recentTransactions: analytics.recentTransactions || [],
        comments: analytics.comments || [],
        topEvents: analytics.topEvents,
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="analytics" />

                <main className="flex-1 lg:ml-20 overflow-y-auto p-4 md:p-8">
                    <PermissionGate permission="View Reports">
                        <div className="max-w-7xl mx-auto space-y-8">

                            {/* Header Section with Event Selector & Export */}
                            <AnalyticsHeader
                                events={events}
                                currentEventId="all"
                                data={data}
                                title="Analytics Overview"
                                description="Comprehensive performance data across all your events"
                            />

                            {/* KPI Cards — real values from DB */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    title="Total Events"
                                    value={formatNumber(analytics.stats.totalEvents)}
                                    growth=""
                                    trend="up"
                                />
                                <StatCard
                                    title="Registrations"
                                    value={formatNumber(analytics.stats.registrations)}
                                    growth=""
                                    trend="up"
                                />
                                <StatCard
                                    title="Total Revenue"
                                    value={formatCurrency(analytics.stats.revenue)}
                                    growth=""
                                    trend="up"
                                />
                                <StatCard
                                    title="Satisfaction"
                                    value={analytics.stats.satisfaction > 0
                                        ? `${analytics.stats.satisfaction}/5.0`
                                        : 'N/A'}
                                    growth=""
                                    trend="up"
                                />
                            </div>

                            {/* Summary & Trends Section */}
                            <DashboardTabs data={data} hideDemographics />
                        </div>
                    </PermissionGate>
                </main>
            </div>
        </div>
    );
}
