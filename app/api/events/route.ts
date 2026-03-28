import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getEvents, createEvent } from '@/lib/db';
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants';
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole';
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

        const preferredOrganizationId = parseOrganizationId(
            request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
        );
        const orgContext = await getCurrentUserActiveOrganization(preferredOrganizationId);
        if (!orgContext.activeOrganizationId) {
            return badRequest('No active organization selected');
        }

        const events = await getEvents(orgContext.activeOrganizationId);
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
        const { ...fields } = body;

        if (!fields.title) {
            return badRequest('Missing required field: title');
        }

        const preferredOrganizationId = parseOrganizationId(
            request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
        );
        const orgContext = await getCurrentUserActiveOrganization(preferredOrganizationId);
        if (!orgContext.activeOrganizationId) {
            return badRequest('No active organization selected');
        }

        const newEvent = await createEvent(
            orgContext.activeOrganizationId,
            fields
        );

        return created(newEvent);
    } catch (error: unknown) {
        logger.error('api/events', 'Error creating event', error);
        return internalServerError(error instanceof Error ? error.message : 'Failed to create event');
    }
}

