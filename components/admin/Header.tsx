"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, AlertTriangle, Users } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from './NotificationDropdown';
import { createClient } from '@/lib/supabase-browser';
import { useLocale } from '@/contexts/LocaleContext';

interface UserProfile {
    name: string;
    email: string;
    avatarSeed: string;
}

const Header = () => {
    const router = useRouter();
    const { t } = useLocale();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = user.user_metadata?.name
                    || user.user_metadata?.full_name
                    || user.email?.split('@')[0]
                    || 'User';
                setUser({
                    name,
                    email: user.email ?? '',
                    avatarSeed: encodeURIComponent(name),
                });
            }
        };

        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: { user_metadata?: { name?: string; full_name?: string }; email?: string } } | null) => {
            if (session?.user) {
                const name = session.user.user_metadata?.name
                    || session.user.user_metadata?.full_name
                    || session.user.email?.split('@')[0]
                    || 'User';
                setUser({
                    name,
                    email: session.user.email ?? '',
                    avatarSeed: encodeURIComponent(name),
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogoutConfirm = async () => {
        setIsLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/login');
    };

    return (
        <>
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm z-50 border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Image
                            src="/icons/company-logo.svg"
                            alt="G Events Logo"
                            width={40}
                            height={40}
                            className="drop-shadow-sm"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl tracking-tight text-[#3D518C] dark:text-white leading-none">
                            G Events
                        </span>
                        <span className="hidden md:block text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase">
                            {t('Event Registration')}
                        </span>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notification Dropdown */}
                    <NotificationDropdown />

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                    {/* User Profile — clickable → /profile */}
                    <button
                        onClick={() => router.push('/profile')}
                        title={t('View profile')}
                        className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200 group"
                    >
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#3D518C] to-[#5C6BC0] overflow-hidden relative ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-[#3D518C]/40 shadow-sm shrink-0 transition-all duration-200">
                            {user ? (
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed}`}
                                    alt={user.name}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                            )}
                        </div>
                        <div className="hidden md:flex flex-col text-left">
                            {user ? (
                                <>
                                    <span className="font-semibold text-sm text-gray-800 dark:text-white leading-tight group-hover:text-[#3D518C] dark:group-hover:text-indigo-300 transition-colors">{user.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                                </>
                            ) : (
                                <>
                                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                                    <div className="h-2.5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </>
                            )}
                        </div>
                    </button>

                    {/* Switch Session Mode */}
                    <form action="/auth/session-role/choose" method="post">
                        <input type="hidden" name="role" value="attendee" />
                        <input type="hidden" name="next" value="/dashboard" />
                        <button
                            type="submit"
                            title={t('Switch to attendee mode')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-200"
                        >
                            <Users size={17} />
                            <span className="hidden md:block text-sm font-medium">{t('Attend mode')}</span>
                        </button>
                    </form>

                    {/* Sign Out Button */}
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        title={t('Sign out')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                        <LogOut size={17} />
                        <span className="hidden md:block text-sm font-medium">{t('Sign out')}</span>
                    </button>
                </div>
            </header>

            {/* Sign Out Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-200 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !isLoggingOut && setShowLogoutModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <AlertTriangle size={28} className="text-red-500" />
                        </div>

                        {/* Text */}
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('Sign out?')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t("You'll be logged out of your G Events session. Any unsaved changes will be lost.")}
                            </p>
                        </div>

                        {/* User info */}
                        {user && (
                            <div className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed}`}
                                    alt={user.name}
                                    className="w-9 h-9 rounded-full shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 w-full mt-1">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                disabled={isLoggingOut}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
                            >
                                {t('Cancel')}
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                disabled={isLoggingOut}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        {t('Signing out...')}
                                    </>
                                ) : (
                                    <>
                                        <LogOut size={15} />
                                        {t('Yes, sign out')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;