"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import EventsSidebar from '@/components/admin/EventsSidebar';
import { Clock, Settings, Users, Check, Mail, RefreshCw } from 'lucide-react';

// Mock waitlist data
const mockWaitlistEntries = [
    { id: '1', fullName: 'Karylle Bernate', email: 'karyllebernate8@gmail.com', ticketType: 'General Admission', queue: 1, status: 'Invited' as const },
    { id: '2', fullName: 'Jan Carlo Juab', email: 'juab.jancarlo@gmail.com', ticketType: 'General Admission', queue: 2, status: 'Invited' as const },
    { id: '3', fullName: 'Ray Emannuel John', email: 'rayemanismgmail.com', ticketType: 'General Admission', queue: 3, status: 'Waiting' as const },
    { id: '4', fullName: 'Keith Lemuel', email: 'keithlemuel@gmail.com', ticketType: 'Premium Admission', queue: 1, status: 'Invited' as const },
    { id: '5', fullName: 'Vinz Waldheim Villarin', email: 'vinzvillarin@gmail.com', ticketType: 'Premium Admission', queue: 2, status: 'Invited' as const },
    { id: '6', fullName: 'John Carlo', email: 'johncarlo10gmail.com', ticketType: 'Premium Admission', queue: 3, status: 'Waiting' as const },
];

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'from-emerald-500 to-green-600' : type === 'error' ? 'from-red-500 to-rose-600' : 'from-blue-500 to-indigo-600';

    return (
        <div className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up`}>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Check size={18} />
            </div>
            <span className="font-medium">{message}</span>
        </div>
    );
};

// Checkbox component matching app style
const Checkbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <div
        onClick={onChange}
        className="flex items-center gap-3 cursor-pointer group py-1.5 select-none"
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
    >
        <div className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${checked
            ? 'bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] border-transparent shadow-md'
            : 'border-gray-300 dark:border-gray-600 group-hover:border-[#3D518C] group-hover:shadow-sm'}`}>
            {checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
        <span className={`text-sm transition-colors duration-200 ${checked ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>{label}</span>
    </div>
);

// Radio button component matching app style
const RadioButton = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <div
        onClick={onChange}
        className={`flex items-center gap-3 cursor-pointer group p-3 rounded-xl transition-all duration-200 select-none ${checked
            ? 'bg-gradient-to-r from-[#3D518C]/10 to-[#5C6BC0]/10 border border-[#3D518C]/30'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'}`}
        role="radio"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
    >
        <div className={`w-5 h-5 border-2 rounded-full transition-all duration-200 flex items-center justify-center ${checked ? 'border-[#3D518C]' : 'border-gray-300 dark:border-gray-600 group-hover:border-[#3D518C]'}`}>
            {checked && <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-full" />}
        </div>
        <span className={`text-sm transition-colors duration-200 ${checked ? 'text-[#3D518C] dark:text-[#7986CB] font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
    </div>
);

export default function ManageWaitlistPage() {
    const params = useParams();
    const eventId = params.eventId as string;

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Waitlist settings state
    const [expiryDays, setExpiryDays] = useState('7');
    const [inviteType, setInviteType] = useState<'auto' | 'manual'>('auto');
    const [showPosition, setShowPosition] = useState(false);

    // Waitlist entries state
    const [entries] = useState(mockWaitlistEntries);

    // Mock event data for sidebar
    const sidebarEvent = {
        id: eventId,
        name: "DevFest Cebu 2025",
        date: "November 20, 2025",
        status: "Ongoing" as const
    };

    const handleSaveSettings = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        setToast({ message: 'Waitlist settings saved successfully!', type: 'success' });
    };

    const handleInvite = async (entryId: string) => {
        setToast({ message: `Invitation sent to waitlist entry #${entryId}`, type: 'success' });
    };

    const getStatusBadge = (status: 'Invited' | 'Waiting') => {
        if (status === 'Invited') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <Check size={12} />
                    Invited
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <Clock size={12} />
                Waiting
            </span>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            {/* Toast Notification */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <style jsx global>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Navigation Sidebar */}
                <Sidebar activePage="events" disableExpand={true} />

                {/* Event Specific Sidebar */}
                <div className="ml-20 hidden lg:block h-full flex-shrink-0">
                    <EventsSidebar event={sidebarEvent} activePage="waitlist" />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 ml-20 lg:ml-0 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto space-y-8">

                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Manage <span className="bg-[#ABD2FA] dark:bg-[#3D518C] px-2 py-0.5 rounded">Waitlist</span>
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        Configure waitlist settings and manage queue
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <Users size={18} className="text-[#3D518C]" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-semibold text-[#3D518C]">{entries.length}</span> people in waitlist
                                </span>
                            </div>
                        </div>

                        {/* Waitlist Settings Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                            <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                            Waitlist Settings
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">Configure how your waitlist operates</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Waitlist Expiry */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Waitlist Expiry (in Days)
                                    </label>
                                    <input
                                        type="number"
                                        value={expiryDays}
                                        onChange={(e) => setExpiryDays(e.target.value)}
                                        min="1"
                                        max="30"
                                        className="w-32 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all duration-200"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        How many days the invite remains valid once a slot opens and invite is sent.
                                    </p>
                                </div>

                                {/* Invite Type */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Invite Type
                                    </label>
                                    <div className="space-y-2">
                                        <RadioButton
                                            label="Auto-Invite Next User when Slot Available"
                                            checked={inviteType === 'auto'}
                                            onChange={() => setInviteType('auto')}
                                        />
                                        <RadioButton
                                            label="Manual Invite Only"
                                            checked={inviteType === 'manual'}
                                            onChange={() => setInviteType('manual')}
                                        />
                                    </div>
                                </div>

                                {/* Show Position */}
                                <div className="pt-2">
                                    <Checkbox
                                        label="Show users current position in the queue."
                                        checked={showPosition}
                                        onChange={() => setShowPosition(!showPosition)}
                                    />
                                </div>

                                {/* Save Button */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={isLoading}
                                        className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Settings'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Waitlist Queue Management Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                            <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                            Waitlist Queue Management
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">View and manage people in the waitlist</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#ABD2FA] text-gray-700 dark:bg-[#3D518C] dark:text-white uppercase font-semibold text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 text-left">
                                                Full Name
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                Email Address
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                Ticket Type
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Queue
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {entry.fullName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {entry.email}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {entry.ticketType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#3D518C]/10 dark:bg-[#3D518C]/30 text-sm font-semibold text-[#3D518C] dark:text-[#ABD2FA]">
                                                        #{entry.queue}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {getStatusBadge(entry.status)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {entry.status === 'Waiting' && (
                                                        <button
                                                            onClick={() => handleInvite(entry.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-xs font-medium rounded-lg hover:shadow-md transition-all"
                                                        >
                                                            <Mail size={12} />
                                                            Send Invite
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {entries.length === 0 && (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No one in waitlist</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">When tickets sell out, people will be added to the waitlist here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
