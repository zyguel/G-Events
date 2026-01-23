"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { User, Bell, Shield, Palette, Globe, CreditCard, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        marketing: false,
        updates: true,
    });

    const settingsSections = [
        {
            id: 'account',
            title: 'Account Settings',
            description: 'Manage your account details and preferences',
            icon: User,
            color: 'from-blue-500 to-indigo-600',
        },
        {
            id: 'notifications',
            title: 'Notifications',
            description: 'Configure how you receive notifications',
            icon: Bell,
            color: 'from-amber-500 to-orange-500',
        },
        {
            id: 'privacy',
            title: 'Privacy & Security',
            description: 'Manage your privacy and security settings',
            icon: Shield,
            color: 'from-emerald-500 to-green-600',
        },
        {
            id: 'appearance',
            title: 'Appearance',
            description: 'Customize how the app looks',
            icon: Palette,
            color: 'from-purple-500 to-pink-500',
        },
        {
            id: 'language',
            title: 'Language & Region',
            description: 'Set your preferred language and region',
            icon: Globe,
            color: 'from-cyan-500 to-blue-500',
        },
        {
            id: 'billing',
            title: 'Billing & Payments',
            description: 'Manage your billing information',
            icon: CreditCard,
            color: 'from-rose-500 to-red-600',
        },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="settings" />

                <main className="flex-1 ml-20 overflow-y-auto p-8">
                    <div className="space-y-6 max-w-4xl mx-auto">

                        {/* Header Section */}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Settings
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                Manage your account settings and preferences
                            </p>
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {settingsSections.map((section) => {
                                const IconComponent = section.icon;
                                return (
                                    <div
                                        key={section.id}
                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white`}>
                                                    <IconComponent size={22} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{section.description}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Notification Preferences */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose what notifications you receive</p>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Receive notifications via email</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${notifications.email ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.email ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Receive push notifications in browser</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${notifications.push ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.push ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Marketing Emails</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Receive updates about new features</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, marketing: !prev.marketing }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${notifications.marketing ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.marketing ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Event Updates</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Get notified about event changes</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, updates: !prev.updates }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${notifications.updates ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.updates ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm transition-all duration-300 hover:shadow-lg">
                            <div className="p-6 border-b border-red-100 dark:border-red-900/30">
                                <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Irreversible and destructive actions</p>
                            </div>
                            <div className="p-5 flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Delete Account</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Permanently delete your account and all data</p>
                                </div>
                                <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                                    Delete Account
                                </button>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
