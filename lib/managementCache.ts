import type { OrganizationRole, UserWithRole } from '@/lib/supabase';

const MANAGEMENT_USERS_CACHE_TTL_MS = 45 * 1000;
const MANAGEMENT_ROLES_CACHE_TTL_MS = 45 * 1000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const managementUsersCache = new Map<number, CacheEntry<UserWithRole[]>>();
const managementRolesCache = new Map<number, CacheEntry<OrganizationRole[]>>();

function cloneUsers(users: UserWithRole[]): UserWithRole[] {
  return users.map((user) => ({ ...user }));
}

function cloneRoles(roles: OrganizationRole[]): OrganizationRole[] {
  return roles.map((role) => ({ ...role }));
}

export function getCachedManagementUsers(organizationId: number): UserWithRole[] | null {
  const cached = managementUsersCache.get(organizationId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    managementUsersCache.delete(organizationId);
    return null;
  }

  return cloneUsers(cached.value);
}

export function setCachedManagementUsers(organizationId: number, users: UserWithRole[]): void {
  managementUsersCache.set(organizationId, {
    value: cloneUsers(users),
    expiresAt: Date.now() + MANAGEMENT_USERS_CACHE_TTL_MS,
  });
}

export function invalidateManagementUsersCache(organizationId?: number): void {
  if (typeof organizationId === 'number') {
    managementUsersCache.delete(organizationId);
    return;
  }

  managementUsersCache.clear();
}

export function getCachedManagementRoles(organizationId: number): OrganizationRole[] | null {
  const cached = managementRolesCache.get(organizationId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    managementRolesCache.delete(organizationId);
    return null;
  }

  return cloneRoles(cached.value);
}

export function setCachedManagementRoles(organizationId: number, roles: OrganizationRole[]): void {
  managementRolesCache.set(organizationId, {
    value: cloneRoles(roles),
    expiresAt: Date.now() + MANAGEMENT_ROLES_CACHE_TTL_MS,
  });
}

export function invalidateManagementRolesCache(organizationId?: number): void {
  if (typeof organizationId === 'number') {
    managementRolesCache.delete(organizationId);
    return;
  }

  managementRolesCache.clear();
}
