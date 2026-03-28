import { NextRequest, NextResponse } from 'next/server';
import { updateUser, removeUserFromOrganization } from '@/lib/db';
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

// PATCH /api/management/users/[id] - Update user
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireUser();
        const { id } = await params;
        const userId = parseInt(id);
        const activeOrganizationId = await getActiveOrganizationId(request);
        const body = await request.json();
        const { email, roleId } = body;

        if (isNaN(userId) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid user ID or organization context' },
                { status: 400 }
            );
        }

        if (!email || !roleId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: email, roleId' },
                { status: 400 }
            );
        }

        await updateUser(
            userId,
            email,
            parseInt(roleId),
            activeOrganizationId
        );

        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (error: unknown) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE /api/management/users/[id] - Remove user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireUser();
        const { id } = await params;
        const userId = parseInt(id);
        const activeOrganizationId = await getActiveOrganizationId(request);

        if (isNaN(userId) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid user ID or organization context' },
                { status: 400 }
            );
        }

        await removeUserFromOrganization(userId, activeOrganizationId);

        return NextResponse.json({ success: true, message: 'User removed successfully' });
    } catch (error: unknown) {
        console.error('Error removing user:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to remove user' },
            { status: 500 }
        );
    }
}
