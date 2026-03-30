import { NextRequest } from 'next/server';
import { getOrganizationUsers, inviteUser, UserAlreadyInOrganizationError } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants';
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole';
import { logger } from '@/lib/logger';
import { badRequest, conflict, created, internalServerError, ok } from '@/lib/utils/apiResponse';

async function getActiveOrganizationId(request: NextRequest): Promise<number | null> {
    const preferredOrganizationId = parseOrganizationId(
        request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
    );
    const context = await getCurrentUserActiveOrganization(preferredOrganizationId);
    return context.activeOrganizationId;
}

// GET /api/management/users - List all users in organization
export async function GET(request: NextRequest) {
    try {
        await requireUser();
        const activeOrganizationId = await getActiveOrganizationId(request);
        if (!activeOrganizationId) {
            return badRequest('No active organization selected');
        }

        const users = await getOrganizationUsers(activeOrganizationId);

        return ok(users);
    } catch (error: unknown) {
        logger.error('api/management/users', 'Error fetching users', error);
        return internalServerError(error instanceof Error ? error.message : 'Failed to fetch users');
    }
}

// POST /api/management/users - Invite new user
export async function POST(request: NextRequest) {
    try {
        await requireUser();
        const activeOrganizationId = await getActiveOrganizationId(request);
        if (!activeOrganizationId) {
            return badRequest('No active organization selected');
        }

        const body = await request.json();
        const { name, email, roleId } = body;
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const parsedRoleId = Number.parseInt(String(roleId), 10);

        if (!normalizedName || !normalizedEmail || Number.isNaN(parsedRoleId)) {
            return badRequest('Missing required fields: name, email, roleId');
        }

        const newUser = await inviteUser(
            normalizedName,
            normalizedEmail,
            parsedRoleId,
            activeOrganizationId
        );

        return created(newUser);
    } catch (error: unknown) {
        if (error instanceof UserAlreadyInOrganizationError) {
            return conflict(error.message);
        }

        logger.error('api/management/users', 'Error inviting user', error);
        return internalServerError(error instanceof Error ? error.message : 'Failed to invite user');
    }
}
