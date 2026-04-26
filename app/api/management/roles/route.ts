import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationRoles, createRole } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants';
import { getUserActiveOrganizationByEmail, parseOrganizationId } from '@/lib/auth/sessionRole';
import { getCachedManagementRoles, invalidateManagementRolesCache, setCachedManagementRoles } from '@/lib/managementCache';

async function getActiveOrganizationId(
    request: NextRequest,
    userEmail: string
): Promise<number | null> {
    const preferredOrganizationId = parseOrganizationId(
        request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
    );
    const context = await getUserActiveOrganizationByEmail(userEmail, preferredOrganizationId);
    return context.activeOrganizationId;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unexpected error';
}

// GET /api/management/roles - List all roles in organization
export async function GET(request: NextRequest) {
    try {
        const user = await requireUser();
        const authenticatedEmail = user.email?.trim().toLowerCase() ?? '';
        if (!authenticatedEmail) {
            return NextResponse.json(
                { success: false, error: 'Authenticated user email is missing' },
                { status: 400 }
            );
        }

        const activeOrganizationId = await getActiveOrganizationId(request, authenticatedEmail);
        if (!activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'No active organization selected' },
                { status: 400 }
            );
        }

        const cachedRoles = getCachedManagementRoles(activeOrganizationId);
        if (cachedRoles) {
            const cachedResponse = NextResponse.json({ success: true, data: cachedRoles });
            cachedResponse.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
            return cachedResponse;
        }

        const roles = await getOrganizationRoles(activeOrganizationId);
        setCachedManagementRoles(activeOrganizationId, roles);

        const response = NextResponse.json({ success: true, data: roles });
        response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
        return response;
    } catch (error: unknown) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching roles:', error);
        }
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to fetch roles' },
            { status: 500 }
        );
    }
}

// POST /api/management/roles - Create new role
export async function POST(request: NextRequest) {
    try {
        const user = await requireUser();
        const authenticatedEmail = user.email?.trim().toLowerCase() ?? '';
        if (!authenticatedEmail) {
            return NextResponse.json(
                { success: false, error: 'Authenticated user email is missing' },
                { status: 400 }
            );
        }

        const activeOrganizationId = await getActiveOrganizationId(request, authenticatedEmail);
        if (!activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'No active organization selected' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, description, permissionIds } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: name' },
                { status: 400 }
            );
        }

        const newRole = await createRole(
            name,
            description || '',
            permissionIds || [],
            activeOrganizationId
        );

        invalidateManagementRolesCache(activeOrganizationId);

        return NextResponse.json({ success: true, data: newRole }, { status: 201 });
    } catch (error: unknown) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error creating role:', error);
        }
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to create role' },
            { status: 500 }
        );
    }
}
