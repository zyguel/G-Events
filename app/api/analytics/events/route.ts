import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';
import { EventSummary } from '@/lib/types';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';

// GET /api/analytics/events - List of all events (for dropdowns and selectors)
export async function GET() {
    try {
        await requireUser();
        const events = await getEvents();
        
        // Transform Event objects to EventSummary format
        const eventSummaries: EventSummary[] = events.map(event => ({
            id: event.id.toString(),
            name: event.title,
            date: event.event_start_at || 'Date TBD',
            status: event.is_published ? 'Published' : 'Draft'
        }));
        
        return NextResponse.json({ success: true, data: eventSummaries });
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching events list:', error);
        }
        return NextResponse.json(
            { success: false, error: 'Failed to fetch events list' },
            { status: 500 }
        );
    }
}
