import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationRoles, createRole } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants';
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole';

async function getActiveOrganizationId(request: NextRequest): Promise<number | null> {
    const preferredOrganizationId = parseOrganizationId(
        request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
    );
    const context = await getCurrentUserActiveOrganization(preferredOrganizationId);
    return context.activeOrganizationId;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unexpected error';
}

// GET /api/management/roles - List all roles in organization
export async function GET(request: NextRequest) {
    try {
        await requireUser();
        const activeOrganizationId = await getActiveOrganizationId(request);
        if (!activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'No active organization selected' },
                { status: 400 }
            );
        }

        const roles = await getOrganizationRoles(activeOrganizationId);

        return NextResponse.json({ success: true, data: roles });
    } catch (error: unknown) {
        console.error('Error fetching roles:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to fetch roles' },
            { status: 500 }
        );
    }
}

// POST /api/management/roles - Create new role
export async function POST(request: NextRequest) {
    try {
        await requireUser();
        const activeOrganizationId = await getActiveOrganizationId(request);
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

        return NextResponse.json({ success: true, data: newRole }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating role:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to create role' },
            { status: 500 }
        );
    }
}
