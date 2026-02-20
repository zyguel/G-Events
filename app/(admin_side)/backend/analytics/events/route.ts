import { NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/api';

// GET /backend/analytics/events - List of all events (for dropdowns and selectors)
export async function GET() {
    try {
        const events = await getAllEvents();
        return NextResponse.json({ success: true, data: events });
    } catch (error: any) {
        console.error('Error fetching events list:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch events list' },
            { status: 500 }
        );
    }
}
