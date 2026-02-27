import { NextRequest, NextResponse } from 'next/server';
import { getTicket, updateTicket, deleteTicket } from '@/lib/db';

// GET /api/events/[eventId]/tickets/[ticketId] - Get a single ticket
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; ticketId: string }> }
) {
    try {
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
        console.error('Error fetching ticket:', error);
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
        const { ticketId } = await params;
        const id = parseInt(ticketId);
        const body = await request.json();

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ticket ID' },
                { status: 400 }
            );
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
        console.error('Error updating ticket:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update ticket' },
            { status: 500 }
        );
    }
}

// DELETE /api/events/[eventId]/tickets/[ticketId] - Delete a ticket
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; ticketId: string }> }
) {
    try {
        const { ticketId } = await params;
        const id = parseInt(ticketId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ticket ID' },
                { status: 400 }
            );
        }

        await deleteTicket(id);
        return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting ticket:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete ticket' },
            { status: 500 }
        );
    }
}
