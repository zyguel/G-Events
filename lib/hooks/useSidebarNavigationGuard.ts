"use client";

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SidebarNavigateHandler = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    isCurrent: boolean
) => void;

interface UseSidebarNavigationGuardOptions {
    unlockTimeoutMs?: number;
}

export function useSidebarNavigationGuard(
    pathname: string,
    options: UseSidebarNavigationGuardOptions = {}
) {
    const [pendingHref, setPendingHref] = useState<string | null>(null);
    const pendingHrefRef = useRef<string | null>(null);
    const { unlockTimeoutMs = 5000 } = options;

    useEffect(() => {
        pendingHrefRef.current = null;
        setPendingHref(null);
    }, [pathname]);

    useEffect(() => {
        if (!pendingHref) return;

        const timeoutId = window.setTimeout(() => {
            if (pendingHrefRef.current === pendingHref) {
                pendingHrefRef.current = null;
                setPendingHref(null);
            }
        }, unlockTimeoutMs);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [pendingHref, unlockTimeoutMs]);

    const handleNavigate = useCallback<SidebarNavigateHandler>((event, href, isCurrent) => {
        if (!href || href === "#" || isCurrent || pathname === href) {
            event.preventDefault();
            return;
        }

        if (pendingHrefRef.current === href) {
            event.preventDefault();
            return;
        }

        pendingHrefRef.current = href;
        setPendingHref(href);
    }, [pathname]);

    const isNavigationLocked = useMemo(() => Boolean(pendingHref), [pendingHref]);

    const isPendingHref = useCallback((href: string) => pendingHref === href, [pendingHref]);

    return {
        pendingHref,
        isNavigationLocked,
        isPendingHref,
        handleNavigate,
    };
}