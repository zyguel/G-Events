'use server'

import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants'
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole'

export interface UserPermissions {
    role: string
    roleId: number
    permissions: string[]
    isAdmin: boolean
}

const EMPTY: UserPermissions = {
    role: '',
    roleId: 0,
    permissions: [],
    isAdmin: false,
}

const PERMISSIONS_CACHE_TTL_MS = 2 * 60 * 1000
type PermissionCacheEntry = {
    value: UserPermissions
    expiresAt: number
}
const permissionCache = new Map<string, PermissionCacheEntry>()

async function getPermissionLookupClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }

    return createClient()
}

/**
 * Looks up a user's role and permissions by their email.
 * Email is provided by the client-side auth session.
 */
export async function getCurrentUserPermissions(email: string): Promise<UserPermissions> {
    try {
        const authSupabase = await createClient()
        const {
            data: { user },
        } = await authSupabase.auth.getUser()

        const authenticatedEmail = user?.email?.trim().toLowerCase()
        const requestedEmail = email?.trim().toLowerCase()

        if (!authenticatedEmail) {
            logger.warn('permissions', 'No authenticated user email found')
            return EMPTY
        }

        if (requestedEmail && requestedEmail !== authenticatedEmail) {
            logger.warn('permissions', 'Ignoring mismatched requested email for permissions lookup', {
                requestedEmail,
                authenticatedEmail,
            })
        }

        const cookieStore = await cookies()
        const preferredOrganizationId = parseOrganizationId(cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value)
        const orgContext = await getCurrentUserActiveOrganization(preferredOrganizationId)

        if (!orgContext.activeOrganizationId) {
            logger.warn('permissions', 'No active organization found for authenticated user', {
                authenticatedEmail,
            })
            return EMPTY
        }

        const cacheKey = `${authenticatedEmail}:${orgContext.activeOrganizationId}`
        const cached = permissionCache.get(cacheKey)
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value
        }

        const supabase = await getPermissionLookupClient()
        logger.debug('permissions', 'Looking up permissions', {
            email: authenticatedEmail,
            organizationId: orgContext.activeOrganizationId,
        })

        // ── Step 1: Find the User row ─────────────────────────────────────────
        const { data: appUser, error: userError } = await supabase
            .from('User')
            .select('id')
            .ilike('email', authenticatedEmail)
            .maybeSingle()

        if (userError) {
            logger.error('permissions', 'Error querying User table', userError.message)
            return EMPTY
        }

        if (!appUser) {
            logger.warn('permissions', 'No User row found for email', { email: authenticatedEmail })
            return EMPTY
        }

        logger.debug('permissions', 'Found user record', { userId: appUser.id })

        // ── Step 2: Find their OrganizationUserRole ───────────────────────────
        const { data: orgRole, error: roleError } = await supabase
            .from('OrganizationUserRole')
            .select(`
                id,
                organization_id,
                organization_role_id,
                OrganizationRole (
                    id,
                    name
                )
            `)
            .eq('user_id', appUser.id)
            .eq('organization_id', orgContext.activeOrganizationId)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (roleError) {
            logger.error('permissions', 'Error querying OrganizationUserRole', roleError.message)
            return EMPTY
        }

        if (!orgRole) {
            logger.warn('permissions', 'No OrganizationUserRole row found for active organization', {
                userId: appUser.id,
                organizationId: orgContext.activeOrganizationId,
            })
            return EMPTY
        }

        const roleRaw = Array.isArray((orgRole as any).OrganizationRole)
            ? (orgRole as any).OrganizationRole[0]
            : (orgRole as any).OrganizationRole

        if (!roleRaw) {
            logger.warn('permissions', 'OrganizationRole join returned null', {
                userId: appUser.id,
                organizationId: orgContext.activeOrganizationId,
            })
            return EMPTY
        }

        const role = { id: roleRaw.id as number, name: roleRaw.name as string }
        logger.debug('permissions', 'Found role', {
            roleName: role.name,
            roleId: role.id,
            organizationId: orgContext.activeOrganizationId,
        })

        // ── Step 3: Get all permissions for this role ─────────────────────────
        const { data: rolePerms, error: permsError } = await supabase
            .from('OrganizationRolePermission')
            .select(`
                OrganizationPermission (
                    name
                )
            `)
            .eq('organization_role_id', role.id)

        if (permsError) {
            logger.error('permissions', 'Error querying permissions', permsError.message)
            // Still return the role even if permissions query fails
        }

        const permissions = Array.from(new Set((rolePerms ?? [])
            .map((r: any) => r.OrganizationPermission?.name)
            .filter(Boolean) as string[]))

        logger.debug('permissions', 'Resolved role permissions', {
            roleName: role.name,
            roleId: role.id,
            organizationId: orgContext.activeOrganizationId,
            permissions,
        })

        const resolved: UserPermissions = {
            role: role.name,
            roleId: role.id,
            permissions,
            isAdmin: role.name.toLowerCase() === 'admin',
        }

        permissionCache.set(cacheKey, {
            value: resolved,
            expiresAt: Date.now() + PERMISSIONS_CACHE_TTL_MS,
        })

        return resolved
    } catch (e) {
        logger.error('permissions', 'Unexpected error', e)
        return EMPTY
    }
}
