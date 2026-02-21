import { NextRequest, NextResponse } from 'next/server';
import { getEventData } from '@/lib/api';

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

        const data = await getEventData(eventId);

        if (!data) {
            return NextResponse.json(
                { success: false, error: `Event '${eventId}' not found` },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching event analytics:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch event analytics' },
            { status: 500 }
        );
    }
}
