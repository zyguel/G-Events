"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
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
        <div className={`flex items-center py-3 rounded-xl cursor-pointer transition-all duration-300 ${isExpanded ? 'gap-3 px-3' : 'justify-center'} ${active
            ? ''
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Image
                src={iconSrc}
                alt={alt}
                width={24}
                height={24}
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

interface ClientSidebarProps {
    activePage?: 'dashboard' | 'tickets' | 'settings';
    disableExpand?: boolean;
}

const ClientSidebar = ({ activePage = 'dashboard', disableExpand = false }: ClientSidebarProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const pathname = usePathname();
    const { t } = useLocale();
    const { isNavigationLocked, isPendingHref, handleNavigate } = useSidebarNavigationGuard(pathname);

    // Calculate the position of the sliding indicator based on active page
    const getIndicatorPosition = () => {
        const mainItems = ['dashboard', 'tickets'];
        const bottomItems = ['settings'];

        const mainIndex = mainItems.indexOf(activePage);
        if (mainIndex !== -1) {
            // Each item is 48px height (py-3 = 12px * 2 + 24px icon) + 8px gap
            return { top: 24 + (mainIndex * 56), isBottom: false };
        }

        const bottomIndex = bottomItems.indexOf(activePage);
        if (bottomIndex !== -1) {
            return { top: bottomIndex * 56, isBottom: true };
        }

        return { top: 0, isBottom: false };
    };

    const indicatorPos = getIndicatorPosition();

    return (
        <aside
            className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-[#F8F9FA] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center pt-6 pb-6 gap-2 z-40 transition-all duration-300 ease-in-out ${!disableExpand && isExpanded ? 'w-52' : 'w-20'
                }`}
            onMouseEnter={() => !disableExpand && setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Main navigation items */}
            <div className="w-full px-3 flex flex-col gap-2 relative">
                {/* Sliding indicator for main items */}
                {!indicatorPos.isBottom && (
                    <div
                        className="absolute left-3 right-3 h-12 bg-[#3D518C] rounded-xl shadow-lg transition-all duration-300 ease-in-out z-0"
                        style={{ top: `${indicatorPos.top - 24}px` }}
                    />
                )}
                <SidebarItem iconSrc="/icons/home.png" alt={t('Dashboard')} href="/home" active={activePage === 'dashboard'} label={t('Dashboard')} isExpanded={isExpanded} isPending={isPendingHref('/home')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
                <SidebarItem iconSrc="/icons/tickets.svg" alt={t('Tickets')} href="/tickets" active={activePage === 'tickets'} label={t('Tickets')} isExpanded={isExpanded} isPending={isPendingHref('/tickets')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
            </div>

            {/* Bottom navigation items */}
            <div className="mt-auto w-full px-3 flex flex-col gap-2 relative">
                {/* Sliding indicator for bottom items */}
                {indicatorPos.isBottom && (
                    <div
                        className="absolute left-3 right-3 h-12 bg-[#3D518C] rounded-xl shadow-lg transition-all duration-300 ease-in-out z-0"
                        style={{ top: `${indicatorPos.top}px` }}
                    />
                )}
                <SidebarItem iconSrc="/icons/settings.svg" alt={t('Settings')} href="/home/settings" active={activePage === 'settings'} label={t('Settings')} isExpanded={isExpanded} isPending={isPendingHref('/home/settings')} isNavigationLocked={isNavigationLocked} onNavigate={handleNavigate} />
            </div>
        </aside>
    );
};

export default ClientSidebar;
