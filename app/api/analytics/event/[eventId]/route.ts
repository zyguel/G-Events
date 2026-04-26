import { NextRequest, NextResponse } from 'next/server';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { getEventById, getEventAnalytics } from '@/lib/actions/events';

// GET /api/analytics/event/[eventId] - Analytics for a specific event
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
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

        const [event, analytics] = await Promise.all([
            getEventById(eventNum),
            getEventAnalytics(eventNum),
        ]);

        if (!event) {
            return NextResponse.json(
                { success: false, error: `Event '${eventId}' not found` },
                { status: 404 }
            );
        }

        const eventData = {
            id: event.id.toString(),
            name: event.title || 'Untitled Event',
            date: event.event_start_at || 'Date TBD',
            status: event.is_published ? 'Published' : 'Draft',
            stats: analytics.stats,
            comments: analytics.comments || [],
            trends: analytics.trends,
            revenueBreakdown: analytics.revenueBreakdown,
            recentTransactions: analytics.recentTransactions,
        };

        return NextResponse.json({ success: true, data: eventData });
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching event analytics:', error);
        }
        return NextResponse.json(
            { success: false, error: 'Failed to fetch event analytics' },
            { status: 500 }
        );
    }
}
