import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';
import { EventSummary } from '@/lib/types';
import { requireUser } from '@/lib/apiAuth';

// GET /api/analytics/general - List all events data
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
    } catch (error: any) {
        console.error('Error fetching general analytics:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch general analytics' },
            { status: 500 }
        );
    }
}
