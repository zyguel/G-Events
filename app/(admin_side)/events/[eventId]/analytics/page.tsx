import React from 'react';
import { notFound } from "next/navigation";

import StatCard from '@/components/admin/StatCard';
import DashboardTabs from '@/components/admin/DashboardTabs';
import AnalyticsHeader from '@/components/admin/AnalyticsHeader';
import { getEventData, getAllEvents } from '@/lib/api';

export default async function EventAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // Redirect "all" to the aggregated analytics page
    if (eventId === 'all') {
        const { redirect } = await import('next/navigation');
        redirect('/analytics/all');
    }

    const data = await getEventData(eventId);
    const events = await getAllEvents();

    if (!data) {
        return notFound();
    }

    // Create sidebar event object
    const sidebarEvent = {
        id: eventId,
        name: data.name,
        date: data.date,
        status: data.status
    };

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Format number with commas
    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    return (
        <div className="h-full p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section with Event Selector & Export */}
                <AnalyticsHeader
                    events={events}
                    currentEventId={eventId}
                    data={data}
                    title={data.name}
                    description={`Performance analytics for ${data.name} • ${data.date}`}
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Registrations"
                        value={formatNumber(data.stats.registrations)}
                        growth=""
                        trend="up"
                    />
                    <StatCard
                        title="Revenue"
                        value={formatCurrency(data.stats.revenue)}
                        growth=""
                        trend="up"
                    />
                    <StatCard
                        title="Net Profit"
                        value={formatCurrency(data.stats.netProfit)}
                        growth=""
                        trend="up"
                    />
                    <StatCard
                        title="Satisfaction"
                        value={`${data.stats.satisfaction}/5.0`}
                        growth=""
                        trend="up"
                    />
                </div>

                {/* Summary & Trends Section */}
                <DashboardTabs data={data} />
            </div>
        </div>
    );
}
