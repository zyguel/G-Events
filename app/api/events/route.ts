import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getEvents, createEvent } from '@/lib/db';
import { DEFAULT_ORG_ID } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { badRequest, created, internalServerError, ok, unauthorized } from '@/lib/utils/apiResponse';

// GET /api/events - List all events for the organization
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return unauthorized();
        }

        const searchParams = request.nextUrl.searchParams;
        const orgId = searchParams.get('organizationId');

        const events = await getEvents(orgId ? Number.parseInt(orgId, 10) : DEFAULT_ORG_ID);
        return ok(events);
    } catch (error: unknown) {
        logger.error('api/events', 'Error fetching events', error);
        return internalServerError(error instanceof Error ? error.message : 'Failed to fetch events');
    }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return unauthorized();
        }

        const body = await request.json();
        const { organizationId, ...fields } = body;

        if (!fields.title) {
            return badRequest('Missing required field: title');
        }

        const newEvent = await createEvent(
            organizationId ? Number.parseInt(organizationId, 10) : DEFAULT_ORG_ID,
            fields
        );

        return created(newEvent);
    } catch (error: unknown) {
        logger.error('api/events', 'Error creating event', error);
        return internalServerError(error instanceof Error ? error.message : 'Failed to create event');
    }
}

