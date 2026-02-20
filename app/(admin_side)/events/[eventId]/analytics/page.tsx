import React from 'react';
import { notFound } from "next/navigation";

import StatCard from '@/components/admin/StatCard';
import DashboardTabs from '@/components/admin/DashboardTabs';
import AnalyticsHeader from '@/components/admin/AnalyticsHeader';
import { getEventById, getEvents } from "@/app/(admin_side)/backend/events"; // Use backend functions

export default async function EventAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // Redirect "all" to the aggregated analytics page
    if (eventId === 'all') {
        const { redirect } = await import('next/navigation');
        redirect('/analytics/all');
    }

    const id = parseInt(eventId);
    if (isNaN(id)) return notFound();

    const apiData = await getEventById(id);
    const allEventsRaw = await getEvents();

    if (!apiData) {
        return notFound();
    }

    // Derive status
    const now = new Date();
    const startDate = apiData.event_start_at ? new Date(apiData.event_start_at) : null;
    const endDate = apiData.event_end_at ? new Date(apiData.event_end_at) : null;

    let status: "Draft" | "Completed" | "Ongoing" | "Published" | "Not Yet Published" | "Not Started" | "Cancelled" = 'Draft';
    if (apiData.is_published) {
        if (endDate && endDate < now) {
            status = 'Completed';
        } else if (startDate && startDate <= now && endDate && endDate >= now) {
            status = 'Ongoing'; // or Live
        } else {
            status = 'Published'; // or Upcoming
        }
    }

    // Map apiData to the structure expected by components (mocking stats)
    const data = {
        id: apiData.id.toString(),
        name: apiData.title,
        date: apiData.event_start_at || '',
        status: status,
        stats: {
            registrations: 0,
            revenue: 0,
            expenses: 0,
            netProfit: 0,
            satisfaction: 0
        },
        // Mock trends if needed by DashboardTabs
        trends: { registrations: { weekly: [], weekLabels: [], registrationOpenDate: "", eventDate: "" }, attendance: { checkedIn: 0, noShow: 0, waitlisted: 0 } },
        revenueBreakdown: [],
        registrationType: [],
        recentTransactions: [],
        comments: []
    };

    // Map allEvents to simple list for selector
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
