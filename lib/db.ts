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

const EVENT_RESCHEDULE_TICKET_BUFFER_DAYS = 5;
const EVENT_RESCHEDULE_TICKET_BUFFER_MS = EVENT_RESCHEDULE_TICKET_BUFFER_DAYS * 24 * 60 * 60 * 1000;

function toNormalizedIso(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim()) return null;
    const ms = Date.parse(value);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString();
}

function toEpochMs(value: unknown): number | null {
    const iso = toNormalizedIso(value);
    if (!iso) return null;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : null;
}

type EventTicketWindowRow = {
    id: number;
    selling_start_at: string | null;
    selling_end_at: string | null;
};

async function adjustTicketWindowsForEarlierEventEnd(params: {
    supabase: SupabaseClient;
    eventId: number;
    beforeEventEndAt: unknown;
    afterEventEndAt: unknown;
}): Promise<void> {
    const beforeEndMs = toEpochMs(params.beforeEventEndAt);
    const afterEndMs = toEpochMs(params.afterEventEndAt);

    if (beforeEndMs === null || afterEndMs === null || afterEndMs >= beforeEndMs) {
        return;
    }

    const { data: ticketRows, error: ticketError } = await params.supabase
        .from('Ticket')
        .select('id, selling_start_at, selling_end_at')
        .eq('event_id', params.eventId);

    if (ticketError) throw ticketError;

    const rows = (ticketRows || []) as EventTicketWindowRow[];

    for (const row of rows) {
        const currentStartMs = toEpochMs(row.selling_start_at);
        const currentEndMs = toEpochMs(row.selling_end_at);

        let nextStartMs = currentStartMs;
        let nextEndMs = currentEndMs;
        let changed = false;

        const bothBeyondEarlierEnd =
            currentStartMs !== null
            && currentEndMs !== null
            && currentStartMs > afterEndMs
            && currentEndMs > afterEndMs;

        if (bothBeyondEarlierEnd) {
            nextEndMs = afterEndMs;
            nextStartMs = afterEndMs - EVENT_RESCHEDULE_TICKET_BUFFER_MS;
            changed = true;
        } else {
            if (currentEndMs !== null && currentEndMs > afterEndMs) {
                nextEndMs = afterEndMs;
                changed = true;
            }

            if (currentStartMs !== null && currentStartMs > afterEndMs) {
                nextStartMs = afterEndMs - EVENT_RESCHEDULE_TICKET_BUFFER_MS;
                changed = true;
            }
        }

        if (nextStartMs !== null && nextEndMs !== null && nextStartMs >= nextEndMs) {
            nextStartMs = nextEndMs - EVENT_RESCHEDULE_TICKET_BUFFER_MS;
            changed = true;
        }

        if (!changed) {
            continue;
        }

        const nextStartIso = nextStartMs !== null ? new Date(nextStartMs).toISOString() : null;
        const nextEndIso = nextEndMs !== null ? new Date(nextEndMs).toISOString() : null;

        const sameStart = toNormalizedIso(row.selling_start_at) === toNormalizedIso(nextStartIso);
        const sameEnd = toNormalizedIso(row.selling_end_at) === toNormalizedIso(nextEndIso);
        if (sameStart && sameEnd) {
            continue;
        }

        const { error: updateTicketError } = await params.supabase
            .from('Ticket')
            .update({
                selling_start_at: nextStartIso,
                selling_end_at: nextEndIso,
            })
            .eq('id', row.id)
            .eq('event_id', params.eventId);

        if (updateTicketError) throw updateTicketError;
    }
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

    const nextEventEndAt =
        Object.prototype.hasOwnProperty.call(fields, 'event_end_at')
            ? fields.event_end_at
            : beforeData.event_end_at;

    await adjustTicketWindowsForEarlierEventEnd({
        supabase,
        eventId,
        beforeEventEndAt: beforeData.event_end_at,
        afterEventEndAt: nextEventEndAt,
    });

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

export async function getTickets(eventId: number, options?: { includeDeleted?: boolean }) {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const includeDeleted = options?.includeDeleted === true;

    // 1. Fetch tickets (use standard client)
    let ticketQuery = supabase
        .from('Ticket')
        .select('*')
        .eq('event_id', eventId)
        .order('id', { ascending: true });

    if (!includeDeleted) {
        ticketQuery = ticketQuery.eq('is_deleted', false);
    }

    const { data: tickets, error: ticketError } = await ticketQuery;

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

class TicketValidationError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = 'TicketValidationError';
        this.statusCode = statusCode;
    }
}

