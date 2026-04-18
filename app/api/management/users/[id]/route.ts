import { NextRequest, NextResponse } from 'next/server';
import {
    getOrganizationMemberNotificationContext,
    getOrganizationName,
    getRolePermissionNamesByOrganization,
    removeUserFromOrganization,
    updateUser,
} from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants';
import { getUserActiveOrganizationByEmail, parseOrganizationId } from '@/lib/auth/sessionRole';
import { logger } from '@/lib/logger';
import { sendManagementAccessChangedEmail, sendManagementRemovalEmail } from '@/lib/managementEmails';
import { invalidateManagementUsersCache } from '@/lib/managementCache';

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

// PATCH /api/management/users/[id] - Update user
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireUser();
        const authenticatedEmail = user.email?.trim().toLowerCase() ?? '';
        if (!authenticatedEmail) {
            return NextResponse.json(
                { success: false, error: 'Authenticated user email is missing' },
                { status: 400 }
            );
        }

        const { id } = await params;
        const userId = parseInt(id);
        const activeOrganizationId = await getActiveOrganizationId(request, authenticatedEmail);
        const body = await request.json();
        const { email, roleId } = body;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const parsedRoleId = Number.parseInt(String(roleId), 10);

        if (isNaN(userId) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid user ID or organization context' },
                { status: 400 }
            );
        }

        if (!normalizedEmail || Number.isNaN(parsedRoleId)) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: email, roleId' },
                { status: 400 }
            );
        }

        const beforeContext = await getOrganizationMemberNotificationContext(userId, activeOrganizationId);

        await updateUser(
            userId,
            normalizedEmail,
            parsedRoleId,
            activeOrganizationId
        );

        if (beforeContext.roleId !== parsedRoleId) {
            try {
                const [organizationName, updatedContext] = await Promise.all([
                    getOrganizationName(activeOrganizationId),
                    getOrganizationMemberNotificationContext(userId, activeOrganizationId),
                ]);

                const permissionNames = await getRolePermissionNamesByOrganization(
                    updatedContext.roleId,
                    activeOrganizationId
                );

                await sendManagementAccessChangedEmail({
                    to: updatedContext.email,
                    recipientName: updatedContext.name,
                    organizationName,
                    roleName: updatedContext.roleName,
                    permissionNames,
                    reason: 'role',
                    changeSummary: `Your role changed from ${beforeContext.roleName} to ${updatedContext.roleName}.`,
                });
            } catch (notificationError: unknown) {
                logger.warn('api/management/users/[id]', 'Role change email failed to send', notificationError);
            }
        }

        invalidateManagementUsersCache(activeOrganizationId);

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
        const user = await requireUser();
        const authenticatedEmail = user.email?.trim().toLowerCase() ?? '';
        if (!authenticatedEmail) {
            return NextResponse.json(
                { success: false, error: 'Authenticated user email is missing' },
                { status: 400 }
            );
        }

        const { id } = await params;
        const userId = parseInt(id);
        const activeOrganizationId = await getActiveOrganizationId(request, authenticatedEmail);

        if (isNaN(userId) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid user ID or organization context' },
                { status: 400 }
            );
        }

        const [organizationName, memberContext] = await Promise.all([
            getOrganizationName(activeOrganizationId),
            getOrganizationMemberNotificationContext(userId, activeOrganizationId),
        ]);

        const permissionNames = await getRolePermissionNamesByOrganization(
            memberContext.roleId,
            activeOrganizationId
        );

        await removeUserFromOrganization(userId, activeOrganizationId);

        try {
            await sendManagementRemovalEmail({
                to: memberContext.email,
                recipientName: memberContext.name,
                organizationName,
                roleName: memberContext.roleName,
                permissionNames,
                changeSummary: 'Your membership was removed and organization access has been revoked.',
            });
        } catch (notificationError: unknown) {
            logger.warn('api/management/users/[id]', 'Removal email failed to send', notificationError);
        }

        invalidateManagementUsersCache(activeOrganizationId);

        return NextResponse.json({ success: true, message: 'User removed successfully' });
    } catch (error: unknown) {
        console.error('Error removing user:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) || 'Failed to remove user' },
            { status: 500 }
        );
    }
}
