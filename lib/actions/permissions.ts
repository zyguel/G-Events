'use server'

import { supabase } from '@/lib/supabase'

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
        console.log('[Permissions] Looking up permissions for:', email)

        // ── Step 1: Find the User row ─────────────────────────────────────────
        const { data: users, error: userError } = await supabase
            .from('User')
            .select('id')
            .eq('email', email)
            .limit(1)

        if (userError) {
            console.error('[Permissions] Error querying User table:', userError.message)
            return EMPTY
        }

        if (!users || users.length === 0) {
            console.error('[Permissions] No User row found for email:', email)
            return EMPTY
        }

        const appUser = users[0]
        console.log('[Permissions] Found User id:', appUser.id)

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
            console.error('[Permissions] Error querying OrganizationUserRole:', roleError.message)
            return EMPTY
        }

        if (!orgRoles || orgRoles.length === 0) {
            console.error('[Permissions] No OrganizationUserRole row found for user_id:', appUser.id)
            return EMPTY
        }

        const roleRaw = (orgRoles[0] as any).OrganizationRole
        if (!roleRaw) {
            console.error('[Permissions] OrganizationRole join returned null for user_id:', appUser.id)
            return EMPTY
        }

        const role = { id: roleRaw.id as number, name: roleRaw.name as string }
        console.log('[Permissions] Found role:', role.name, '(id:', role.id + ')')

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
            console.error('[Permissions] Error querying permissions:', permsError.message)
            // Still return the role even if permissions query fails
        }

        const permissions = (rolePerms ?? [])
            .map((r: any) => r.OrganizationPermission?.name)
            .filter(Boolean) as string[]

        console.log('[Permissions] Role:', role.name, '| Permissions:', permissions)

        return {
            role: role.name,
            roleId: role.id,
            permissions,
            isAdmin: role.name.toLowerCase() === 'admin',
        }
    } catch (e) {
        console.error('[Permissions] Unexpected error:', e)
        return EMPTY
    }
}
