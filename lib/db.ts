import { createClient, createAdminClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UserWithRole, OrganizationRole, OrganizationPermission } from './supabase';
import { logAuditEntry } from '@/lib/actions/audit';
import { DEFAULT_ORG_ID } from '@/lib/constants';

async function getSupabase(): Promise<SupabaseClient> {
    return await createClient();
}

export class UserAlreadyInOrganizationError extends Error {
    constructor() {
        super('A user with this email is already a member of this organization.');
        this.name = 'UserAlreadyInOrganizationError';
    }
}

export interface OrganizationMemberNotificationContext {
    userId: number;
    name: string;
    email: string;
    roleId: number;
    roleName: string;
}

// Users
export async function getOrganizationUsers(organizationId: number = DEFAULT_ORG_ID): Promise<UserWithRole[]> {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('OrganizationUserRole')
        .select(`
      id,
      user_id,
      organization_role_id,
      User (
        id,
        name,
        email
      ),
      OrganizationRole (
        id,
        name
      )
    `)
        .eq('organization_id', organizationId);

    if (error) throw error;

    interface OrganizationUserRoleRow {
        User?: { id: number; name: string; email: string } | { id: number; name: string; email: string }[];
        OrganizationRole?: { id: number; name: string } | { id: number; name: string }[];
    }

    const rows = (data || []) as OrganizationUserRoleRow[];

    return rows.map((item) => {
        const user = Array.isArray(item.User) ? item.User[0] : item.User;
        const orgRole = Array.isArray(item.OrganizationRole) ? item.OrganizationRole[0] : item.OrganizationRole;

        return {
            id: user?.id ?? 0,
            name: user?.name ?? 'Unknown',
            email: user?.email ?? '',
            role: orgRole?.name ?? 'Unknown',
            roleId: orgRole?.id ?? 0,
            avatar: '/icons/' + (Math.random() > 0.5 ? 'woman.png' : 'man.png'), // Random avatar for now
        }
    });
}

export async function getOrganizationName(organizationId: number = DEFAULT_ORG_ID): Promise<string> {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('Organization')
        .select('name')
        .eq('id', organizationId)
        .limit(1)
        .single();

    if (error || !data) {
        throw error ?? new Error(`Organization ${organizationId} not found`);
    }

    return data.name || `Organization ${organizationId}`;
}

export async function getOrganizationMemberNotificationContext(
    userId: number,
    organizationId: number = DEFAULT_ORG_ID
): Promise<OrganizationMemberNotificationContext> {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('OrganizationUserRole')
        .select(`
            user_id,
            organization_role_id,
            User (
                name,
                email
            ),
            OrganizationRole (
                name
            )
        `)
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .limit(1)
        .single();

    if (error || !data) {
        throw error ?? new Error('Organization member not found');
    }

    const userJoin = Array.isArray(data.User) ? data.User[0] : data.User;
    const roleJoin = Array.isArray(data.OrganizationRole)
        ? data.OrganizationRole[0]
        : data.OrganizationRole;

    return {
        userId,
        name: userJoin?.name ?? 'Unknown User',
        email: userJoin?.email ?? '',
        roleId: data.organization_role_id ?? 0,
        roleName: roleJoin?.name ?? 'Unknown',
    };
}

export async function getOrganizationMembersByRole(
    roleId: number,
    organizationId: number = DEFAULT_ORG_ID
): Promise<OrganizationMemberNotificationContext[]> {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('OrganizationUserRole')
        .select(`
            user_id,
            organization_role_id,
            User (
                name,
                email
            ),
            OrganizationRole (
                name
            )
        `)
        .eq('organization_id', organizationId)
        .eq('organization_role_id', roleId);

    if (error) throw error;

    return (data || []).map((item) => {
        const userJoin = Array.isArray(item.User) ? item.User[0] : item.User;
        const roleJoin = Array.isArray(item.OrganizationRole)
            ? item.OrganizationRole[0]
            : item.OrganizationRole;

        return {
            userId: item.user_id ?? 0,
            name: userJoin?.name ?? 'Unknown User',
            email: userJoin?.email ?? '',
            roleId: item.organization_role_id ?? roleId,
            roleName: roleJoin?.name ?? 'Unknown',
        };
    });
}

