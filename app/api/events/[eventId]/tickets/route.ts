import { NextRequest, NextResponse } from 'next/server';
import { getTickets, createTicket } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';

// GET /api/events/[eventId]/tickets - List all tickets for an event
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);
        const includeDeleted = request.nextUrl.searchParams.get('includeDeleted') === '1';

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const tickets = await getTickets(id, { includeDeleted });
        return NextResponse.json({ success: true, data: tickets });
    } catch (error: unknown) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
            { status: 500 }
        );
    }
}

// POST /api/events/[eventId]/tickets - Create a new ticket
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);
        const body = await request.json();

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        if (!body.name) {
            return NextResponse.json(
                { success: false, error: 'Ticket name is required' },
                { status: 400 }
            );
        }

        const ticket = await createTicket(id, {
            name: body.name,
            description: body.description,
            price: body.price,
            free_ticket_approval_mode: body.free_ticket_approval_mode,
            available_quantity: body.available_quantity,
            selling_start_at: body.selling_start_at,
            selling_end_at: body.selling_end_at,
            selling_start_time: body.selling_start_time,
            selling_end_time: body.selling_end_time,
        });

        return NextResponse.json({ success: true, data: ticket }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating ticket:', error);
        const status =
            typeof (error as { statusCode?: number })?.statusCode === 'number'
                ? (error as { statusCode: number }).statusCode
                : 500;
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to create ticket' },
            { status }
        );
    }
}
