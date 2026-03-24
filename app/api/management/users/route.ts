import { NextRequest } from 'next/server';
import { getOrganizationUsers, inviteUser } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';
import { logger } from '@/lib/logger';
import { badRequest, created, internalServerError, ok } from '@/lib/utils/apiResponse';

// GET /api/management/users - List all users in organization
export async function GET(request: NextRequest) {
    try {
        await requireUser();
        const searchParams = request.nextUrl.searchParams;
        const orgId = searchParams.get('organizationId');

        const users = await getOrganizationUsers(
            orgId ? parseInt(orgId) : undefined
        );

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
        const body = await request.json();
        const { name, email, roleId, organizationId } = body;

        if (!name || !email || !roleId) {
            return badRequest('Missing required fields: name, email, roleId');
        }

        const newUser = await inviteUser(
            name,
            email,
            Number.parseInt(roleId, 10),
            organizationId ? Number.parseInt(organizationId, 10) : undefined
        );

        return created(newUser);
    } catch (error: unknown) {
        logger.error('api/management/users', 'Error inviting user', error);
        return internalServerError(error instanceof Error ? error.message : 'Failed to invite user');
    }
}