export async function inviteUser(
    name: string,
    email: string,
    roleId: number,
    organizationId: number = DEFAULT_ORG_ID
): Promise<UserWithRole> {
    // Normalize email to avoid case-mismatch between auth session and stored value
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const supabase = await getSupabase();

    // Check if user already exists (case-insensitive)
    const { data: existingUser, error: existingUserError } = await supabase
        .from('User')
        .select('id')
        .ilike('email', normalizedEmail)
        .limit(1)
        .maybeSingle();

    if (existingUserError) throw existingUserError;

    let userId: number;

    if (existingUser) {
        userId = existingUser.id;

        // Reject duplicate organization membership for the same email.
        const { data: existingMembership, error: membershipLookupError } = await supabase
            .from('OrganizationUserRole')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

        if (membershipLookupError) throw membershipLookupError;
        if (existingMembership) throw new UserAlreadyInOrganizationError();
    } else {
        // Create new user — always store lowercase email
        const { data: newUser, error: userError } = await supabase
            .from('User')
            .insert([{ name: normalizedName, email: normalizedEmail }])
            .select()
            .single();

        if (userError) throw userError;
        userId = newUser.id;
    }

    // Assign user to organization with role
    const { error: roleError } = await supabase
        .from('OrganizationUserRole')
        .insert([
            {
                organization_id: organizationId,
                user_id: userId,
                organization_role_id: roleId,
            },
        ]);

    if (roleError) throw roleError;

    // Get the role name
    const { data: role } = await supabase
        .from('OrganizationRole')
        .select('name')
        .eq('id', roleId)
        .single();

    return {
        id: userId,
        name: normalizedName,
        email: normalizedEmail,
        role: role?.name || 'Unknown',
        roleId,
        avatar: '/icons/' + (Math.random() > 0.5 ? 'woman.png' : 'man.png'),
    };
}

export async function updateUser(
    userId: number,
    email: string,
    roleId: number,
    organizationId: number = DEFAULT_ORG_ID
): Promise<void> {
    const supabase = await getSupabase();

    // Update user email
    const { error: userError } = await supabase
        .from('User')
        .update({ email })
        .eq('id', userId);

    if (userError) throw userError;

    // Update user role in organization
    const { error: roleError } = await supabase
        .from('OrganizationUserRole')
        .update({ organization_role_id: roleId })
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

    if (roleError) throw roleError;
}

export async function removeUserFromOrganization(
    userId: number,
    organizationId: number = DEFAULT_ORG_ID
): Promise<void> {
    const supabase = await getSupabase();

    const { error } = await supabase
        .from('OrganizationUserRole')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

    if (error) throw error;
}

// Roles
export async function getOrganizationRoles(organizationId: number = DEFAULT_ORG_ID): Promise<OrganizationRole[]> {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('OrganizationRole')
        .select('*')
        .eq('organization_id', organizationId);

    if (error) throw error;

    return data || [];
}

export async function getOrganizationRoleById(
    roleId: number,
    organizationId: number = DEFAULT_ORG_ID
): Promise<OrganizationRole> {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('OrganizationRole')
        .select('*')
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .limit(1)
        .single();

    if (error || !data) {
        throw error ?? new Error('Role not found');
    }

    return data;
}

export async function createRole(
    name: string,
    description: string,
    permissionIds: number[],
    organizationId: number = DEFAULT_ORG_ID
): Promise<OrganizationRole> {
    const supabase = await getSupabase();

    // Create role
    const { data: newRole, error: roleError } = await supabase
        .from('OrganizationRole')
        .insert([{ organization_id: organizationId, name, description }])
        .select()
        .single();

    if (roleError) throw roleError;

    // Assign permissions to role
    if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permId) => ({
            organization_role_id: newRole.id,
            organization_permission_id: permId,
        }));

        const { error: permError } = await supabase
            .from('OrganizationRolePermission')
            .insert(rolePermissions);

        if (permError) throw permError;
    }

    return newRole;
}

export async function updateRole(
    roleId: number,
    name: string,
    description: string,
    permissionIds: number[],
    organizationId?: number
): Promise<void> {
    const supabase = await getSupabase();

    // Update role name
    let roleQuery = supabase
        .from('OrganizationRole')
        .update({ name, description })
        .eq('id', roleId);

    if (typeof organizationId === 'number') {
        roleQuery = roleQuery.eq('organization_id', organizationId);
    }

    const { error: roleError } = await roleQuery;

    if (roleError) throw roleError;

    // Delete existing permissions
    await supabase
        .from('OrganizationRolePermission')
        .delete()
        .eq('organization_role_id', roleId);

    // Add new permissions
    if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permId) => ({
            organization_role_id: roleId,
            organization_permission_id: permId,
        }));

        const { error: permError } = await supabase
            .from('OrganizationRolePermission')
            .insert(rolePermissions);

        if (permError) throw permError;
    }
}

