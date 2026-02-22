import { NextRequest, NextResponse } from 'next/server';
import { getEvent } from '@/lib/db';
import { EventData } from '@/lib/types';

// GET /api/analytics/event/[eventId] - Analytics for a specific event
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        if (!eventId) {
            return NextResponse.json(
                { success: false, error: 'Event ID is required' },
                { status: 400 }
            );
        }

        const eventNum = parseInt(eventId);
        if (isNaN(eventNum)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const event = await getEvent(eventNum);

        if (!event) {
            return NextResponse.json(
                { success: false, error: `Event '${eventId}' not found` },
                { status: 404 }
            );
        }

        // Transform Database Event to EventData format
        const eventData: EventData = {
            id: event.id.toString(),
            name: event.title,
            date: event.event_start_at || 'Date TBD',
            status: event.is_published ? 'Published' : 'Draft',
            stats: {
                totalEvents: 1,
                registrations: 0,
                revenue: 0,
                satisfaction: 0,
                expenses: 0,
                netProfit: 0
            },
            comments: [],
            trends: {
                registrations: {
                    weekly: [],
                    weekLabels: []
                },
                attendance: {
                    checkedIn: 0,
                    noShow: 0,
                    waitlisted: 0
                }
            },
            revenueBreakdown: [],
            recentTransactions: []
        };

        return NextResponse.json({ success: true, data: eventData });
    } catch (error: any) {
        console.error('Error fetching event analytics:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch event analytics' },
            { status: 500 }
        );
    }
}
