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

// Sample notifications generator - simulates real-time data
const generateSampleNotifications = (): Notification[] => {
    const now = new Date();
    return [
        {
            id: '1',
            type: 'success',
            title: 'New Registrations',
            message: '24 people registered for DevFest Cebu 2025 today!',
            timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago
            read: false,
        },
        {
            id: '2',
            type: 'warning',
            title: 'Orders Pending Review',
            message: '29 orders need review for Google I/O Extended 2025',
            timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 mins ago
            read: false,
        },
        {
            id: '3',
            type: 'info',
            title: 'Event Starting Soon',
            message: 'Women Techmakers 2025 starts in 2 hours!',
            timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
            read: false,
        },
        {
            id: '4',
            type: 'warning',
            title: 'Waitlist Growing',
            message: '15 attendees on the waitlist for Google I/O Cebu 2024',
            timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
            read: false,
        },
        {
            id: '5',
            type: 'success',
            title: 'Registration Milestone',
            message: 'DevFest Cebu 2024 hit 300 registrations!',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: true,
        },
    ];
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Initialize with sample notifications
    useEffect(() => {
        setNotifications(generateSampleNotifications());
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
