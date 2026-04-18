import { createClient } from '@/lib/supabase-server';

export interface OrganizationMembership {
  organizationId: number;
  organizationName: string;
  organizationRoleId: number | null;
  organizationRoleName: string | null;
}

export interface SessionRoleContext {
  isAuthenticated: boolean;
  email: string | null;
  memberships: OrganizationMembership[];
}

export interface ActiveOrganizationContext extends SessionRoleContext {
  activeOrganizationId: number | null;
}

interface UserRow {
  id: number;
}

interface OrganizationJoin {
  id: number;
  name: string | null;
}

interface OrganizationRoleJoin {
  id: number;
  name: string | null;
}

interface OrganizationUserRoleRow {
  organization_id: number | null;
  organization_role_id: number | null;
  Organization: OrganizationJoin | OrganizationJoin[] | null;
  OrganizationRole: OrganizationRoleJoin | OrganizationRoleJoin[] | null;
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function parseOrganizationId(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function resolveActiveOrganizationId(
  memberships: OrganizationMembership[],
  preferredOrganizationId: number | null
): number | null {
  if (
    typeof preferredOrganizationId === 'number' &&
    memberships.some((membership) => membership.organizationId === preferredOrganizationId)
  ) {
    return preferredOrganizationId;
  }

  if (memberships.length > 0) {
    return memberships[0].organizationId;
  }

  return null;
}

export async function getCurrentUserOrganizationMemberships(): Promise<SessionRoleContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? null;
  if (!email) {
    return {
      isAuthenticated: false,
      email: null,
      memberships: [],
    };
  }

  return getUserOrganizationMembershipsByEmail(email);
}

export async function getUserOrganizationMembershipsByEmail(emailInput: string): Promise<SessionRoleContext> {
  const email = emailInput.trim().toLowerCase();
  if (!email) {
    return {
      isAuthenticated: false,
      email: null,
      memberships: [],
    };
  }

  const supabase = await createClient();

  const { data: users, error: userError } = await supabase
    .from('User')
    .select('id')
    .eq('email', email)
    .limit(1);

  if (userError || !users || users.length === 0) {
    return {
      isAuthenticated: true,
      email,
      memberships: [],
    };
  }

  const appUser = users[0] as UserRow;

  const { data: orgRows, error: membershipError } = await supabase
    .from('OrganizationUserRole')
    .select(`
      organization_id,
      organization_role_id,
      Organization (
        id,
        name
      ),
      OrganizationRole (
        id,
        name
      )
    `)
    .eq('user_id', appUser.id)
    .order('organization_id', { ascending: true });

  if (membershipError || !orgRows) {
    return {
      isAuthenticated: true,
      email,
      memberships: [],
    };
  }

  const rows = orgRows as OrganizationUserRoleRow[];
  const membershipsByOrganizationId = new Map<number, OrganizationMembership>();

  for (const row of rows) {
    if (typeof row.organization_id !== 'number') {
      continue;
    }

    if (membershipsByOrganizationId.has(row.organization_id)) {
      continue;
    }

    const organization = firstOrNull(row.Organization);
    const organizationRole = firstOrNull(row.OrganizationRole);

    membershipsByOrganizationId.set(row.organization_id, {
      organizationId: row.organization_id,
      organizationName: organization?.name || `Organization ${row.organization_id}`,
      organizationRoleId: organizationRole?.id ?? row.organization_role_id,
      organizationRoleName: organizationRole?.name ?? null,
    });
  }

  const memberships = Array.from(membershipsByOrganizationId.values()).sort((a, b) =>
    a.organizationName.localeCompare(b.organizationName)
  );

  return {
    isAuthenticated: true,
    email,
    memberships,
  };
}

export async function getCurrentUserActiveOrganization(
  preferredOrganizationId: number | null
): Promise<ActiveOrganizationContext> {
  const context = await getCurrentUserOrganizationMemberships();
  const activeOrganizationId = resolveActiveOrganizationId(context.memberships, preferredOrganizationId);

  return {
    ...context,
    activeOrganizationId,
  };
}

export async function getUserActiveOrganizationByEmail(
  emailInput: string,
  preferredOrganizationId: number | null
): Promise<ActiveOrganizationContext> {
  const context = await getUserOrganizationMembershipsByEmail(emailInput);
  const activeOrganizationId = resolveActiveOrganizationId(context.memberships, preferredOrganizationId);

  return {
    ...context,
    activeOrganizationId,
  };
}