export async function deleteRole(roleId: number, organizationId?: number): Promise<void> {
    const supabase = await getSupabase();

    let orgScopedRoleIdsQuery = supabase
        .from('OrganizationRole')
        .select('id')
        .eq('id', roleId);

    if (typeof organizationId === 'number') {
        orgScopedRoleIdsQuery = orgScopedRoleIdsQuery.eq('organization_id', organizationId);
    }

    const { data: roleData, error: roleLookupError } = await orgScopedRoleIdsQuery.limit(1).single();
    if (roleLookupError || !roleData) throw roleLookupError ?? new Error('Role not found');

    // Delete role permissions first
    await supabase
        .from('OrganizationRolePermission')
        .delete()
        .eq('organization_role_id', roleId);

    // Delete role
    const { error } = await supabase
        .from('OrganizationRole')
        .delete()
        .eq('id', roleId);

    if (error) throw error;
}

// Permissions
export async function getAllPermissions(): Promise<OrganizationPermission[]> {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('OrganizationPermission')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw error;

    return data || [];
}

export async function getRolePermissions(roleId: number): Promise<number[]> {
    const supabase = await getSupabase();

    const { data: roleData, error: roleLookupError } = await supabase
        .from('OrganizationRole')
        .select('id')
        .eq('id', roleId)
        .limit(1)
        .single();

    if (roleLookupError || !roleData) throw roleLookupError ?? new Error('Role not found');

    const { data, error } = await supabase
        .from('OrganizationRolePermission')
        .select('organization_permission_id')
        .eq('organization_role_id', roleId);

    if (error) throw error;

    return (data || []).map((item: { organization_permission_id: number }) => item.organization_permission_id);
}

export async function getRolePermissionsByOrganization(roleId: number, organizationId: number): Promise<number[]> {
    const supabase = await getSupabase();

    const { data: roleData, error: roleLookupError } = await supabase
        .from('OrganizationRole')
        .select('id')
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .limit(1)
        .single();

    if (roleLookupError || !roleData) throw roleLookupError ?? new Error('Role not found');

    const { data, error } = await supabase
        .from('OrganizationRolePermission')
        .select('organization_permission_id')
        .eq('organization_role_id', roleId);

    if (error) throw error;

    return (data || []).map((item: { organization_permission_id: number }) => item.organization_permission_id);
}

