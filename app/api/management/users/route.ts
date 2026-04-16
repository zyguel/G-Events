import { NextRequest } from 'next/server';
import {
    getOrganizationName,
    getOrganizationUsers,
    getRolePermissionNamesByOrganization,
    inviteUser,
    UserAlreadyInOrganizationError,
} from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';
import { createAdminClient } from '@/lib/supabase-server';
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants';
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole';
import { logger } from '@/lib/logger';
import { sendManagementInvitationEmail } from '@/lib/managementEmails';
import { badRequest, conflict, created, internalServerError, ok } from '@/lib/utils/apiResponse';
import type { UserWithRole } from '@/lib/supabase';

const PROFILE_IMAGE_BUCKET = 'ProfileIMG';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

function getMetadataAvatarUrl(metadata: unknown): string | null {
    const value = metadata as Record<string, unknown> | null;
    if (!value) return null;

    const candidates = [
        value.avatar_url,
        value.picture,
        value.photo_url,
        value.image,
        value.profile_image_url,
    ];

    const firstUrl = candidates.find((candidate) => {
        if (typeof candidate !== 'string') return false;
        const trimmed = candidate.trim();
        if (!trimmed) return false;
        return !trimmed.startsWith('storage:');
    });

    return typeof firstUrl === 'string' ? firstUrl : null;
}

function getStoragePathFromMetadata(metadata: unknown): string | null {
    const value = metadata as Record<string, unknown> | null;
    if (!value) return null;

    const profilePath = typeof value.profile_image_path === 'string' ? value.profile_image_path.trim() : '';
    if (profilePath) return profilePath;

    const avatarMarker = typeof value.avatar_url === 'string' ? value.avatar_url.trim() : '';
    if (avatarMarker.startsWith('storage:')) {
        return avatarMarker.slice('storage:'.length).trim() || null;
    }

    return null;
}

async function enrichUsersWithAvatars(users: UserWithRole[]): Promise<UserWithRole[]> {
    if (!users.length) return users;

    const adminClient = await createAdminClient();
    const emailToMember = new Map<string, UserWithRole>();
    users.forEach((user) => {
        const normalized = user.email.trim().toLowerCase();
        if (normalized) {
            emailToMember.set(normalized, user);
        }
    });

    const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });

    if (listError || !listData?.users?.length) {
        if (listError) {
            logger.warn('api/management/users', 'Failed to list auth users for avatar enrichment', listError);
        }
        return users;
    }

    const avatarByEmail = new Map<string, string>();
    await Promise.all(
        listData.users.map(async (authUser) => {
            const email = authUser.email?.trim().toLowerCase();
            if (!email || !emailToMember.has(email)) return;

            const path = getStoragePathFromMetadata(authUser.user_metadata);
            if (path) {
                const { data, error } = await adminClient.storage
                    .from(PROFILE_IMAGE_BUCKET)
                    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN_SECONDS);

                if (!error && data?.signedUrl) {
                    avatarByEmail.set(email, `${data.signedUrl}&t=${Date.now()}`);
                    return;
                }
            }

            const metadataAvatarUrl = getMetadataAvatarUrl(authUser.user_metadata);
            if (metadataAvatarUrl) {
                avatarByEmail.set(email, metadataAvatarUrl);
            }
        })
    );

    return users.map((user) => {
        const normalized = user.email.trim().toLowerCase();
        const avatarUrl = avatarByEmail.get(normalized);
        return avatarUrl ? { ...user, avatar: avatarUrl } : user;
    });
}

async function getActiveOrganizationId(request: NextRequest): Promise<number | null> {
    const preferredOrganizationId = parseOrganizationId(
        request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
    );
    const context = await getCurrentUserActiveOrganization(preferredOrganizationId);
    return context.activeOrganizationId;
}

// GET /api/management/users - List all users in organization
export async function GET(request: NextRequest) {
    try {
        await requireUser();
        const activeOrganizationId = await getActiveOrganizationId(request);
        if (!activeOrganizationId) {
            return badRequest('No active organization selected');
        }

        const users = await getOrganizationUsers(activeOrganizationId);
        const usersWithAvatars = await enrichUsersWithAvatars(users);

        return ok(usersWithAvatars);
    } catch (error: unknown) {
        logger.error('api/management/users', 'Error fetching users', error);
        return internalServerError(error instanceof Error ? error.message : 'Failed to fetch users');
    }
}

// POST /api/management/users - Invite new user
export async function POST(request: NextRequest) {
    try {
        await requireUser();
        const activeOrganizationId = await getActiveOrganizationId(request);
        if (!activeOrganizationId) {
            return badRequest('No active organization selected');
        }

        const body = await request.json();
        const { name, email, roleId } = body;
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const parsedRoleId = Number.parseInt(String(roleId), 10);

        if (!normalizedName || !normalizedEmail || Number.isNaN(parsedRoleId)) {
            return badRequest('Missing required fields: name, email, roleId');
        }

        const newUser = await inviteUser(
            normalizedName,
            normalizedEmail,
            parsedRoleId,
            activeOrganizationId
        );

        try {
            const [organizationName, permissionNames] = await Promise.all([
                getOrganizationName(activeOrganizationId),
                getRolePermissionNamesByOrganization(parsedRoleId, activeOrganizationId),
            ]);

            await sendManagementInvitationEmail({
                to: normalizedEmail,
                recipientName: normalizedName,
                organizationName,
                roleName: newUser.role,
                permissionNames,
            });
        } catch (notificationError: unknown) {
            logger.warn('api/management/users', 'Invite email failed to send', notificationError);
        }

        return created(newUser);
    } catch (error: unknown) {
        if (error instanceof UserAlreadyInOrganizationError) {
            return conflict(error.message);
        }

        logger.error('api/management/users', 'Error inviting user', error);
        return internalServerError(error instanceof Error ? error.message : 'Failed to invite user');
    }
}
