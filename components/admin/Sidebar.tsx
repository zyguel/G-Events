"use client";
import React, { useState } from 'react';
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
    isExpanded: boolean;
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
    isExpanded,
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
        className="w-full relative z-10"
        showSpinner
    >
        <div className={`flex items-center py-2 rounded-xl cursor-pointer transition-all duration-300 ${isExpanded ? 'gap-3 px-3' : 'justify-center'} ${active
            ? ''
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Image
                src={iconSrc}
                alt={alt}
                width={18}
                height={18}
                className={`shrink-0 transition-all duration-300 ${active ? 'brightness-0 invert' : 'opacity-60 hover:opacity-100 dark:invert dark:opacity-70'}`}
            />
            <span
                className={`whitespace-nowrap text-sm font-medium transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 w-0'
                    } ${active ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                {label}
            </span>
        </div>
    </GuardedSidebarLink>
);

interface SidebarProps {
    activePage?: 'dashboard' | 'events' | 'analytics' | 'management' | 'settings' | 'profile';
    disableExpand?: boolean;
}

const Sidebar = ({ activePage = 'dashboard', disableExpand = false }: SidebarProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const pathname = usePathname();
    const { t } = useLocale();
    const { pendingHref, isNavigationLocked, isPendingHref, handleNavigate } = useSidebarNavigationGuard(pathname);

    // Calculate the position of the sliding indicator based on active page
    const getIndicatorPosition = () => {
        const mainItems = ['dashboard', 'events', 'analytics', 'management'];
        const bottomItems = ['settings', 'profile'];

        const mainIndex = mainItems.indexOf(activePage);
        if (mainIndex !== -1) {
            // Each item is 38px height (py-2 = 8px * 2 + 18px icon) + 8px gap
            return { top: 24 + (mainIndex * 46), isBottom: false };
        }

        const bottomIndex = bottomItems.indexOf(activePage);
        if (bottomIndex !== -1) {
            return { top: bottomIndex * 46, isBottom: true };
        }

        return { top: 0, isBottom: false };
    };

    const indicatorPos = getIndicatorPosition();
    const { hasPermission, isAdmin, role, loading } = usePermissions();

    // permResolved = true means we know the user's role; apply restrictions
    // permResolved = false (still loading, or lookup failed) → fail-open (show all)
    const permResolved = !loading && role !== '';
    const canViewEvents = !permResolved || isAdmin || hasPermission('Create Event') || hasPermission('Edit Event Details') || hasPermission('View List of Attendees');
    const canCheckIn = !permResolved || isAdmin || hasPermission('Check In Attendees');
    const canViewAnalytics = !permResolved || isAdmin || hasPermission('View Reports');
    const canViewManagement = !permResolved || isAdmin;

    const { isCompactAdmin } = useAdminCompactMode();
    const showCompactNav = isCompactAdmin && (canViewEvents || canCheckIn);

    if (showCompactNav) {
        return (
            <aside
                className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-[#F8F9FA] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center pt-6 pb-6 gap-2 z-40 w-14 transition-all duration-300 ease-in-out`}
            >
                <div className="w-full px-3 flex flex-col gap-2 relative">
                    <div
                        className="absolute left-3 right-3 h-8.5 bg-[#3D518C] rounded-xl shadow-lg transition-all duration-300 ease-in-out z-0"
                        style={{ top: '0px' }}
                    />
                    <SidebarItem
                        iconSrc="/icons/calendar.png"
                        alt={t('Events')}
                        href="/admin/events"
                        active={activePage === 'events'}
                        label={t('Events')}
                        isExpanded={false}
                        isPending={isPendingHref('/admin/events')}
                        isNavigationLocked={isNavigationLocked}
                        onNavigate={handleNavigate}
                    />
                </div>
            </aside>
        );
    }

    return (
        <aside
            className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-[#F8F9FA] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center pt-6 pb-6 gap-2 z-40 transition-all duration-300 ease-in-out ${!disableExpand && isExpanded ? 'w-44' : 'w-14'
                }`}
            onMouseEnter={() => !disableExpand && setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Main navigation items */}
            <div className="w-full px-3 flex flex-col gap-2 relative">
                {/* Sliding indicator for main items */}
                {!indicatorPos.isBottom && (
                    <div
                        className="absolute left-3 right-3 h-8.5 bg-[#3D518C] rounded-xl shadow-lg transition-all duration-300 ease-in-out z-0"
                        style={{ top: `${indicatorPos.top - 24}px` }}
                    />
                )}
                <SidebarItem iconSrc="/icons/home.png" alt={t('Dashboard')} href="/dashboard" active={activePage === 'dashboard'} label={t('Dashboard')} isExpanded={isExpanded} isPending={isPendingHref('/dashboard')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                {canViewEvents && (
                    <SidebarItem iconSrc="/icons/calendar.png" alt={t('Events')} href="/admin/events" active={activePage === 'events'} label={t('Events')} isExpanded={isExpanded} isPending={isPendingHref('/admin/events')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                )}
                {canViewAnalytics && (
                    <SidebarItem iconSrc="/icons/bar-chart.png" alt={t('Analytics')} href="/analytics/all" active={activePage === 'analytics'} label={t('Analytics')} isExpanded={isExpanded} isPending={isPendingHref('/analytics/all')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                )}
                {canViewManagement && (
                    <SidebarItem iconSrc="/icons/team.png" alt={t('Management')} href="/management" active={activePage === 'management'} label={t('Management')} isExpanded={isExpanded} isPending={isPendingHref('/management')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
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
                <SidebarItem iconSrc="/icons/settings.svg" alt={t('Settings')} href="/settings" active={activePage === 'settings'} label={t('Settings')} isExpanded={isExpanded} isPending={isPendingHref('/settings')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                <SidebarItem iconSrc="/icons/profile.svg" alt={t('Profile')} href="/profile" active={activePage === 'profile'} label={t('Profile')} isExpanded={isExpanded} isPending={isPendingHref('/profile')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
            </div>
        </aside>
    );
};

export default Sidebar;