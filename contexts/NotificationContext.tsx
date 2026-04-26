"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
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
const READ_KEY = 'g_events_read_notifications';
const ADMIN_ROOTS = ['/dashboard', '/admin/events', '/management', '/profile', '/settings'];

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

const getReadIds = (): Set<string> => {
    try {
        const raw = localStorage.getItem(READ_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
};

const saveReadId = (id: string) => {
    try {
        const existing = getReadIds();
        existing.add(id);
        localStorage.setItem(READ_KEY, JSON.stringify([...existing]));
    } catch { /* ignore */ }
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
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

    // Fetch notifications using polling
    useEffect(() => {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        if (!isAdminAppRoute(pathname)) {
            return;
        }

        const supabase = createClient();
        let intervalId: NodeJS.Timeout | null = null;
        let isActive = true;

        const fetchNotifications = async () => {
            if (!isActive || !hasSessionRef.current) return;
            
            try {
                const response = await fetch('/api/notifications');
                if (!response.ok) {
                    if (!hadFetchErrorRef.current) {
                        console.warn('Notifications fetch failed:', response.status);
                        hadFetchErrorRef.current = true;
                    }
                    return;
                }
                
                const body = await response.json();
                const data = body?.data;
                if (Array.isArray(data)) {
                    const dismissed = getDismissedIds();
                    const readIds = getReadIds();
                    const parsed: Notification[] = data
                        .filter((n: any) => !dismissed.has(n.id))
                        .map((n: any) => ({
                            ...n,
                            timestamp: new Date(n.timestamp),
                            read: readIds.has(n.id) || n.read,
                        }));
                    setNotifications(parsed);
                    hadFetchErrorRef.current = false;
                }
            } catch (err) {
                if (!hadFetchErrorRef.current) {
                    console.warn('Notifications fetch error:', err);
                    hadFetchErrorRef.current = true;
                }
            }
        };

        const startPolling = () => {
            if (!isActive || !hasSessionRef.current || intervalId) {
                return;
            }
            // Fetch immediately
            void fetchNotifications();
            // Then poll every 30 seconds
            intervalId = setInterval(fetchNotifications, 30000);
        };

        const stopPolling = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        const initializeSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.warn('NotificationContext: failed to read auth session', error);
                    hasSessionRef.current = false;
                    stopPolling();
                    setNotifications([]);
                    return;
                }

                hasSessionRef.current = Boolean(session);

                if (!hasSessionRef.current) {
                    stopPolling();
                    setNotifications([]);
                    return;
                }

                startPolling();
            } catch (error) {
                console.warn('NotificationContext: auth session bootstrap failed', error);
                hasSessionRef.current = false;
                stopPolling();
                setNotifications([]);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            hasSessionRef.current = Boolean(session);

            if (!session) {
                stopPolling();
                hadFetchErrorRef.current = false;
                setNotifications([]);
                return;
            }

            startPolling();
        });

        void initializeSession();

        return () => {
            isActive = false;
            stopPolling();
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
        saveReadId(id);
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        const existing = getReadIds();
        notifications.forEach(n => existing.add(n.id));
        try {
            localStorage.setItem(READ_KEY, JSON.stringify([...existing]));
        } catch { /* ignore */ }
        
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, [notifications]);

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