export async function getRolePermissionNamesByOrganization(
    roleId: number,
    organizationId: number
): Promise<string[]> {
    const supabase = await getSupabase();

    const permissionIds = await getRolePermissionsByOrganization(roleId, organizationId);
    if (permissionIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('OrganizationPermission')
        .select('name')
        .in('id', permissionIds)
        .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((permission) => permission.name).filter(Boolean);
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(organizationId: number = DEFAULT_ORG_ID) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('Event')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getEvent(eventId: number, organizationId?: number) {
    const supabase = await getSupabase();

    let query = supabase
        .from('Event')
        .select('*')
        .eq('id', eventId);

    if (typeof organizationId === 'number') {
        query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
}

export async function createEvent(
    organizationId: number = DEFAULT_ORG_ID,
    fields: {
        title: string;
        description?: string;
        banner_image?: string;
        event_start_at?: string;
        event_end_at?: string;
        location?: string;
        capacity?: number;
        allow_group_registration?: boolean;
        allow_waitlist?: boolean;
        allow_breakout_sessions?: boolean;
        registration_open_at?: string;
        registration_close_at?: string;
        is_published?: boolean;
        is_visible?: boolean;
        confirmation_page_message?: string;
        confirmation_email_subject?: string;
        confirmation_email_body?: string;
        objectives?: unknown[];
        theme?: string;
    }
) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('Event')
        .insert([{ organization_id: organizationId, ...fields }])
        .select()
        .single();

    if (error) throw error;

    try {
      await logAuditEntry('Event', data.id, 'create', { before: null, after: data });
    } catch (e) {
      console.warn('Event audit log failed:', e);
    }

    return data;
}

export async function updateEvent(
    eventId: number,
    fields: Partial<{
        title: string;
        description: string;
        banner_image: string;
        event_start_at: string;
        event_end_at: string;
        location: string;
        capacity: number;
        allow_group_registration: boolean;
        allow_waitlist: boolean;
        allow_breakout_sessions: boolean;
        registration_open_at: string;
        registration_close_at: string;
        is_published: boolean;
        is_visible: boolean;
        confirmation_page_message: string;
        confirmation_email_subject: string;
        confirmation_email_body: string;
                objectives: unknown[];
                theme: string;
        }>,
        organizationId?: number
) {
    const supabase = await getSupabase();

        let beforeQuery = supabase
            .from('Event')
            .select('*')
            .eq('id', eventId);

        if (typeof organizationId === 'number') {
            beforeQuery = beforeQuery.eq('organization_id', organizationId);
        }

        const { data: beforeData, error: beforeError } = await beforeQuery.single();

    if (beforeError) throw beforeError;

    let updateQuery = supabase
        .from('Event')
        .update(fields)
        .eq('id', eventId);

    if (typeof organizationId === 'number') {
        updateQuery = updateQuery.eq('organization_id', organizationId);
    }

    const { error } = await updateQuery;

    if (error) throw error;

    try {
      await logAuditEntry('Event', eventId, 'update', { before: beforeData, after: fields });
    } catch (e) {
      console.warn('Event audit log failed:', e);
    }
}

export async function deleteEvent(eventId: number, organizationId?: number) {
    const supabase = await getSupabase();

    let beforeQuery = supabase
        .from('Event')
        .select('*')
        .eq('id', eventId);

    if (typeof organizationId === 'number') {
        beforeQuery = beforeQuery.eq('organization_id', organizationId);
    }

    const { data: beforeData, error: beforeError } = await beforeQuery.single();

    if (beforeError) throw beforeError;

    let deleteQuery = supabase
        .from('Event')
        .delete()
        .eq('id', eventId);

    if (typeof organizationId === 'number') {
        deleteQuery = deleteQuery.eq('organization_id', organizationId);
    }

    const { error } = await deleteQuery;

    if (error) throw error;

    try {
      await logAuditEntry('Event', eventId, 'delete', { before: beforeData, after: null });
    } catch (e) {
      console.warn('Event audit log failed:', e);
    }
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export async function getTickets(eventId: number) {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // 1. Fetch tickets (use standard client)
    const { data: tickets, error: ticketError } = await supabase
        .from('Ticket')
        .select('*')
        .eq('event_id', eventId)
        .order('id', { ascending: true });

    if (ticketError) throw ticketError;
    if (!tickets || tickets.length === 0) return [];

    // 2. Fetch registration counts (use admin client to bypass RLS)
    const ticketIds = tickets.map(t => t.id);
    const { data: registrations, error: regError } = await adminSupabase
        .from('Registration')
        .select('ticket_id, status')
        .eq('event_id', eventId)
        .in('ticket_id', ticketIds);

    if (regError) throw regError;

    // 3. Aggregate counts
    const usageMap = new Map<number, number>();
    for (const reg of registrations || []) {
        const status = String(reg.status || '').toLowerCase();
        if (status === 'rejected' || status === 'cancelled') continue;
        const tid = Number(reg.ticket_id);
        if (!isNaN(tid)) {
            usageMap.set(tid, (usageMap.get(tid) || 0) + 1);
        }
    }

    // 4. Enrich ticket data
    return tickets.map(t => ({
        ...t,
        used_quantity: usageMap.get(t.id) || 0
    }));
}

export async function getTicket(ticketId: number) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('Ticket')
        .select('*')
        .eq('id', ticketId)
        .single();

    if (error) throw error;
    return data;
}

export async function createTicket(
    eventId: number,
    fields: {
        name: string;
        description?: string;
        price?: number;
        available_quantity?: number;
        min_per_user?: number;
        max_per_user?: number;
        selling_start_at?: string;
        selling_end_at?: string;
        selling_start_time?: string;
        selling_end_time?: string;
    }
) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('Ticket')
        .insert([{ event_id: eventId, ...fields }])
        .select()
        .single();

    if (error) throw error;

    try {
      await logAuditEntry('Ticket', data.id, 'create', { before: null, after: data });
    } catch (e) {
      console.warn('Ticket audit log failed:', e);
    }

    return data;
}

export async function updateTicket(
    ticketId: number,
    fields: Partial<{
        name: string;
        description: string;
        price: number;
        available_quantity: number;
        min_per_user: number;
        max_per_user: number;
        selling_start_at: string;
        selling_end_at: string;
        selling_start_time: string;
        selling_end_time: string;
    }>
) {
    const supabase = await getSupabase();

    const { data: beforeData, error: beforeError } = await supabase
        .from('Ticket')
        .select('*')
        .eq('id', ticketId)
        .single();

    if (beforeError) throw beforeError;

    const { data, error } = await supabase
        .from('Ticket')
        .update(fields)
        .eq('id', ticketId)
        .select()
        .single();

    if (error) throw error;

    try {
      await logAuditEntry('Ticket', ticketId, 'update', { before: beforeData, after: data });
    } catch (e) {
      console.warn('Ticket audit log failed:', e);
    }

    return data;
}

export async function deleteTicket(ticketId: number) {
    const supabase = await getSupabase();

    const { data: beforeData, error: beforeError } = await supabase
        .from('Ticket')
        .select('*')
        .eq('id', ticketId)
        .single();

    if (beforeError) throw beforeError;

    const { error } = await supabase
        .from('Ticket')
        .delete()
        .eq('id', ticketId);

    if (error) throw error;

    try {
      await logAuditEntry('Ticket', ticketId, 'delete', { before: beforeData, after: null });
    } catch (e) {
      console.warn('Ticket audit log failed:', e);
    }
}

// ─── Add-Ons ──────────────────────────────────────────────────────────────────

export async function getAddOns(eventId: number) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('AddOn')
        .select(`
            *,
            AddOnVariant (*)
        `)
        .eq('event_id', eventId)
        .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function getAddOn(addOnId: number) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('AddOn')
        .select(`
            *,
            AddOnVariant (*)
        `)
        .eq('id', addOnId)
        .single();

    if (error) throw error;
    return data;
}

