'use server'

import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

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

/**
 * Looks up a user's role and permissions by their email.
 * Email is provided by the client-side auth session.
 */
export async function getCurrentUserPermissions(email: string): Promise<UserPermissions> {
    if (!email) return EMPTY

    try {
        const supabase = await createClient()
        logger.debug('permissions', 'Looking up permissions', { email })

        // ── Step 1: Find the User row ─────────────────────────────────────────
        const { data: users, error: userError } = await supabase
            .from('User')
            .select('id')
            .eq('email', email)
            .limit(1)

        if (userError) {
            logger.error('permissions', 'Error querying User table', userError.message)
            return EMPTY
        }

        if (!users || users.length === 0) {
            logger.warn('permissions', 'No User row found for email', { email })
            return EMPTY
        }

        const appUser = users[0]
        logger.debug('permissions', 'Found user record', { userId: appUser.id })

        // ── Step 2: Find their OrganizationUserRole ───────────────────────────
        const { data: orgRoles, error: roleError } = await supabase
            .from('OrganizationUserRole')
            .select(`
                organization_role_id,
                OrganizationRole (
                    id,
                    name
                )
            `)
            .eq('user_id', appUser.id)
            .limit(1)

        if (roleError) {
            logger.error('permissions', 'Error querying OrganizationUserRole', roleError.message)
            return EMPTY
        }

        if (!orgRoles || orgRoles.length === 0) {
            logger.warn('permissions', 'No OrganizationUserRole row found', { userId: appUser.id })
            return EMPTY
        }

        const roleRaw = (orgRoles[0] as any).OrganizationRole
        if (!roleRaw) {
            logger.warn('permissions', 'OrganizationRole join returned null', { userId: appUser.id })
            return EMPTY
        }

        const role = { id: roleRaw.id as number, name: roleRaw.name as string }
        logger.debug('permissions', 'Found role', { roleName: role.name, roleId: role.id })

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

        const permissions = (rolePerms ?? [])
            .map((r: any) => r.OrganizationPermission?.name)
            .filter(Boolean) as string[]

        logger.debug('permissions', 'Resolved role permissions', { roleName: role.name, permissions })

        return {
            role: role.name,
            roleId: role.id,
            permissions,
            isAdmin: role.name.toLowerCase() === 'admin',
        }
    } catch (e) {
        logger.error('permissions', 'Unexpected error', e)
        return EMPTY
    }
}
