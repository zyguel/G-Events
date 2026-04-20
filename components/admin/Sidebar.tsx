"use client";
import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminCompactMode } from '@/contexts/AdminCompactModeContext';
import { SidebarNavigateHandler, useSidebarNavigationGuard } from '@/lib/hooks/useSidebarNavigationGuard';
import GuardedSidebarLink from '@/components/common/GuardedSidebarLink';

interface SidebarItemProps {
    iconSrc: string;
    active?: boolean;
    alt?: string;
    href: string;
    label: string;
    isPending?: boolean;
    isNavigationLocked?: boolean;
    onNavigate?: SidebarNavigateHandler;
}

const SidebarItem = ({
    iconSrc,
    active = false,
    alt = "icon",
    href,
    label,
    isPending = false,
    isNavigationLocked = false,
    onNavigate,
}: SidebarItemProps) => (
    <GuardedSidebarLink
        href={href}
        isCurrent={active}
        onNavigate={onNavigate ?? (() => undefined)}
        isNavigationLocked={isNavigationLocked}
        isPending={isPending}
        className="w-full relative z-10 group"
        showSpinner
    >
        <div className={`relative flex items-center justify-center py-2 rounded-xl cursor-pointer transition-all duration-200 ${
            active ? '' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}>
            <Image
                src={iconSrc}
                alt={alt}
                width={18}
                height={18}
                className={`shrink-0 transition-all duration-200 ${
                    active ? 'brightness-0 invert' : 'opacity-60 group-hover:opacity-100 dark:invert dark:opacity-70'
                }`}
            />
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold whitespace-nowrap shadow-lg opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50">
                {label}
                {/* Arrow */}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
            </span>
        </div>
    </GuardedSidebarLink>
);

interface SidebarProps {
    activePage?: 'dashboard' | 'events' | 'analytics' | 'management' | 'settings' | 'profile';
    disableExpand?: boolean;
}

const Sidebar = ({ activePage = 'dashboard', disableExpand = false }: SidebarProps) => {
    const pathname = usePathname();
    const { t } = useLocale();
    const { pendingHref, isNavigationLocked, isPendingHref, handleNavigate } = useSidebarNavigationGuard(pathname);

    const { hasPermission, isAdmin, role, loading } = usePermissions();

    // permResolved = true means we know the user's role; apply restrictions
    // permResolved = false (still loading, or lookup failed) → fail-open (show all)
    const permResolved = !loading && role !== '';
    const canViewEvents = !permResolved || isAdmin || hasPermission('Create Event') || hasPermission('Edit Event Details') || hasPermission('View List of Attendees');
    const canCheckIn = !permResolved || isAdmin || hasPermission('Check In Attendees');
    const canViewAnalytics = !permResolved || isAdmin || hasPermission('View Reports');
    const canViewManagement = !permResolved || isAdmin;

    // Calculate the position of the sliding indicator based on active page
    const getIndicatorPosition = () => {
        const itemStride = 42; // Each item is 34px height (py-2 = 16px + 18px icon) + 8px gap

        // Main navigation items visibility
        const mainItems = [
            { id: 'dashboard', visible: true },
            { id: 'events', visible: canViewEvents },
            { id: 'analytics', visible: canViewAnalytics },
            { id: 'management', visible: canViewManagement },
        ].filter(i => i.visible).map(i => i.id);

        const bottomItems = ['settings', 'profile'];

        const mainIndex = mainItems.indexOf(activePage);
        if (mainIndex !== -1) {
            return { top: 24 + (mainIndex * itemStride), isBottom: false };
        }

        const bottomIndex = bottomItems.indexOf(activePage);
        if (bottomIndex !== -1) {
            return { top: bottomIndex * itemStride, isBottom: true };
        }

        return { top: 0, isBottom: false };
    };
    const indicatorPos = getIndicatorPosition();

    const { isCompactAdmin } = useAdminCompactMode();
    const showCompactNav = isCompactAdmin && (canViewEvents || canCheckIn);

    if (showCompactNav) {
        return (
            <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] bg-[#F8F9FA] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col items-center pt-6 pb-6 gap-2 z-40 w-14 hidden lg:flex">
                <div className="w-full px-3 flex flex-col gap-2 relative">
                    <div
                        className="absolute left-3 right-3 h-8.5 bg-[#3D518C] rounded-xl shadow-lg z-0"
                        style={{ top: '0px' }}
                    />
                    <SidebarItem
                        iconSrc="/icons/calendar.png"
                        alt={t('Events')}
                        href="/admin/events"
                        active={activePage === 'events'}
                        label={t('Events')}
                        isPending={isPendingHref('/admin/events')}
                        isNavigationLocked={isNavigationLocked}
                        onNavigate={handleNavigate}
                    />
                </div>
            </aside>
        );
    }

    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] bg-[#F8F9FA] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center pt-6 pb-6 gap-2 z-40 w-14 hidden lg:flex">
            {/* Main navigation items */}
            <div className="w-full px-3 flex flex-col gap-2 relative">
                {/* Sliding indicator for main items */}
                {!indicatorPos.isBottom && (
                    <div
                        className="absolute left-3 right-3 h-8.5 bg-[#3D518C] rounded-xl shadow-lg transition-all duration-300 ease-in-out z-0"
                        style={{ top: `${indicatorPos.top - 24}px` }}
                    />
                )}
                <SidebarItem iconSrc="/icons/home.png" alt={t('Dashboard')} href="/dashboard" active={activePage === 'dashboard'} label={t('Dashboard')} isPending={isPendingHref('/dashboard')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                {canViewEvents && (
                    <SidebarItem iconSrc="/icons/calendar.png" alt={t('Events')} href="/admin/events" active={activePage === 'events'} label={t('Events')} isPending={isPendingHref('/admin/events')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                )}
                {canViewAnalytics && (
                    <SidebarItem iconSrc="/icons/bar-chart.png" alt={t('Analytics')} href="/analytics/all" active={activePage === 'analytics'} label={t('Analytics')} isPending={isPendingHref('/analytics/all')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                )}
                {canViewManagement && (
                    <SidebarItem iconSrc="/icons/team.png" alt={t('Management')} href="/management" active={activePage === 'management'} label={t('Management')} isPending={isPendingHref('/management')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                )}
            </div>

            {/* Bottom navigation items */}
            <div className="mt-auto w-full px-3 flex flex-col gap-2 relative">
                {/* Sliding indicator for bottom items */}
                {indicatorPos.isBottom && (
                    <div
                        className="absolute left-3 right-3 h-8.5 bg-[#3D518C] rounded-xl shadow-lg transition-all duration-300 ease-in-out z-0"
                        style={{ top: `${indicatorPos.top}px` }}
                    />
                )}
                <SidebarItem iconSrc="/icons/settings.svg" alt={t('Settings')} href="/settings" active={activePage === 'settings'} label={t('Settings')} isPending={isPendingHref('/settings')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                <SidebarItem iconSrc="/icons/profile.svg" alt={t('Profile')} href="/profile" active={activePage === 'profile'} label={t('Profile')} isPending={isPendingHref('/profile')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
            </div>
        </aside>
    );
};

export default Sidebar;