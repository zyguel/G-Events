"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { getCurrentUserPermissions, UserPermissions } from "@/lib/actions/permissions";
import { createClient } from "@/lib/supabase-browser";

const ADMIN_ROOTS = ['/dashboard', '/admin/events', '/management', '/profile', '/settings', '/analytics'];
const PERMISSIONS_CACHE_PREFIX = 'g_events_permissions_cache:';
const PERMISSIONS_CACHE_TTL_MS = 2 * 60 * 1000;

function isAdminAppRoute(pathname: string) {
    if (pathname.startsWith('/admin/')) {
        return true;
    }

    if (pathname.startsWith('/analytics/')) {
        return true;
    }

    return ADMIN_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

function getPermissionCacheKey(email: string): string {
    const orgId = readCookie('g_events_active_organization_id') || 'none';
    return `${PERMISSIONS_CACHE_PREFIX}${email.toLowerCase()}:${orgId}`;
}

function readCachedPermissions(cacheKey: string): UserPermissions | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as { value?: UserPermissions; cachedAt?: number };
        const cachedAt = Number(parsed.cachedAt || 0);
        if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > PERMISSIONS_CACHE_TTL_MS) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return parsed.value || null;
    } catch {
        return null;
    }
}

function writeCachedPermissions(cacheKey: string, value: UserPermissions) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(
            cacheKey,
            JSON.stringify({
                value,
                cachedAt: Date.now(),
            })
        );
    } catch {
        // Ignore storage quota/private mode failures.
    }
}

interface PermissionContextValue extends UserPermissions {
    loading: boolean;
    hasPermission: (name: string) => boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
    role: "",
    roleId: 0,
    permissions: [],
    isAdmin: false,
    loading: true,
    hasPermission: () => false,
});

export function PermissionProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [state, setState] = useState<UserPermissions>({
        role: "",
        roleId: 0,
        permissions: [],
        isAdmin: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let disposed = false;

        if (!isAdminAppRoute(pathname)) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // createBrowserClient is a singleton that shares the session with the login page
        const supabase = createClient();

        const loadPermissions = async () => {
            try {
                // getSession reads from the stored cookie/token — reliable on the client
                const { data: { session } } = await supabase.auth.getSession();
                const email = session?.user?.email;

                if (!email) {
                    if (!disposed) {
                        setLoading(false);
                    }
                    return;
                }

                const cacheKey = getPermissionCacheKey(email);
                const cachedPermissions = readCachedPermissions(cacheKey);
                if (cachedPermissions && !disposed) {
                    setState(cachedPermissions);
                    setLoading(false);
                }

                const permissions = await getCurrentUserPermissions(email);

                if (!disposed) {
                    setState(permissions);
                    setLoading(false);
                }

                writeCachedPermissions(cacheKey, permissions);
            } catch {
                // Keep the previous permission snapshot on transient failures.
            } finally {
                if (!disposed) {
                    setLoading(false);
                }
            }
        };

        void loadPermissions();

        return () => {
            disposed = true;
        };
    }, [pathname]);

    // Deny by default until permissions are loaded.
    const hasPermission = (name: string): boolean => {
        if (loading) return false;
        if (state.role === "") return false;
        return state.isAdmin || state.permissions.includes(name);
    };

    return (
        <PermissionContext.Provider value={{ ...state, loading, hasPermission }}>
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    return useContext(PermissionContext);
}
