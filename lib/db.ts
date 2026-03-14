import { createClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UserWithRole, OrganizationRole, OrganizationPermission } from './supabase';

const DEFAULT_ORG_ID = parseInt(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || '1');

async function getSupabase(): Promise<SupabaseClient> {
    return await createClient();
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
    // Normalize email to avoid case-mismatch between auth session and stored value
    const normalizedEmail = email.trim().toLowerCase();

    const supabase = await getSupabase();

    // Check if user already exists (case-insensitive)
    const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .ilike('email', normalizedEmail)
        .limit(1)
        .single();

    let userId: number;

    if (existingUser) {
        userId = existingUser.id;
    } else {
        // Create new user — always store lowercase email
        const { data: newUser, error: userError } = await supabase
            .from('User')
            .insert([{ name, email: normalizedEmail }])
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
    permissionIds: number[]
): Promise<void> {
    const supabase = await getSupabase();

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
    const supabase = await getSupabase();

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

    const { data, error } = await supabase
        .from('OrganizationRolePermission')
        .select('organization_permission_id')
        .eq('organization_role_id', roleId);

    if (error) throw error;

    return (data || []).map((item: any) => item.organization_permission_id);
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

export async function getEvent(eventId: number) {
    const supabase = await getSupabase();

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
    const supabase = await getSupabase();

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
    const supabase = await getSupabase();

    const { error } = await supabase
        .from('Event')
        .update(fields)
        .eq('id', eventId);

    if (error) throw error;
}

export async function deleteEvent(eventId: number) {
    const supabase = await getSupabase();

    const { error } = await supabase
        .from('Event')
        .delete()
        .eq('id', eventId);

    if (error) throw error;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export async function getTickets(eventId: number) {
    const supabase = await getSupabase();

    const { data, error } = await supabase
        .from('Ticket')
        .select('*')
        .eq('event_id', eventId)
        .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
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

    const { data, error } = await supabase
        .from('Ticket')
        .update(fields)
        .eq('id', ticketId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteTicket(ticketId: number) {
    const supabase = await getSupabase();

    const { error } = await supabase
        .from('Ticket')
        .delete()
        .eq('id', ticketId);

    if (error) throw error;
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

    const { error: addOnError } = await supabase
        .from('AddOn')
        .update(fields)
        .eq('id', addOnId);

    if (addOnError) throw addOnError;

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

    return getPromotion(promotionId);
}

export async function deletePromotion(promotionId: number) {
    const supabase = await getSupabase();

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
}

