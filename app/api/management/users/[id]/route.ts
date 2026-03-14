import { NextRequest, NextResponse } from 'next/server';
import { updateUser, removeUserFromOrganization } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';

// PATCH /api/management/users/[id] - Update user
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireUser();
        const { id } = await params;
        const userId = parseInt(id);
        const body = await request.json();
        const { email, roleId, organizationId } = body;

        if (isNaN(userId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid user ID' },
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
            organizationId ? parseInt(organizationId) : undefined
        );

        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update user' },
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

        if (isNaN(userId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        await removeUserFromOrganization(userId);

        return NextResponse.json({ success: true, message: 'User removed successfully' });
    } catch (error: any) {
        console.error('Error removing user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to remove user' },
            { status: 500 }
        );
    }
}
