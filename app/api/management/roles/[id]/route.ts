import { NextRequest, NextResponse } from 'next/server';
import { updateRole, deleteRole, getRolePermissionsByOrganization } from '@/lib/db';
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

// GET /api/management/roles/[id] - Get role details (permissions)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // params is a Promise in Next.js 15+
) {
    try {
        await requireUser();
        const { id } = await params;
        const roleId = parseInt(id);
        const activeOrganizationId = await getActiveOrganizationId(request);

        if (isNaN(roleId) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid role ID or organization context' },
                { status: 400 }
            );
        }

        const permissionIds = await getRolePermissionsByOrganization(roleId, activeOrganizationId);

        return NextResponse.json({
            success: true,
            data: {
                id: roleId,
                permissionIds
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching role details:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to fetch role details' },
            { status: 500 }
        );
    }
}

// PATCH /api/management/roles/[id] - Update role
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireUser();
        const { id } = await params;
        const roleId = parseInt(id);
        const activeOrganizationId = await getActiveOrganizationId(request);
        const body = await request.json();
        const { name, description, permissionIds } = body;

        if (isNaN(roleId) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid role ID or organization context' },
                { status: 400 }
            );
        }

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: name' },
                { status: 400 }
            );
        }

        await updateRole(
            roleId,
            name,
            description || '',
            permissionIds || [],
            activeOrganizationId
        );

        return NextResponse.json({ success: true, message: 'Role updated successfully' });
    } catch (error: unknown) {
        console.error('Error updating role:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to update role' },
            { status: 500 }
        );
    }
}

// DELETE /api/management/roles/[id] - Delete role
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireUser();
        const { id } = await params;
        const roleId = parseInt(id);
        const activeOrganizationId = await getActiveOrganizationId(request);

        if (isNaN(roleId) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid role ID or organization context' },
                { status: 400 }
            );
        }

        await deleteRole(roleId, activeOrganizationId);

        return NextResponse.json({ success: true, message: 'Role deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting role:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to delete role' },
            { status: 500 }
        );
    }
}
