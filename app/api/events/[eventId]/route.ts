import { NextRequest, NextResponse } from 'next/server';
import { getEvent, updateEvent, deleteEvent } from '@/lib/db';

// GET /api/events/[eventId] - Get a single event by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const id = parseInt(eventId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const event = await getEvent(id);
        return NextResponse.json({ success: true, data: event });
    } catch (error: any) {
        console.error('Error fetching event:', error);
        // Supabase throws when .single() finds no rows
        if (error.code === 'PGRST116') {
            return NextResponse.json(
                { success: false, error: 'Event not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch event' },
            { status: 500 }
        );
    }
}

// PATCH /api/events/[eventId] - Update an event
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const id = parseInt(eventId);
        const body = await request.json();

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        if (Object.keys(body).length === 0) {
            return NextResponse.json(
                { success: false, error: 'No fields provided to update' },
                { status: 400 }
            );
        }

        await updateEvent(id, body);
        return NextResponse.json({ success: true, message: 'Event updated successfully' });
    } catch (error: any) {
        console.error('Error updating event:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update event' },
            { status: 500 }
        );
    }
}

// DELETE /api/events/[eventId] - Delete an event
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const id = parseInt(eventId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        await deleteEvent(id);
        return NextResponse.json({ success: true, message: 'Event deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting event:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete event' },
            { status: 500 }
        );
    }
}
