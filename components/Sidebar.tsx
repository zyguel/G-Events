"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface SidebarItemProps {
    iconSrc: string;
    active?: boolean;
    alt?: string;
    href: string;
    label: string;
    isExpanded: boolean;
}

const SidebarItem = ({ iconSrc, active = false, alt = "icon", href, label, isExpanded }: SidebarItemProps) => (
    <Link href={href} className="w-full relative z-10">
        <div className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${active
            ? ''
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Image
                src={iconSrc}
                alt={alt}
                width={24}
                height={24}
                className={`flex-shrink-0 transition-all duration-300 ${active ? 'brightness-0 invert' : 'opacity-60 hover:opacity-100 dark:invert dark:opacity-70'}`}
            />
            <span
                className={`whitespace-nowrap text-sm font-medium transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 w-0'
                    } ${active ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}
            >
                {label}
            </span>
        </div>
    </Link>
);

interface SidebarProps {
    activePage?: 'dashboard' | 'events' | 'analytics' | 'management' | 'settings' | 'profile';
}

const Sidebar = ({ activePage = 'dashboard' }: SidebarProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate the position of the sliding indicator based on active page
    const getIndicatorPosition = () => {
        const mainItems = ['dashboard', 'events', 'analytics', 'management'];
        const bottomItems = ['settings', 'profile'];

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
            className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-[#F8F9FA] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center pt-6 pb-6 gap-2 z-40 transition-all duration-300 ease-in-out ${isExpanded ? 'w-52' : 'w-20'
                }`}
            onMouseEnter={() => setIsExpanded(true)}
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
                <SidebarItem iconSrc="/icons/home.png" alt="Dashboard" href="/dashboard" active={activePage === 'dashboard'} label="Dashboard" isExpanded={isExpanded} />
                <SidebarItem iconSrc="/icons/calendar.png" alt="Events" href="/events" active={activePage === 'events'} label="Events" isExpanded={isExpanded} />
                <SidebarItem iconSrc="/icons/bar-chart.png" alt="Analytics" href="/analytics/all" active={activePage === 'analytics'} label="Analytics" isExpanded={isExpanded} />
                <SidebarItem iconSrc="/icons/team.svg" alt="Management" href="/management" active={activePage === 'management'} label="Management" isExpanded={isExpanded} />
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
                <SidebarItem iconSrc="/icons/settings.svg" alt="Settings" href="/settings" active={activePage === 'settings'} label="Settings" isExpanded={isExpanded} />
                <SidebarItem iconSrc="/icons/profile.svg" alt="Profile" href="/profile" active={activePage === 'profile'} label="Profile" isExpanded={isExpanded} />
            </div>
        </aside>
    );
};

export default Sidebar;