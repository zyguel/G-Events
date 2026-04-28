import React from 'react';
import { notFound } from "next/navigation";

import { getEventById, getEvents, getEventAnalytics, getEventDemographics, getEventTickets } from "@/lib/actions/events";
import AnalyticsPageClient from "./AnalyticsPageClient";

export const metadata = {
    title: 'Analytics',
};

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

    return (
        <AnalyticsPageClient 
            data={{ ...data, events }}
            demographics={demographics}
            tickets={tickets}
            eventId={id}
        />
    );
}
