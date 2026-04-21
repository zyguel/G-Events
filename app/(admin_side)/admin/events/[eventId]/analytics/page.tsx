import React from 'react';
import { notFound } from "next/navigation";

import StatCard from '@/components/admin/StatCard';
import DashboardTabs from '@/components/admin/DashboardTabs';
import AnalyticsHeader from '@/components/admin/AnalyticsHeader';
import { getEventById, getEvents, getEventAnalytics, getEventDemographics, getEventTickets } from "@/lib/actions/events";


export default async function EventAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // Support /admin/events/all/analytics as a special case (no slug)
    if (eventId === 'all') {
        const { redirect } = await import('next/navigation');
        redirect('/analytics/all');
    }

    // eventId is otherwise a slug like "my-event-123"
    const slug = eventId;
    const idPart = slug.split('-').pop() ?? '';
    const id = parseInt(idPart, 10);
    if (isNaN(id)) return notFound();

    // Fetch event details + real analytics in parallel
    const [apiData, allEventsRaw, analytics, demographics, tickets] = await Promise.all([
        getEventById(id),
        getEvents(),
        getEventAnalytics(id),
        getEventDemographics(id),
        getEventTickets(id),
    ]);


    if (!apiData) {
        return notFound();
    }

    // Derive status from DB fields
    const now = new Date();
    const startDate = apiData.event_start_at ? new Date(apiData.event_start_at) : null;
    const endDate = apiData.event_end_at ? new Date(apiData.event_end_at) : null;

    let status: "Draft" | "Completed" | "Ongoing" | "Published" | "Not Yet Published" | "Not Started" | "Cancelled" = 'Draft';
    if (apiData.is_published) {
        if (endDate && endDate < now) {
            status = 'Completed';
        } else if (startDate && startDate <= now && endDate && endDate >= now) {
            status = 'Ongoing';
        } else {
            status = 'Published';
        }
    }

    // Build the data object from real DB values
    const data = {
        id: apiData.id.toString(),
        name: apiData.title,
        date: apiData.event_start_at || '',
        status,
        stats: analytics.stats,
        trends: analytics.trends,
        revenueBreakdown: analytics.revenueBreakdown,
        recentTransactions: analytics.recentTransactions,
        comments: analytics.comments || []
    };

    // Map all events to simple list for the selector dropdown
    const events = allEventsRaw.map((e: any) => {
        const eNow = new Date();
        const eStart = e.event_start_at ? new Date(e.event_start_at) : null;
        const eEnd = e.event_end_at ? new Date(e.event_end_at) : null;

        let eStatus: "Draft" | "Completed" | "Ongoing" | "Published" | "Not Yet Published" | "Not Started" | "Cancelled" = 'Draft';
        if (e.is_published) {
            if (eEnd && eEnd < eNow) {
                eStatus = 'Completed';
            } else if (eStart && eStart <= eNow && eEnd && eEnd >= eNow) {
                eStatus = 'Ongoing';
            } else {
                eStatus = 'Published';
            }
        }

        return {
            id: e.id.toString(),
            name: e.title,
            date: e.event_start_at || '',
            status: eStatus
        };
    });

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
                    data={{ ...data, demographics }}
                    title={data.name}
                    description={`Performance analytics for ${data.name} • ${data.date ? new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}`}
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Registrations"
                        value={formatNumber(data.stats.registrations)}
                    />
                    <StatCard
                        title="Revenue"
                        value={formatCurrency(data.stats.revenue)}
                    />
                    <StatCard
                        title="Net Profit"
                        value={formatCurrency(data.stats.netProfit)}
                    />
                    <StatCard
                        title="Satisfaction"
                        value={data.stats.satisfaction > 0 ? `${data.stats.satisfaction}/5.0` : 'N/A'}
                    />
                </div>

                {/* Summary & Trends Section */}
                <DashboardTabs 
                    data={data} 
                    demographics={demographics} 
                    tickets={tickets}
                    eventId={id}
                />

            </div>
        </div>
    );
}
