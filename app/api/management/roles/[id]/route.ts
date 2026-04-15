import { NextRequest, NextResponse } from 'next/server';
import {
    deleteRole,
    getOrganizationMembersByRole,
    getOrganizationName,
    getOrganizationRoleById,
    getRolePermissionNamesByOrganization,
    getRolePermissionsByOrganization,
    updateRole,
} from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants';
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole';
import { logger } from '@/lib/logger';
import { sendManagementAccessChangedEmail } from '@/lib/managementEmails';

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

function toSortedUniqueIds(values: number[]): number[] {
    return Array.from(new Set(values)).sort((a, b) => a - b);
}

function areSameNumberSets(left: number[], right: number[]): boolean {
    if (left.length !== right.length) {
        return false;
    }

    return left.every((value, index) => value === right[index]);
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
        const normalizedRoleName = typeof name === 'string' ? name.trim() : '';
        const normalizedPermissionIds = toSortedUniqueIds(
            Array.isArray(permissionIds)
                ? permissionIds
                    .map((permissionId) => Number.parseInt(String(permissionId), 10))
                    .filter((permissionId) => Number.isFinite(permissionId))
                : []
        );

        if (isNaN(roleId) || !activeOrganizationId) {
            return NextResponse.json(
                { success: false, error: 'Invalid role ID or organization context' },
                { status: 400 }
            );
        }

        if (!normalizedRoleName) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: name' },
                { status: 400 }
            );
        }

        const [previousRole, previousPermissionIds] = await Promise.all([
            getOrganizationRoleById(roleId, activeOrganizationId),
            getRolePermissionsByOrganization(roleId, activeOrganizationId),
        ]);

        const sortedPreviousPermissionIds = toSortedUniqueIds(previousPermissionIds);
        const roleRenamed = previousRole.name !== normalizedRoleName;
        const permissionsChanged = !areSameNumberSets(
            sortedPreviousPermissionIds,
            normalizedPermissionIds
        );

        await updateRole(
            roleId,
            normalizedRoleName,
            description || '',
            normalizedPermissionIds,
            activeOrganizationId
        );

        if (roleRenamed || permissionsChanged) {
            try {
                const [organizationName, members, permissionNames] = await Promise.all([
                    getOrganizationName(activeOrganizationId),
                    getOrganizationMembersByRole(roleId, activeOrganizationId),
                    getRolePermissionNamesByOrganization(roleId, activeOrganizationId),
                ]);

                const uniqueMembersByEmail = new Map<string, { name: string; email: string; roleName: string }>();
                for (const member of members) {
                    const normalizedEmail = member.email.trim().toLowerCase();
                    if (!normalizedEmail || uniqueMembersByEmail.has(normalizedEmail)) {
                        continue;
                    }

                    uniqueMembersByEmail.set(normalizedEmail, {
                        name: member.name,
                        email: normalizedEmail,
                        roleName: member.roleName,
                    });
                }

                let changeSummary = 'Your organization access has been updated.';
                let reason: 'role' | 'permissions' | 'role-and-permissions' = 'role-and-permissions';

                if (roleRenamed && permissionsChanged) {
                    changeSummary = `Your role was renamed from ${previousRole.name} to ${normalizedRoleName}, and role permissions were updated.`;
                    reason = 'role-and-permissions';
                } else if (roleRenamed) {
                    changeSummary = `Your role was renamed from ${previousRole.name} to ${normalizedRoleName}.`;
                    reason = 'role';
                } else if (permissionsChanged) {
                    changeSummary = `Permissions assigned to your role (${normalizedRoleName}) were updated.`;
                    reason = 'permissions';
                }

                const notificationJobs = Array.from(uniqueMembersByEmail.values()).map((member) =>
                    sendManagementAccessChangedEmail({
                        to: member.email,
                        recipientName: member.name,
                        organizationName,
                        roleName: member.roleName,
                        permissionNames,
                        reason,
                        changeSummary,
                    })
                );

                const sendResults = await Promise.allSettled(notificationJobs);
                const failures = sendResults.filter((result) => result.status === 'rejected').length;

                if (failures > 0) {
                    logger.warn(
                        'api/management/roles/[id]',
                        `Failed to send ${failures} role update notifications`
                    );
                }
            } catch (notificationError: unknown) {
                logger.warn('api/management/roles/[id]', 'Role update emails failed to send', notificationError);
            }
        }

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
