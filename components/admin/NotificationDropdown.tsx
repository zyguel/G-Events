"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Users, ShoppingCart, Calendar, AlertTriangle, Trophy, Trash2 } from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';

const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

const getNotificationIcon = (type: Notification['type'], title: string) => {
    const iconClasses = "w-5 h-5";

    // Check title for specific icons
    if (title.toLowerCase().includes('registration')) {
        return <Users className={`${iconClasses} text-emerald-500`} />;
    }
    if (title.toLowerCase().includes('order')) {
        return <ShoppingCart className={`${iconClasses} text-amber-500`} />;
    }
    if (title.toLowerCase().includes('event')) {
        return <Calendar className={`${iconClasses} text-blue-500`} />;
    }
    if (title.toLowerCase().includes('milestone') || title.toLowerCase().includes('reached')) {
        return <Trophy className={`${iconClasses} text-purple-500`} />;
    }

    // Fall back to type-based icons
    switch (type) {
        case 'success':
            return <Check className={`${iconClasses} text-emerald-500`} />;
        case 'warning':
            return <AlertTriangle className={`${iconClasses} text-amber-500`} />;
        case 'alert':
            return <AlertTriangle className={`${iconClasses} text-red-500`} />;
        default:
            return <Bell className={`${iconClasses} text-blue-500`} />;
    }
};

const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
        case 'success':
            return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10';
        case 'warning':
            return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10';
        case 'alert':
            return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
        default:
            return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    }
};

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, dismissNotification, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        // Dismiss notification when clicked
        dismissNotification(notification.id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 group"
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-[#3D518C] dark:group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell size={18} />
                                <h3 className="font-semibold">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck size={16} />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAllNotifications}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                        title="Clear all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`px-4 py-3 border-l-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 group ${getNotificationStyles(notification.type)} ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-0 border-l-transparent'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${notification.read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                                                {getNotificationIcon(notification.type, notification.title)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm font-semibold truncate ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            dismissNotification(notification.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                                                        title="Dismiss"
                                                    >
                                                        <X size={14} className="text-gray-400" />
                                                    </button>
                                                </div>
                                                <p className={`text-sm mt-0.5 ${notification.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {getTimeAgo(notification.timestamp)}
                                                </p>
                                            </div>

                                            {/* Unread indicator */}
                                            {!notification.read && (
                                                <div className="flex-shrink-0 w-2.5 h-2.5 bg-[#3D518C] rounded-full mt-1.5" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                Click a notification to dismiss it
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