export async function createAddOn(
    eventId: number,
    fields: {
        name: string;
        description?: string;
        image_path?: string;
        has_variants?: boolean;
    },
    variants?: { code: string; label: string; stock_total: number }[]
) {
    const supabase = await getSupabase();

    const { data: addOn, error: addOnError } = await supabase
        .from('AddOn')
        .insert([{ event_id: eventId, ...fields }])
        .select()
        .single();

    if (addOnError) throw addOnError;

    try {
      await logAuditEntry('AddOn', addOn.id, 'create', { before: null, after: addOn });
    } catch (e) {
      console.warn('AddOn audit log failed:', e);
    }

    if (variants && variants.length > 0) {
        const variantRows = variants.map((v) => ({
            add_on_id: addOn.id,
            code: v.code,
            label: v.label,
            stock_total: v.stock_total,
        }));

        const { error: varError } = await supabase
            .from('AddOnVariant')
            .insert(variantRows);

        if (varError) throw varError;
    }

    // Re-fetch with variants
    return getAddOn(addOn.id);
}

export async function updateAddOn(
    addOnId: number,
    fields: Partial<{
        name: string;
        description: string;
        image_path: string;
        has_variants: boolean;
    }>,
    variants?: { id?: number; code: string; label: string; stock_total: number }[]
) {
    const supabase = await getSupabase();

    const { data: beforeData, error: beforeError } = await supabase
        .from('AddOn')
        .select('*')
        .eq('id', addOnId)
        .single();
    if (beforeError) throw beforeError;

    const { error: addOnError } = await supabase
        .from('AddOn')
        .update(fields)
        .eq('id', addOnId);

    if (addOnError) throw addOnError;

    const updatedAddOn = await getAddOn(addOnId);
    try {
      await logAuditEntry('AddOn', addOnId, 'update', { before: beforeData, after: updatedAddOn });
    } catch (e) {
      console.warn('AddOn audit log failed:', e);
    }

    // If variants are provided, replace them
    if (variants !== undefined) {
        // Delete existing variants
        await supabase
            .from('AddOnVariant')
            .delete()
            .eq('add_on_id', addOnId);

        // Insert new variants
        if (variants.length > 0) {
            const variantRows = variants.map((v) => ({
                add_on_id: addOnId,
                code: v.code,
                label: v.label,
                stock_total: v.stock_total,
            }));

            const { error: varError } = await supabase
                .from('AddOnVariant')
                .insert(variantRows);

            if (varError) throw varError;
        }
    }

    return getAddOn(addOnId);
}

