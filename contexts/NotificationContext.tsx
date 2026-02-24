"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    icon?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    dismissNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DISMISSED_KEY = 'g_events_dismissed_notifications';

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

    // Fetch real notifications from the API on mount, filtering out dismissed ones
    useEffect(() => {
        fetch('/api/notifications')
            .then(res => res.json())
            .then(({ data }) => {
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
            })
            .catch(err => console.warn('Could not load notifications:', err));
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

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
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
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
