import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationUsers, inviteUser } from '@/lib/db';

// GET /backend/management/users - List all users in organization
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const orgId = searchParams.get('organizationId');

        const users = await getOrganizationUsers(
            orgId ? parseInt(orgId) : undefined
        );

        return NextResponse.json({ success: true, data: users });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST /backend/management/users - Invite new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, roleId, organizationId } = body;

        if (!name || !email || !roleId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: name, email, roleId' },
                { status: 400 }
            );
        }

        const newUser = await inviteUser(
            name,
            email,
            parseInt(roleId),
            organizationId ? parseInt(organizationId) : undefined
        );

        return NextResponse.json({ success: true, data: newUser }, { status: 201 });
    } catch (error: any) {
        console.error('Error inviting user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to invite user' },
            { status: 500 }
        );
    }
}
