import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationRoles, createRole } from '@/lib/db';

// GET /backend/management/roles - List all roles in organization
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const orgId = searchParams.get('organizationId');

        const roles = await getOrganizationRoles(
            orgId ? parseInt(orgId) : undefined
        );

        return NextResponse.json({ success: true, data: roles });
    } catch (error: any) {
        console.error('Error fetching roles:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch roles' },
            { status: 500 }
        );
    }
}

// POST /backend/management/roles - Create new role
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, permissionIds, organizationId } = body;

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
            organizationId ? parseInt(organizationId) : undefined
        );

        return NextResponse.json({ success: true, data: newRole }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating role:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create role' },
            { status: 500 }
        );
    }
}
