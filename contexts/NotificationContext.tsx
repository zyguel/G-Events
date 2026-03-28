"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    icon?: string;
}

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    updates: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    preferences: NotificationPreferences;
    setPreferences: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    dismissNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DISMISSED_KEY = 'g_events_dismissed_notifications';
const PREFS_KEY = 'g_events_notification_prefs';
const ADMIN_ROOTS = ['/dashboard', '/events', '/management', '/profile', '/settings'];

function isAdminAppRoute(pathname: string) {
    return ADMIN_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

const getDismissedIds = (): Set<string> => {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
};

const saveDismissedId = (id: string) => {
    try {
        const existing = getDismissedIds();
        existing.add(id);
        localStorage.setItem(DISMISSED_KEY, JSON.stringify([...existing]));
    } catch { /* ignore */ }
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inFlightRef = useRef(false);
    const hadFetchErrorRef = useRef(false);
    const hasSessionRef = useRef(false);
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        email: true,
        push: true,
        updates: true,
    });

    // Load preferences from localStorage on mount, stripping stale keys
    useEffect(() => {
        try {
            const saved = localStorage.getItem(PREFS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setPreferences(prev => ({
                    email: typeof parsed.email === 'boolean' ? parsed.email : prev.email,
                    push: typeof parsed.push === 'boolean' ? parsed.push : prev.push,
                    updates: typeof parsed.updates === 'boolean' ? parsed.updates : prev.updates,
                }));
            }
        } catch { /* ignore */ }
    }, []);

    // Save preferences when they change
    useEffect(() => {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
        } catch { /* ignore */ }
    }, [preferences]);

    // Fetch notifications from the API and poll every 30 seconds
    useEffect(() => {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        if (!isAdminAppRoute(pathname)) {
            return;
        }

        const supabase = createClient();

        const SUCCESS_POLL_MS = 30000;
        const ERROR_RETRY_MS = 15000;
        let isActive = true;

        const clearScheduledPoll = () => {
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
                pollTimeoutRef.current = null;
            }
        };

        const schedulePoll = (delayMs: number) => {
            if (!isActive || !hasSessionRef.current) {
                return;
            }
            clearScheduledPoll();
            pollTimeoutRef.current = setTimeout(() => {
                void fetchNotifications();
            }, delayMs);
        };

        const fetchNotifications = async () => {
            if (!isActive || inFlightRef.current || !hasSessionRef.current) {
                return;
            }

            inFlightRef.current = true;
            try {
                const res = await fetch('/api/notifications', {
                    cache: 'no-store',
                    credentials: 'same-origin',
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        hasSessionRef.current = false;
                        hadFetchErrorRef.current = false;
                        clearScheduledPoll();
                        setNotifications([]);
                        return;
                    }
                    throw new Error(`Notifications request failed: ${res.status}`);
                }

                const body = await res.json();
                const data = body?.data;
                if (Array.isArray(data)) {
                    const dismissed = getDismissedIds();
                    const parsed: Notification[] = data
                        .filter((n: any) => !dismissed.has(n.id))
                        .map((n: any) => ({
                            ...n,
                            timestamp: new Date(n.timestamp),
                        }));
                    setNotifications(parsed);
                }

                hadFetchErrorRef.current = false;
                schedulePoll(SUCCESS_POLL_MS);
            } catch (err) {
                if (!hadFetchErrorRef.current) {
                    console.warn('Could not load notifications:', err);
                    hadFetchErrorRef.current = true;
                }
                schedulePoll(ERROR_RETRY_MS);
            } finally {
                inFlightRef.current = false;
            }
        };

        const startPollingIfAuthenticated = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            hasSessionRef.current = Boolean(session);

            if (!hasSessionRef.current) {
                clearScheduledPoll();
                setNotifications([]);
                return;
            }

            void fetchNotifications();
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            hasSessionRef.current = Boolean(session);

            if (!session) {
                clearScheduledPoll();
                hadFetchErrorRef.current = false;
                setNotifications([]);
                return;
            }

            void fetchNotifications();
        });

        void startPollingIfAuthenticated();

        return () => {
            isActive = false;
            clearScheduledPoll();
            subscription.unsubscribe();
        };
    }, []);

    const filteredNotifications = notifications.filter(n => {
        // If push notifications are disabled, hide all notifications from the UI dropdown
        if (!preferences.push) return false;

        const titleLower = n.title.toLowerCase();

        // Updates filter — only target the 'Event Updated' notification
        if (!preferences.updates) {
            if (titleLower === 'event updated') {
                return false;
            }
        }

        return true;
    });

    const unreadCount = filteredNotifications.filter(n => !n.read).length;

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const dismissNotification = useCallback((id: string) => {
        saveDismissedId(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAllNotifications = useCallback(() => {
        // Persist all current notification IDs as dismissed so they don't reappear on reload
        notifications.forEach(n => saveDismissedId(n.id));
        setNotifications([]);
    }, [notifications]);

    return (
        <NotificationContext.Provider
            value={{
                notifications: filteredNotifications,
                unreadCount,
                preferences,
                setPreferences,
                addNotification,
                dismissNotification,
                markAsRead,
                markAllAsRead,
                clearAllNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
