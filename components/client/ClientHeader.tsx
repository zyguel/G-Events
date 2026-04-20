"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { LogOut, Home, Ticket, Settings, ChevronDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../admin/ThemeToggle';
import NotificationDropdown from '../admin/NotificationDropdown';
import { createClient } from '@/lib/supabase-browser';
import { useLocale } from '@/contexts/LocaleContext';

interface UserProfile {
    name: string;
    email: string;
    avatarSeed: string;
    metadataAvatarUrl: string | null;
    bucketAvatarUrl: string | null;
}

function isRecoverableAuthSessionError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
    return message.includes('refresh_token_not_found')
        || message.includes('invalid refresh token')
        || message.includes('refresh token not found');
}

export type ClientHeaderVariant = 'default' | 'guest';

interface ClientHeaderProps {
    /** `guest`: magic-link pages (e-ticket) — no account menu or sign-out. */
    variant?: ClientHeaderVariant;
}

const ClientHeader = ({ variant = 'default' }: ClientHeaderProps) => {
    const router = useRouter();
    const { t } = useLocale();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [avatarSourceIndex, setAvatarSourceIndex] = useState(0);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const getMetadataAvatarUrl = (metadata: Record<string, unknown> | undefined): string | null => {
        if (!metadata) return null;
        const candidates = [metadata.avatar_url, metadata.picture, metadata.photo_url, metadata.image, metadata.profile_image_url];
        const firstUrl = candidates.find((value) => {
            if (typeof value !== 'string') return false;
            const trimmed = value.trim();
            if (!trimmed) return false;
            return !trimmed.startsWith('storage:');
        });
        return typeof firstUrl === 'string' ? firstUrl : null;
    };

    const getStoredAvatarPath = (metadata: Record<string, unknown> | undefined): string | null => {
        if (!metadata) return null;
        const profilePath = typeof metadata.profile_image_path === 'string' ? metadata.profile_image_path.trim() : '';
        if (profilePath) return profilePath;

        const avatarValue = typeof metadata.avatar_url === 'string' ? metadata.avatar_url.trim() : '';
        if (avatarValue.startsWith('storage:')) {
            return avatarValue.slice('storage:'.length).trim() || null;
        }

        return null;
    };

    const getBucketAvatarUrlFromApi = async (path?: string): Promise<string | null> => {
        const query = path ? `?path=${encodeURIComponent(path)}` : '';
        const response = await fetch(`/api/profile/avatar${query}`, { method: 'GET' });
        if (!response.ok) {
            return null;
        }

        const payload = await response.json();
        if (!payload?.success) {
            return null;
        }

        return (payload?.data?.avatarUrl as string | null) ?? null;
    };

    const buildUserProfile = async (
        rawUser: {
            email?: string;
            user_metadata?: Record<string, unknown>;
        }
    ): Promise<UserProfile> => {
        const name = (rawUser.user_metadata?.name as string | undefined)
            || (rawUser.user_metadata?.full_name as string | undefined)
            || rawUser.email?.split('@')[0]
            || 'User';

        const metadataAvatarUrl = getMetadataAvatarUrl(rawUser.user_metadata);
        const storedAvatarPath = getStoredAvatarPath(rawUser.user_metadata);
        const bucketAvatarUrl = await getBucketAvatarUrlFromApi(storedAvatarPath ?? undefined);

        return {
            name,
            email: rawUser.email ?? '',
            avatarSeed: encodeURIComponent(name),
            metadataAvatarUrl,
            bucketAvatarUrl,
        };
    };

    useEffect(() => {
        if (variant === 'guest') return;

        const supabase = createClient();
        let cancelled = false;

        const setUserFromRaw = async (rawUser: {
            email?: string;
            user_metadata?: Record<string, unknown>;
        }) => {
            try {
                const nextUser = await buildUserProfile(rawUser);
                if (!cancelled) {
                    setUser(nextUser);
                    setAvatarSourceIndex(0);
                }
            } catch {
                const name =
                    (rawUser.user_metadata?.name as string | undefined) ||
                    (rawUser.user_metadata?.full_name as string | undefined) ||
                    rawUser.email?.split('@')[0] ||
                    'User';

                if (!cancelled) {
                    setUser({
                        name,
                        email: rawUser.email ?? '',
                        avatarSeed: encodeURIComponent(name),
                        metadataAvatarUrl: null,
                        bucketAvatarUrl: null,
                    });
                    setAvatarSourceIndex(0);
                }
            }
        };

        const fetchUser = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    if (isRecoverableAuthSessionError(error)) {
                        await supabase.auth.signOut().catch(() => undefined);
                    } else {
                        console.warn('ClientHeader: failed to read auth session', error);
                    }
                    if (!cancelled) {
                        setUser(null);
                    }
                    return;
                }

                const sessionUser = data.session?.user;
                if (sessionUser) {
                    await setUserFromRaw({
                        email: sessionUser.email,
                        user_metadata: sessionUser.user_metadata as Record<string, unknown> | undefined,
                    });
                    return;
                }

                if (!cancelled) {
                    setUser(null);
                }
            } catch (error) {
                if (!isRecoverableAuthSessionError(error)) {
                    console.warn('ClientHeader: auth session bootstrap failed', error);
                }
                if (!cancelled) {
                    setUser(null);
                }
            }
        };
        void fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                void setUserFromRaw({
                    email: session.user.email,
                    user_metadata: session.user.user_metadata as Record<string, unknown> | undefined,
                });
            } else {
                if (!cancelled) {
                    setUser(null);
                }
            }
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, [variant]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogoutConfirm = async () => {
        setIsLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/login');
    };

    const navLinks = [
        { label: t('Home'), href: '/home', icon: Home },
        { label: t('Tickets'), href: '/tickets', icon: Ticket },
        { label: t('Settings'), href: '/home/settings', icon: Settings },
    ];

    const avatarSources = user
        ? [
            user.metadataAvatarUrl,
            user.bucketAvatarUrl,
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed}`,
        ].filter((source): source is string => Boolean(source && source.trim().length > 0))
        : [];

    const activeAvatarSrc = avatarSources[Math.min(avatarSourceIndex, Math.max(avatarSources.length - 1, 0))] ?? null;

    const handleAvatarImageError = () => {
        setAvatarSourceIndex((prev) => (prev < avatarSources.length - 1 ? prev + 1 : prev));
    };

    return (
        <>
            <header className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm z-50 border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
                {/* Logo */}
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
                    <div className="hidden md:block">
                        <ThemeToggle />
                    </div>
                    {variant === 'default' && (
                        <>
                            <NotificationDropdown />

                            <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                            {/* Profile Button with Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen((prev) => !prev)}
                                    title={t('Account menu')}
                                    className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200 group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#3D518C] to-[#5C6BC0] overflow-hidden relative ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-[#3D518C]/40 shadow-sm shrink-0 transition-all duration-200">
                                        {user && activeAvatarSrc ? (
                                            <img
                                                src={activeAvatarSrc}
                                                alt={user.name}
                                                className="object-cover w-full h-full"
                                                onError={handleAvatarImageError}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="hidden md:flex flex-col text-left">
                                        {user ? (
                                            <>
                                                <span className="font-semibold text-sm text-gray-800 dark:text-white leading-tight group-hover:text-[#3D518C] dark:group-hover:text-indigo-300 transition-colors">
                                                    {user.name}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                                                <div className="h-2.5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </>
                                        )}
                                    </div>
                                    <ChevronDown
                                        size={14}
                                        className={`hidden md:block text-gray-400 group-hover:text-[#3D518C] dark:group-hover:text-indigo-300 transition-all duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        {navLinks.map(({ label, href, icon: Icon }) => (
                                            <Link
                                                key={href}
                                                href={href}
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#3D518C] dark:hover:text-indigo-300 transition-colors duration-150 mx-1 rounded-xl"
                                            >
                                                <Icon size={16} className="shrink-0 text-gray-400" />
                                                {label}
                                            </Link>
                                        ))}
                                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                                        <form action="/auth/session-role/choose" method="post" className="mx-1">
                                            <input type="hidden" name="role" value="organizer" />
                                            <input type="hidden" name="next" value="/dashboard" />
                                            <button
                                                type="submit"
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#3D518C] dark:hover:text-indigo-300 transition-colors duration-150 rounded-xl"
                                            >
                                                <ShieldCheck size={16} className="shrink-0 text-gray-400" />
                                                {t('Switch to organizer')}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {/* Sign Out Button */}
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                title={t('Sign out')}
                                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                            >
                                <LogOut size={17} />
                                <span className="hidden md:block text-sm font-medium">{t('Sign out')}</span>
                            </button>
                        </>
                    )}
                    {variant === 'guest' && (
                        <Link
                            href="/login"
                            className="text-sm font-semibold text-[#3D518C] dark:text-indigo-300 hover:underline px-2 py-1.5 rounded-lg"
                        >
                            {t('Sign in')}
                        </Link>
                    )}
                </div>
            </header>

            {/* Sign Out Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-200 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !isLoggingOut && setShowLogoutModal(false)}
                    />
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <AlertTriangle size={28} className="text-red-500" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('Sign out?')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t("You'll be logged out of your G Events session.")}
                            </p>
                        </div>
                        {user && (
                            <div className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                                {activeAvatarSrc ? (
                                    <img
                                        src={activeAvatarSrc}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full shrink-0 object-cover"
                                        onError={handleAvatarImageError}
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full shrink-0 bg-gray-200 dark:bg-gray-700" />
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</span>
                                </div>
                            </div>
                        )}
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

export default ClientHeader;
