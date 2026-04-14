"use client";

import { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { SidebarNavigateHandler } from "@/lib/hooks/useSidebarNavigationGuard";

interface GuardedSidebarLinkProps {
    href: string;
    isCurrent: boolean;
    onNavigate: SidebarNavigateHandler;
    isNavigationLocked: boolean;
    isPending: boolean;
    className: string;
    children: ReactNode;
    disabled?: boolean;
    showSpinner?: boolean;
    spinnerClassName?: string;
}

export default function GuardedSidebarLink({
    href,
    isCurrent,
    onNavigate,
    isNavigationLocked,
    isPending,
    className,
    children,
    disabled = false,
    showSpinner = true,
    spinnerClassName = "absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-current border-r-transparent animate-spin",
}: GuardedSidebarLinkProps) {
    const interactionClass = disabled
        ? "pointer-events-none opacity-60 cursor-not-allowed"
        : isPending
            ? "pointer-events-none opacity-80 cursor-wait"
            : "";

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (disabled) {
            event.preventDefault();
            return;
        }

        onNavigate(event, href, isCurrent);
    };

    return (
        <Link
            href={href}
            onClick={handleClick}
            aria-disabled={disabled || isPending}
            className={`${className} relative ${interactionClass}`.trim()}
        >
            {children}
            {showSpinner && isPending && <span aria-hidden="true" className={spinnerClassName} />}
        </Link>
    );
}