class AddOnValidationError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = 'AddOnValidationError';
        this.statusCode = statusCode;
    }
}

class PromotionValidationError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = 'PromotionValidationError';
        this.statusCode = statusCode;
    }
}

const PROMOTION_CODE_PATTERN = /^[A-Z0-9_-]+$/;
const PROMOTION_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizePromotionCode(value: unknown): string {
    return String(value || '').trim().toUpperCase();
}

function normalizePromotionDateTime(value: unknown, fieldLabel: string): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'string') {
        throw new PromotionValidationError(`Invalid ${fieldLabel}.`);
    }

    const trimmed = value.trim();
    if (!trimmed) return null;

    const normalized = PROMOTION_DATE_ONLY_PATTERN.test(trimmed)
        ? `${trimmed}T00:00`
        : trimmed;

    const parsed = parseTicketDateTime(normalized);
    if (!parsed) {
        throw new PromotionValidationError(`Invalid ${fieldLabel}.`);
    }

    return normalized;
}

function normalizePromotionTicketIds(ticketIds?: number[]): number[] | undefined {
    if (ticketIds === undefined) return undefined;
    if (!Array.isArray(ticketIds)) {
        throw new PromotionValidationError('Invalid ticket selection.');
    }

    const normalized = ticketIds.map((id) => Number(id));
    const hasInvalid = normalized.some((id) => !Number.isInteger(id) || id <= 0);
    if (hasInvalid) {
        throw new PromotionValidationError('Invalid ticket selection.');
    }

    return Array.from(new Set(normalized));
}

