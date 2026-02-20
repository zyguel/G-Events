import { supabase, UserWithRole, OrganizationRole, OrganizationPermission } from './supabase';

const DEFAULT_ORG_ID = parseInt(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || '1');

// Users
export async function getOrganizationUsers(organizationId: number = DEFAULT_ORG_ID): Promise<UserWithRole[]> {
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

    return (data || []).map((item: any) => ({
        id: item.User.id,
        name: item.User.name,
        email: item.User.email,
        role: item.OrganizationRole.name,
        roleId: item.OrganizationRole.id,
        avatar: '/icons/' + (Math.random() > 0.5 ? 'woman.png' : 'man.png'), // Random avatar for now
    }));
}

export async function inviteUser(
    name: string,
    email: string,
    roleId: number,
    organizationId: number = DEFAULT_ORG_ID
): Promise<UserWithRole> {
    // Check if user already exists
    const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('email', email)
        .single();

    let userId: number;

    if (existingUser) {
        userId = existingUser.id;
    } else {
        // Create new user
        const { data: newUser, error: userError } = await supabase
            .from('User')
            .insert([{ name, email }])
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
        name,
        email,
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
    const { error } = await supabase
        .from('OrganizationUserRole')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

    if (error) throw error;
}

// Roles
export async function getOrganizationRoles(organizationId: number = DEFAULT_ORG_ID): Promise<OrganizationRole[]> {
    const { data, error } = await supabase
        .from('OrganizationRole')
        .select('*')
        .eq('organization_id', organizationId);

    if (error) throw error;

    return data || [];
}

export async function createRole(
    name: string,
    description: string,
    permissionIds: number[],
    organizationId: number = DEFAULT_ORG_ID
): Promise<OrganizationRole> {
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
    permissionIds: number[]
): Promise<void> {
    // Update role name
    const { error: roleError } = await supabase
        .from('OrganizationRole')
        .update({ name, description })
        .eq('id', roleId);

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

export async function deleteRole(roleId: number): Promise<void> {
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
    const { data, error } = await supabase
        .from('OrganizationPermission')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw error;

    return data || [];
}

export async function getRolePermissions(roleId: number): Promise<number[]> {
    const { data, error } = await supabase
        .from('OrganizationRolePermission')
        .select('organization_permission_id')
        .eq('organization_role_id', roleId);

    if (error) throw error;

    return (data || []).map((item: any) => item.organization_permission_id);
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(organizationId: number = DEFAULT_ORG_ID) {
    const { data, error } = await supabase
        .from('Event')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getEvent(eventId: number) {
    const { data, error } = await supabase
        .from('Event')
        .select('*')
        .eq('id', eventId)
        .single();

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
        objectives?: any[];
        theme?: string;
    }
) {
    const { data, error } = await supabase
        .from('Event')
        .insert([{ organization_id: organizationId, ...fields }])
        .select()
        .single();

    if (error) throw error;
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
        objectives: any[];
        theme: string;
    }>
) {
    const { error } = await supabase
        .from('Event')
        .update(fields)
        .eq('id', eventId);

    if (error) throw error;
}

export async function deleteEvent(eventId: number) {
    const { error } = await supabase
        .from('Event')
        .delete()
        .eq('id', eventId);

    if (error) throw error;
}

