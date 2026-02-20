import { NextRequest, NextResponse } from 'next/server';
import { getEvents, createEvent } from '@/lib/db';

const DEFAULT_ORG_ID = parseInt(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || '1');

// GET /backend/events - List all events for the organization
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const orgId = searchParams.get('organizationId');

        const events = await getEvents(orgId ? parseInt(orgId) : DEFAULT_ORG_ID);
        return NextResponse.json({ success: true, data: events });
    } catch (error: any) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch events' },
            { status: 500 }
        );
    }
}

// POST /backend/events - Create a new event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { organizationId, ...fields } = body;

        if (!fields.title) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: title' },
                { status: 400 }
            );
        }

        const newEvent = await createEvent(
            organizationId ? parseInt(organizationId) : DEFAULT_ORG_ID,
            fields
        );

        return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating event:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create event' },
            { status: 500 }
        );
    }
}