function normalizeComparableText(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeVariantCode(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

async function ensureUniqueTicketName(
    supabase: SupabaseClient,
    eventId: number,
    ticketName: string,
    excludeTicketId?: number,
): Promise<void> {
    const normalizedCandidate = normalizeComparableText(ticketName);
    if (!normalizedCandidate) {
        throw new TicketValidationError('Ticket name is required.');
    }

    const { data, error } = await supabase
        .from('Ticket')
        .select('id, name, is_deleted')
        .eq('event_id', eventId);

    if (error) throw error;

    const conflictingTicket = (data || []).find((row: { id: number | string; name: string | null; is_deleted: boolean | null }) => {
        const rowId = Number(row.id);
        if (Number.isFinite(excludeTicketId) && rowId === excludeTicketId) {
            return false;
        }

        if (row.is_deleted === true) {
            return false;
        }

        return normalizeComparableText(row.name) === normalizedCandidate;
    });

    if (conflictingTicket) {
        throw new TicketValidationError('A ticket with this name already exists for this event.', 409);
    }
}

async function ensureUniqueAddOnName(
    supabase: SupabaseClient,
    eventId: number,
    addOnName: string,
    excludeAddOnId?: number,
): Promise<void> {
    const normalizedCandidate = normalizeComparableText(addOnName);
    if (!normalizedCandidate) {
        throw new AddOnValidationError('Add-on name is required.');
    }

    const { data, error } = await supabase
        .from('AddOn')
        .select('id, name')
        .eq('event_id', eventId);

    if (error) throw error;

    const conflictingAddOn = (data || []).find((row: { id: number | string; name: string | null }) => {
        const rowId = Number(row.id);
        if (Number.isFinite(excludeAddOnId) && rowId === excludeAddOnId) {
            return false;
        }

        return normalizeComparableText(row.name) === normalizedCandidate;
    });

    if (conflictingAddOn) {
        throw new AddOnValidationError('An add-on with this name already exists for this event.', 409);
    }
}

function normalizeAndValidateAddOnVariants(
    variants?: { id?: number; code: string; label: string; stock_total: number }[]
) {
    if (variants === undefined) return undefined;

    const seenLabels = new Set<string>();
    const seenCodes = new Set<string>();

    return variants.map((variant, index) => {
        const label = typeof variant.label === 'string' ? variant.label.trim() : '';
        const stockTotal = Number(variant.stock_total);

        if (!label) {
            throw new AddOnValidationError('Add-on variant label is required.');
        }

        if (!Number.isFinite(stockTotal) || stockTotal <= 0) {
            throw new AddOnValidationError('Add-on variant stock must be greater than 0.');
        }

        const normalizedLabel = normalizeComparableText(label);
        if (seenLabels.has(normalizedLabel)) {
            throw new AddOnValidationError('Add-on variant labels must be unique.', 409);
        }
        seenLabels.add(normalizedLabel);

        const fallbackCode = `variant_${index + 1}`;
        const inputCode = variant.code && String(variant.code).trim().length > 0 ? variant.code : label;
        const normalizedCode = normalizeVariantCode(inputCode) || fallbackCode;

        if (seenCodes.has(normalizedCode)) {
            throw new AddOnValidationError('Add-on variants must have unique codes.', 409);
        }
        seenCodes.add(normalizedCode);

        return {
            ...variant,
            label,
            code: normalizedCode,
            stock_total: stockTotal,
        };
    });
}

function parseTicketDateTime(value: string | null | undefined): Date | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function validateTicketSellingWindow(
    supabase: SupabaseClient,
    eventId: number,
    sellingStartAt: string | null | undefined,
    sellingEndAt: string | null | undefined,
): Promise<void> {
    const startAt = parseTicketDateTime(sellingStartAt);
    const endAt = parseTicketDateTime(sellingEndAt);

    if (sellingStartAt && !startAt) {
        throw new TicketValidationError('Invalid ticket selling start date/time.');
    }

    if (sellingEndAt && !endAt) {
        throw new TicketValidationError('Invalid ticket selling end date/time.');
    }

    if (startAt && endAt && startAt >= endAt) {
        throw new TicketValidationError('Ticket selling end date/time must be after the start date/time.');
    }

    const { data: eventRow, error: eventError } = await supabase
        .from('Event')
        .select('event_end_at')
        .eq('id', eventId)
        .maybeSingle();

    if (eventError) throw eventError;
    if (!eventRow) throw new TicketValidationError('Event not found.');

    const eventEndAt = parseTicketDateTime(eventRow.event_end_at as string | null | undefined);
    if (!eventEndAt) return;

    if (startAt && startAt > eventEndAt) {
        throw new TicketValidationError('Ticket selling start date/time cannot go beyond the event end date/time.');
    }

    if (endAt && endAt > eventEndAt) {
        throw new TicketValidationError('Ticket selling end date/time cannot go beyond the event end date/time.');
    }
}

export async function createTicket(
    eventId: number,
    fields: {
        name: string;
        description?: string;
        price?: number;
        free_ticket_approval_mode?: 'manual' | 'automatic';
        available_quantity?: number;
        selling_start_at?: string | null;
        selling_end_at?: string | null;
        selling_start_time?: string;
        selling_end_time?: string;
    }
) {
    const supabase = await getSupabase();

    const ticketName = String(fields.name || '').trim();
    await ensureUniqueTicketName(supabase, eventId, ticketName);

    await validateTicketSellingWindow(
        supabase,
        eventId,
        fields.selling_start_at,
        fields.selling_end_at,
    );

    const normalizedFreeTicketApprovalMode: 'manual' | 'automatic' =
        Number(fields.price ?? 0) > 0
            ? 'manual'
            : fields.free_ticket_approval_mode === 'automatic'
                ? 'automatic'
                : 'manual';

    const insertFields = {
        ...fields,
        name: ticketName,
        free_ticket_approval_mode: normalizedFreeTicketApprovalMode,
    };

    const { data, error } = await supabase
        .from('Ticket')
        .insert([{ event_id: eventId, is_hidden: false, is_deleted: false, deleted_at: null, ...insertFields }])
        .select()
        .single();

    if (error) {
        if ((error as { code?: string }).code === '23505') {
            throw new TicketValidationError('A ticket with this name already exists for this event.', 409);
        }
        throw error;
    }

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
        free_ticket_approval_mode: 'manual' | 'automatic';
        available_quantity: number;
        selling_start_at: string | null;
        selling_end_at: string | null;
        selling_start_time: string;
        selling_end_time: string;
        is_hidden: boolean;
        is_deleted: boolean;
        deleted_at: string | null;
    }>
) {
    const supabase = await getSupabase();

    const { data: beforeData, error: beforeError } = await supabase
        .from('Ticket')
        .select('*')
        .eq('id', ticketId)
        .single();

    if (beforeError) throw beforeError;

    const normalizedFields = { ...fields };
    const effectivePrice = Number(normalizedFields.price ?? beforeData.price ?? 0);

    if (effectivePrice > 0) {
        normalizedFields.free_ticket_approval_mode = 'manual';
    } else if (normalizedFields.free_ticket_approval_mode !== undefined) {
        normalizedFields.free_ticket_approval_mode =
            normalizedFields.free_ticket_approval_mode === 'automatic' ? 'automatic' : 'manual';
    }

    const shouldValidateSellingWindow =
        Object.prototype.hasOwnProperty.call(normalizedFields, 'selling_start_at')
        || Object.prototype.hasOwnProperty.call(normalizedFields, 'selling_end_at');

    const eventId = Number(beforeData.event_id);
    if (!Number.isFinite(eventId)) {
        throw new TicketValidationError('Ticket is not linked to a valid event.');
    }

    if (typeof normalizedFields.name === 'string') {
        const nextName = normalizedFields.name.trim();
        await ensureUniqueTicketName(supabase, eventId, nextName, ticketId);
        normalizedFields.name = nextName;
    }

    if (shouldValidateSellingWindow) {
        await validateTicketSellingWindow(
            supabase,
            eventId,
            normalizedFields.selling_start_at ?? beforeData.selling_start_at ?? null,
            normalizedFields.selling_end_at ?? beforeData.selling_end_at ?? null,
        );
    }

    const { data, error } = await supabase
        .from('Ticket')
        .update(normalizedFields)
        .eq('id', ticketId)
        .select()
        .single();

    if (error) {
        if ((error as { code?: string }).code === '23505') {
            throw new TicketValidationError('A ticket with this name already exists for this event.', 409);
        }
        throw error;
    }

    try {
      await logAuditEntry('Ticket', ticketId, 'update', { before: beforeData, after: data });
    } catch (e) {
      console.warn('Ticket audit log failed:', e);
    }

    return data;
}

export async function deleteTicket(ticketId: number, eventId?: number) {
    const supabase = await getSupabase();

    let beforeQuery = supabase
        .from('Ticket')
        .select('*')
        .eq('id', ticketId);

    if (typeof eventId === 'number' && !Number.isNaN(eventId)) {
        beforeQuery = beforeQuery.eq('event_id', eventId);
    }

    const { data: beforeData, error: beforeError } = await beforeQuery.single();

    if (beforeError) throw beforeError;

    // Soft-delete ticket so historical registrations remain intact.
    let softDeleteQuery = supabase
        .from('Ticket')
        .update({
            is_hidden: true,
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

    if (typeof eventId === 'number' && !Number.isNaN(eventId)) {
        softDeleteQuery = softDeleteQuery.eq('event_id', eventId);
    }

    const { error } = await softDeleteQuery;

    if (error) throw error;

    try {
      await logAuditEntry('Ticket', ticketId, 'delete', { before: beforeData, after: null });
    } catch (e) {
      console.warn('Ticket audit log failed:', e);
    }
}

export async function restoreTicket(ticketId: number, eventId?: number) {
        const supabase = await getSupabase();

        let restoreQuery = supabase
                .from('Ticket')
                .update({
                        is_deleted: false,
                        deleted_at: null,
                })
                .eq('id', ticketId);

        if (typeof eventId === 'number' && !Number.isNaN(eventId)) {
                restoreQuery = restoreQuery.eq('event_id', eventId);
        }

        const { data, error } = await restoreQuery
                .select()
                .single();

        if (error) throw error;

        try {
            await logAuditEntry('Ticket', ticketId, 'update', { before: null, after: data });
        } catch (e) {
            console.warn('Ticket audit log failed:', e);
        }

        return data;
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

    const normalizedName = String(fields.name || '').trim();
    const normalizedVariants = normalizeAndValidateAddOnVariants(variants);
    if (!normalizedVariants || normalizedVariants.length === 0) {
        throw new AddOnValidationError('Add-on quantity must be greater than 0.');
    }
    await ensureUniqueAddOnName(supabase, eventId, normalizedName);

    const { data: addOn, error: addOnError } = await supabase
        .from('AddOn')
        .insert([{ event_id: eventId, ...fields, name: normalizedName }])
        .select()
        .single();

    if (addOnError) {
        if ((addOnError as { code?: string }).code === '23505') {
            throw new AddOnValidationError('An add-on with this name already exists for this event.', 409);
        }
        throw addOnError;
    }

    try {
      await logAuditEntry('AddOn', addOn.id, 'create', { before: null, after: addOn });
    } catch (e) {
      console.warn('AddOn audit log failed:', e);
    }

    if (normalizedVariants && normalizedVariants.length > 0) {
        const variantRows = normalizedVariants.map((v) => ({
            add_on_id: addOn.id,
            code: v.code,
            label: v.label,
            stock_total: v.stock_total,
        }));

        const { error: varError } = await supabase
            .from('AddOnVariant')
            .insert(variantRows);

        if (varError) {
            if ((varError as { code?: string }).code === '23505') {
                throw new AddOnValidationError('Add-on variants must be unique. Please use different variant labels.', 409);
            }
            throw varError;
        }
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

    const eventId = Number(beforeData.event_id);
    if (!Number.isFinite(eventId)) {
        throw new AddOnValidationError('Add-on is not linked to a valid event.');
    }

    const normalizedFields = { ...fields };
    if (typeof normalizedFields.name === 'string') {
        const nextName = normalizedFields.name.trim();
        await ensureUniqueAddOnName(supabase, eventId, nextName, addOnId);
        normalizedFields.name = nextName;
    }

    const normalizedVariants = normalizeAndValidateAddOnVariants(variants);
    if (normalizedVariants !== undefined && normalizedVariants.length === 0) {
        throw new AddOnValidationError('Add-on quantity must be greater than 0.');
    }

    const { error: addOnError } = await supabase
        .from('AddOn')
        .update(normalizedFields)
        .eq('id', addOnId);

    if (addOnError) {
        if ((addOnError as { code?: string }).code === '23505') {
            throw new AddOnValidationError('An add-on with this name already exists for this event.', 409);
        }
        throw addOnError;
    }

    const updatedAddOn = await getAddOn(addOnId);
    try {
      await logAuditEntry('AddOn', addOnId, 'update', { before: beforeData, after: updatedAddOn });
    } catch (e) {
      console.warn('AddOn audit log failed:', e);
    }

    // If variants are provided, replace them
    if (normalizedVariants !== undefined) {
        // Delete existing variants
        await supabase
            .from('AddOnVariant')
            .delete()
            .eq('add_on_id', addOnId);

        // Insert new variants
        if (normalizedVariants.length > 0) {
            const variantRows = normalizedVariants.map((v) => ({
                add_on_id: addOnId,
                code: v.code,
                label: v.label,
                stock_total: v.stock_total,
            }));

            const { error: varError } = await supabase
                .from('AddOnVariant')
                .insert(variantRows);

            if (varError) {
                if ((varError as { code?: string }).code === '23505') {
                    throw new AddOnValidationError('Add-on variants must be unique. Please use different variant labels.', 409);
                }
                throw varError;
            }
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
        start_at?: string | null;
        end_at?: string | null;
        is_automatic?: boolean;
    },
    ticketIds?: number[]
) {
    const supabase = await getSupabase();

    const code = normalizePromotionCode(fields.code);
    if (!code) {
        throw new PromotionValidationError('Promotion code is required.');
    }
    if (!PROMOTION_CODE_PATTERN.test(code)) {
        throw new PromotionValidationError('Promotion code must only contain letters, numbers, hyphens, or underscores.');
    }

    const discountType = fields.discount_type === 'fixed' || fields.discount_type === 'percentage'
        ? fields.discount_type
        : null;
    if (!discountType) {
        throw new PromotionValidationError('Discount type must be either fixed or percentage.');
    }

    const discountValue = Number(fields.discount_value);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
        throw new PromotionValidationError('Discount value must be greater than 0.');
    }
    if (discountType === 'percentage' && discountValue > 100) {
        throw new PromotionValidationError('Percentage discount cannot be greater than 100.');
    }

    const maxUses = fields.max_uses !== undefined ? Number(fields.max_uses) : undefined;
    if (maxUses !== undefined && (!Number.isInteger(maxUses) || maxUses < 0)) {
        throw new PromotionValidationError('Usage limit must be 0 or greater.');
    }

    const currentUses = fields.current_uses !== undefined ? Number(fields.current_uses) : 0;
    if (!Number.isInteger(currentUses) || currentUses < 0) {
        throw new PromotionValidationError('Current usage must be 0 or greater.');
    }

    const startAt = normalizePromotionDateTime(fields.start_at, 'promotion start date/time');
    const endAt = normalizePromotionDateTime(fields.end_at, 'promotion end date/time');
    const startAtDate = parseTicketDateTime(startAt ?? undefined);
    const endAtDate = parseTicketDateTime(endAt ?? undefined);

    if (startAtDate && endAtDate && startAtDate >= endAtDate) {
        throw new PromotionValidationError('Promotion end date/time must be after the start date/time.');
    }

    if (maxUses !== undefined && maxUses > 0 && currentUses > maxUses) {
        throw new PromotionValidationError('Current usage cannot exceed usage limit.');
    }

    const normalizedTicketIds = normalizePromotionTicketIds(ticketIds);

    const promotionPayload = {
        event_id: eventId,
        name: fields.name?.trim() || code,
        code,
        discount_type: discountType,
        discount_value: discountValue,
        max_uses: maxUses,
        current_uses: currentUses,
        start_at: startAt === undefined ? null : startAt,
        end_at: endAt === undefined ? null : endAt,
        is_automatic: fields.is_automatic ?? false,
    };

    const { data: promo, error: promoError } = await supabase
        .from('Promotion')
        .insert([promotionPayload])
        .select()
        .single();

    if (promoError) throw promoError;

    if (normalizedTicketIds && normalizedTicketIds.length > 0) {
        const rows = normalizedTicketIds.map((tid) => ({
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
        start_at: string | null;
        end_at: string | null;
        is_automatic: boolean;
    }>,
    ticketIds?: number[]
) {
    const supabase = await getSupabase();

    const beforePromotion = await getPromotion(promotionId);

    const normalizedFields: Partial<{
        name: string;
        code: string;
        discount_type: 'fixed' | 'percentage';
        discount_value: number;
        max_uses: number;
        current_uses: number;
        start_at: string | null;
        end_at: string | null;
        is_automatic: boolean;
    }> = {};

    if (Object.prototype.hasOwnProperty.call(fields, 'name')) {
        normalizedFields.name = String(fields.name || '').trim();
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'code')) {
        const normalizedCode = normalizePromotionCode(fields.code);
        if (!normalizedCode) {
            throw new PromotionValidationError('Promotion code is required.');
        }
        if (!PROMOTION_CODE_PATTERN.test(normalizedCode)) {
            throw new PromotionValidationError('Promotion code must only contain letters, numbers, hyphens, or underscores.');
        }
        normalizedFields.code = normalizedCode;
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'discount_type')) {
        const discountType = fields.discount_type === 'fixed' || fields.discount_type === 'percentage'
            ? fields.discount_type
            : null;
        if (!discountType) {
            throw new PromotionValidationError('Discount type must be either fixed or percentage.');
        }
        normalizedFields.discount_type = discountType;
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'discount_value')) {
        const discountValue = Number(fields.discount_value);
        if (!Number.isFinite(discountValue) || discountValue <= 0) {
            throw new PromotionValidationError('Discount value must be greater than 0.');
        }
        normalizedFields.discount_value = discountValue;
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'max_uses')) {
        const maxUses = Number(fields.max_uses);
        if (!Number.isInteger(maxUses) || maxUses < 0) {
            throw new PromotionValidationError('Usage limit must be 0 or greater.');
        }
        normalizedFields.max_uses = maxUses;
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'current_uses')) {
        const currentUses = Number(fields.current_uses);
        if (!Number.isInteger(currentUses) || currentUses < 0) {
            throw new PromotionValidationError('Current usage must be 0 or greater.');
        }
        normalizedFields.current_uses = currentUses;
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'start_at')) {
        normalizedFields.start_at = normalizePromotionDateTime(fields.start_at, 'promotion start date/time') ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'end_at')) {
        normalizedFields.end_at = normalizePromotionDateTime(fields.end_at, 'promotion end date/time') ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'is_automatic')) {
        normalizedFields.is_automatic = Boolean(fields.is_automatic);
    }

    const previousDiscountType: 'fixed' | 'percentage' =
        beforePromotion.discount_type === 'fixed' ? 'fixed' : 'percentage';
    const effectiveDiscountType: 'fixed' | 'percentage' = normalizedFields.discount_type ?? previousDiscountType;
    const effectiveDiscountValue = normalizedFields.discount_value ?? Number(beforePromotion.discount_value ?? 0);
    if (!Number.isFinite(effectiveDiscountValue) || effectiveDiscountValue <= 0) {
        throw new PromotionValidationError('Discount value must be greater than 0.');
    }
    if (effectiveDiscountType === 'percentage' && effectiveDiscountValue > 100) {
        throw new PromotionValidationError('Percentage discount cannot be greater than 100.');
    }

    const effectiveStartAt = normalizedFields.start_at ?? (beforePromotion.start_at as string | null);
    const effectiveEndAt = normalizedFields.end_at ?? (beforePromotion.end_at as string | null);
    const effectiveStartAtDate = parseTicketDateTime(effectiveStartAt ?? undefined);
    const effectiveEndAtDate = parseTicketDateTime(effectiveEndAt ?? undefined);
    if (effectiveStartAtDate && effectiveEndAtDate && effectiveStartAtDate >= effectiveEndAtDate) {
        throw new PromotionValidationError('Promotion end date/time must be after the start date/time.');
    }

    const effectiveMaxUses = normalizedFields.max_uses ?? Number(beforePromotion.max_uses ?? 0);
    const effectiveCurrentUses = normalizedFields.current_uses ?? Number(beforePromotion.current_uses ?? 0);
    if (!Number.isInteger(effectiveMaxUses) || effectiveMaxUses < 0) {
        throw new PromotionValidationError('Usage limit must be 0 or greater.');
    }
    if (!Number.isInteger(effectiveCurrentUses) || effectiveCurrentUses < 0) {
        throw new PromotionValidationError('Current usage must be 0 or greater.');
    }
    if (effectiveMaxUses > 0 && effectiveCurrentUses > effectiveMaxUses) {
        throw new PromotionValidationError('Current usage cannot exceed usage limit.');
    }

    const normalizedTicketIds = normalizePromotionTicketIds(ticketIds);

    if (Object.keys(normalizedFields).length > 0) {
        const { error: promoError } = await supabase
            .from('Promotion')
            .update(normalizedFields)
            .eq('id', promotionId);

        if (promoError) throw promoError;
    }

    if (normalizedTicketIds !== undefined) {
        // Delete existing ticket associations
        await supabase
            .from('PromotionTicket')
            .delete()
            .eq('promotion_id', promotionId);

        // Insert new associations
        if (normalizedTicketIds.length > 0) {
            const rows = normalizedTicketIds.map((tid) => ({
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

