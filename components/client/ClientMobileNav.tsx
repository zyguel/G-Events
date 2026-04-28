"use client";

import Link from 'next/link';
import { Home, Ticket, Award, Settings } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface ClientMobileNavProps {
    activePage: 'dashboard' | 'tickets' | 'certificates' | 'settings';
}

export default function ClientMobileNav({ activePage }: ClientMobileNavProps) {
    const { t } = useLocale();

    const items = [
        { id: 'dashboard' as const, href: '/home', label: t('Home'), icon: Home },
        { id: 'tickets' as const, href: '/tickets', label: t('Tickets'), icon: Ticket },
        { id: 'certificates' as const, href: '/certificates', label: t('Certificates'), icon: Award },
        { id: 'settings' as const, href: '/home/settings', label: t('Settings'), icon: Settings },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
            <div className="max-w-md mx-auto px-3 py-2 grid grid-cols-4 gap-2">
                {items.map(({ id, href, label, icon: Icon }) => {
                    const active = activePage === id;

                    return (
                        <Link
                            key={id}
                            href={href}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                                active
                                    ? 'text-[#3D518C] dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/25'
                                    : 'text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
