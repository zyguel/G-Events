import { NextRequest, NextResponse } from 'next/server';
import { getEvent, updateEvent } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants';
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole';
import { deleteEvent as deleteEventAction } from '@/lib/actions/events';

async function getScopedOrganizationId(request: NextRequest) {
    const preferredOrganizationId = parseOrganizationId(
        request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
    );
    const orgContext = await getCurrentUserActiveOrganization(preferredOrganizationId);

    return orgContext.activeOrganizationId;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unexpected error';
}

// GET /api/events/[eventId] - Get a single event by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);
        const activeOrganizationId = await getScopedOrganizationId(request);

        if (isNaN(id) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID or organization context' },
                { status: 400 }
            );
        }

        const event = await getEvent(id, activeOrganizationId);
        return NextResponse.json({ success: true, data: event });
    } catch (error: unknown) {
        console.error('Error fetching event:', error);
        // Supabase throws when .single() finds no rows
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: string }).code === 'PGRST116'
        ) {
            return NextResponse.json(
                { success: false, error: 'Event not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to fetch event' },
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
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);
        const activeOrganizationId = await getScopedOrganizationId(request);
        const body = await request.json();

        if (isNaN(id) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID or organization context' },
                { status: 400 }
            );
        }

        if (Object.keys(body).length === 0) {
            return NextResponse.json(
                { success: false, error: 'No fields provided to update' },
                { status: 400 }
            );
        }

        await updateEvent(id, body, activeOrganizationId);
        return NextResponse.json({ success: true, message: 'Event updated successfully' });
    } catch (error: unknown) {
        console.error('Error updating event:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to update event' },
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
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);
        const activeOrganizationId = await getScopedOrganizationId(request);

        if (isNaN(id) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID or organization context' },
                { status: 400 }
            );
        }

        const result = await deleteEventAction(id);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Failed to delete event' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Event deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting event:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to delete event' },
            { status: 500 }
        );
    }
}
