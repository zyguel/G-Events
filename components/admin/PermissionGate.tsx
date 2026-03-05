"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/contexts/PermissionContext";
import AccessDenied from "./AccessDenied";

interface PermissionGateProps {
    /** Permission name required to see the children */
    permission?: string;
    /** If true, only admins may see the children */
    adminOnly?: boolean;
    /** Render nothing instead of AccessDenied when access is denied */
    silent?: boolean;
    /** Custom fallback instead of AccessDenied */
    fallback?: ReactNode;
    children: ReactNode;
}

export default function PermissionGate({
    permission,
    adminOnly = false,
    silent = false,
    fallback,
    children,
}: PermissionGateProps) {
    const { hasPermission, isAdmin, loading } = usePermissions();

    // While loading, show nothing (prevents flash of AccessDenied for admins)
    if (loading) return null;

    const allowed = adminOnly
        ? isAdmin
        : permission
            ? hasPermission(permission)
            : true;

    if (!allowed) {
        if (silent) return null;
        return <>{fallback ?? <AccessDenied />}</>;
    }

    return <>{children}</>;
}
