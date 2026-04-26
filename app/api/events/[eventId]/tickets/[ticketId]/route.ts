import { NextRequest, NextResponse } from 'next/server';
import { getTicket, updateTicket, deleteTicket, restoreTicket } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';

// GET /api/events/[eventId]/tickets/[ticketId] - Get a single ticket
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; ticketId: string }> }
) {
    try {
        await requireUser();
        const { ticketId } = await params;
        const id = parseInt(ticketId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ticket ID' },
                { status: 400 }
            );
        }

        const ticket = await getTicket(id);
        return NextResponse.json({ success: true, data: ticket });
    } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching ticket:', error);
        }
        if (error.code === 'PGRST116') {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch ticket' },
            { status: 500 }
        );
    }
}

// PATCH /api/events/[eventId]/tickets/[ticketId] - Update a ticket
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; ticketId: string }> }
) {
    try {
        await requireUser();
        const { eventId, ticketId } = await params;
        const eventNumId = parseInt(eventId, 10);
        const id = parseInt(ticketId);
        const body = await request.json();

        if (isNaN(eventNumId) || isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event or ticket ID' },
                { status: 400 }
            );
        }

        if (body?.action === 'restore') {
            const restoredTicket = await restoreTicket(id, eventNumId);
            return NextResponse.json({ success: true, data: restoredTicket });
        }

        if (Object.keys(body).length === 0) {
            return NextResponse.json(
                { success: false, error: 'No fields provided to update' },
                { status: 400 }
            );
        }

        const ticket = await updateTicket(id, body);
        return NextResponse.json({ success: true, data: ticket });
    } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error updating ticket:', error);
        }
        const status = typeof error?.statusCode === 'number' ? error.statusCode : 500;
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update ticket' },
            { status }
        );
    }
}

// DELETE /api/events/[eventId]/tickets/[ticketId] - Delete a ticket
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; ticketId: string }> }
) {
    try {
        await requireUser();
        const { eventId, ticketId } = await params;
        const eventNumId = parseInt(eventId, 10);
        const id = parseInt(ticketId);

        if (isNaN(eventNumId) || isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event or ticket ID' },
                { status: 400 }
            );
        }

        await deleteTicket(id, eventNumId);
        return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error deleting ticket:', error);
        }
        const status = typeof error?.statusCode === 'number' ? error.statusCode : 500;
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete ticket' },
            { status }
        );
    }
}
