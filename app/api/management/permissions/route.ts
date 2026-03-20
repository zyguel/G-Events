import { NextResponse } from 'next/server';
import { getAllPermissions } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';

// GET /api/management/permissions - List all available permissions
export async function GET() {
    try {
        await requireUser();
        const permissions = await getAllPermissions();

        return NextResponse.json({ success: true, data: permissions });
    } catch (error: any) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch permissions' },
            { status: 500 }
        );
    }
}
