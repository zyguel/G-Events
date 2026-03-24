"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { getCurrentUserPermissions, UserPermissions } from "@/lib/actions/permissions";
import { createClient } from "@/lib/supabase-browser";

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
    const [state, setState] = useState<UserPermissions>({
        role: "",
        roleId: 0,
        permissions: [],
        isAdmin: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // createBrowserClient is a singleton that shares the session with the login page
        const supabase = createClient();

        // getSession reads from the stored cookie/token — reliable on the client
        supabase.auth.getSession().then(({ data: { session } }) => {
            const email = session?.user?.email;
            console.log('[PermissionContext] Auth email:', email);

            if (!email) {
                console.warn('[PermissionContext] No session found — permissions not loaded');
                setLoading(false);
                return;
            }

            getCurrentUserPermissions(email)
                .then((p) => {
                    console.log('[PermissionContext] Loaded:', p);
                    setState(p);
                })
                .catch((e) => console.error("[PermissionContext] DB lookup failed:", e))
                .finally(() => setLoading(false));
        });
    }, []);

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