export async function deleteAddOn(addOnId: number) {
    const supabase = await getSupabase();

    const { data: beforeData, error: beforeError } = await supabase
        .from('AddOn')
        .select('*')
        .eq('id', addOnId)
        .single();
    if (beforeError) throw beforeError;

    // Delete variants first (FK constraint)
    await supabase
        .from('AddOnVariant')
        .delete()
        .eq('add_on_id', addOnId);

    const { error } = await supabase
        .from('AddOn')
        .delete()
        .eq('id', addOnId);

    if (error) throw error;

    try {
      await logAuditEntry('AddOn', addOnId, 'delete', { before: beforeData, after: null });
    } catch (e) {
      console.warn('AddOn audit log failed:', e);
    }
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export async function getPromotions(eventId: number) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('Promotion')
        .select(`
            *,
            PromotionTicket (
                ticket_id
            )
        `)
        .eq('event_id', eventId)
        .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function getPromotion(promotionId: number) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('Promotion')
        .select(`
            *,
            PromotionTicket (
                ticket_id
            )
        `)
        .eq('id', promotionId)
        .single();

    if (error) throw error;
    return data;
}

export async function createPromotion(
    eventId: number,
    fields: {
        name?: string;
        code: string;
        discount_type: string;
        discount_value: number;
        max_uses?: number;
        current_uses?: number;
        start_at?: string;
        end_at?: string;
        is_automatic?: boolean;
    },
    ticketIds?: number[]
) {
    const supabase = await getSupabase();

    const { data: promo, error: promoError } = await supabase
        .from('Promotion')
        .insert([{ event_id: eventId, ...fields }])
        .select()
        .single();

    if (promoError) throw promoError;

    if (ticketIds && ticketIds.length > 0) {
        const rows = ticketIds.map((tid) => ({
            promotion_id: promo.id,
            ticket_id: tid,
        }));

        const { error: ptError } = await supabase
            .from('PromotionTicket')
            .insert(rows);

        if (ptError) throw ptError;
    }

    try {
      await logAuditEntry('Promotion', promo.id, 'create', { before: null, after: promo });
    } catch (e) {
      console.warn('Promotion audit log failed:', e);
    }

    return getPromotion(promo.id);
}

export async function updatePromotion(
    promotionId: number,
    fields: Partial<{
        name: string;
        code: string;
        discount_type: string;
        discount_value: number;
        max_uses: number;
        current_uses: number;
        start_at: string;
        end_at: string;
        is_automatic: boolean;
    }>,
    ticketIds?: number[]
) {
    const supabase = await getSupabase();

    const { error: promoError } = await supabase
        .from('Promotion')
        .update(fields)
        .eq('id', promotionId);

    if (promoError) throw promoError;

    const beforePromotion = await getPromotion(promotionId);

    if (ticketIds !== undefined) {
        // Delete existing ticket associations
        await supabase
            .from('PromotionTicket')
            .delete()
            .eq('promotion_id', promotionId);

        // Insert new associations
        if (ticketIds.length > 0) {
            const rows = ticketIds.map((tid) => ({
                promotion_id: promotionId,
                ticket_id: tid,
            }));

            const { error: ptError } = await supabase
                .from('PromotionTicket')
                .insert(rows);

            if (ptError) throw ptError;
        }
    }

    const updatedPromotion = await getPromotion(promotionId);

    try {
      await logAuditEntry('Promotion', promotionId, 'update', { before: beforePromotion, after: updatedPromotion });
    } catch (e) {
      console.warn('Promotion audit log failed:', e);
    }

    return updatedPromotion;
}

export async function deletePromotion(promotionId: number) {
    const supabase = await getSupabase();

    const beforePromotion = await getPromotion(promotionId);

    // Delete ticket associations first (FK constraint)
    await supabase
        .from('PromotionTicket')
        .delete()
        .eq('promotion_id', promotionId);

    const { error } = await supabase
        .from('Promotion')
        .delete()
        .eq('id', promotionId);

    if (error) throw error;

    try {
      await logAuditEntry('Promotion', promotionId, 'delete', { before: beforePromotion, after: null });
    } catch (e) {
      console.warn('Promotion audit log failed:', e);
    }
}

