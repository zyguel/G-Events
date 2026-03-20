import { NextRequest, NextResponse } from 'next/server';
import { updateRole, deleteRole, getRolePermissions } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';

// GET /api/management/roles/[id] - Get role details (permissions)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // params is a Promise in Next.js 15+
) {
    try {
        await requireUser();
        const { id } = await params;
        const roleId = parseInt(id);

        if (isNaN(roleId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role ID' },
                { status: 400 }
            );
        }

        const permissionIds = await getRolePermissions(roleId);

        return NextResponse.json({
            success: true,
            data: {
                id: roleId,
                permissionIds
            }
        });
    } catch (error: any) {
        console.error('Error fetching role details:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch role details' },
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
        const body = await request.json();
        const { name, description, permissionIds } = body;

        if (isNaN(roleId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role ID' },
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
            permissionIds || []
        );

        return NextResponse.json({ success: true, message: 'Role updated successfully' });
    } catch (error: any) {
        console.error('Error updating role:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update role' },
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

        if (isNaN(roleId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role ID' },
                { status: 400 }
            );
        }

        await deleteRole(roleId);

        return NextResponse.json({ success: true, message: 'Role deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting role:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete role' },
            { status: 500 }
        );
    }
}
