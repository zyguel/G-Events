"use client";

import React, { useEffect, useState } from 'react';
import { Clock, Settings, Users, Check, Mail, RefreshCw, ChevronDown, Ticket } from 'lucide-react';
import { EventSummary } from '@/lib/types';
import TablePaginationControls from '@/components/admin/TablePaginationControls';

// Waitlist entry type and mock data (used only for local draft events)
type WaitlistStatus = 'Invited' | 'Waiting';

interface WaitlistEntryRow {
    id: string;
    fullName: string;
    email: string;
    ticketType: string;
    queue: number;
    status: WaitlistStatus;
    inviteSentAt?: string | null;
}

const mockWaitlistEntries: WaitlistEntryRow[] = [
    { id: '1', fullName: 'Karylle Bernate', email: 'karyllebernate8@gmail.com', ticketType: 'General Admission', queue: 1, status: 'Invited' },
    { id: '2', fullName: 'Jan Carlo Juab', email: 'juab.jancarlo@gmail.com', ticketType: 'General Admission', queue: 2, status: 'Invited' },
    { id: '3', fullName: 'Ray Emannuel John', email: 'rayemanismgmail.com', ticketType: 'General Admission', queue: 3, status: 'Waiting' },
    { id: '4', fullName: 'Keith Lemuel', email: 'keithlemuel@gmail.com', ticketType: 'Premium Admission', queue: 1, status: 'Invited' },
    { id: '5', fullName: 'Vinz Waldheim Villarin', email: 'vinzvillarin@gmail.com', ticketType: 'Premium Admission', queue: 2, status: 'Invited' },
    { id: '6', fullName: 'John Carlo', email: 'johncarlo10gmail.com', ticketType: 'Premium Admission', queue: 3, status: 'Waiting' },
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

interface WaitlistClientProps {
    event: EventSummary;
}

export default function ManageWaitlistPage({ event }: WaitlistClientProps) {
    const eventId = event.id;

    // Validate eventId
    if (!eventId || eventId === 'undefined') {
        console.error('Invalid eventId in waitlist page:', eventId);
        return (
            <div className="flex flex-col h-full items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Event</h1>
                    <p className="text-gray-600 dark:text-gray-400">Unable to load waitlist. Event ID is invalid.</p>
                </div>
            </div>
        );
    }

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isLoadingEntries, setIsLoadingEntries] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [invitingEntryId, setInvitingEntryId] = useState<string | null>(null);
    const [resendCooldownByEntryId, setResendCooldownByEntryId] = useState<Record<string, number>>({});
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Collapsed by default

    // Waitlist settings state
    const [expiryDays, setExpiryDays] = useState('7');
    const [inviteType, setInviteType] = useState<'auto' | 'manual'>('auto');
    const [showPosition, setShowPosition] = useState(false);

    // Waitlist entries state
    const [entries, setEntries] = useState<WaitlistEntryRow[]>(eventId.startsWith('evt-') ? mockWaitlistEntries : []);

    // Load entries from backend for real events
    useEffect(() => {
        if (eventId.startsWith('evt-')) {
            return;
        }

        const controller = new AbortController();

        const loadEntries = async () => {
            try {
                setIsLoadingEntries(true);
                const res = await fetch(`/api/events/${eventId}/waitlist`, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    throw new Error(`Failed to load waitlist (${res.status})`);
                }
                const json = await res.json();
                if (json?.success && Array.isArray(json.data)) {
                    setEntries(json.data);
                    if (json.settings) {
                        if (typeof json.settings.expiryDays === 'string') setExpiryDays(json.settings.expiryDays);
                        if (json.settings.inviteType === 'auto' || json.settings.inviteType === 'manual') {
                            setInviteType(json.settings.inviteType);
                        }
                        if (typeof json.settings.showPosition === 'boolean') {
                            setShowPosition(json.settings.showPosition);
                        }
                    }
                } else {
                    throw new Error(json?.error || 'Unexpected response format');
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                console.error('Error loading waitlist:', e);
                setToast({ message: e instanceof Error ? e.message : 'Failed to load waitlist', type: 'error' });
            } finally {
                setIsLoadingEntries(false);
            }
        };

        loadEntries();

        return () => controller.abort();
    }, [eventId]);

    useEffect(() => {
        const now = Date.now();
        const nextCooldowns: Record<string, number> = {};

        entries.forEach((entry) => {
            if (!entry.inviteSentAt) return;
            const sentAtMs = new Date(entry.inviteSentAt).getTime();
            if (Number.isNaN(sentAtMs)) return;

            const elapsed = Math.floor((now - sentAtMs) / 1000);
            const remaining = Math.max(60 - elapsed, 0);
            if (remaining > 0) {
                nextCooldowns[entry.id] = remaining;
            }
        });

        setResendCooldownByEntryId(nextCooldowns);
    }, [entries]);

    useEffect(() => {
        const hasCooldown = Object.keys(resendCooldownByEntryId).length > 0;
        if (!hasCooldown) return;

        const timer = window.setInterval(() => {
            setResendCooldownByEntryId((prev) => {
                const next: Record<string, number> = {};
                Object.entries(prev).forEach(([entryId, seconds]) => {
                    const newValue = seconds - 1;
                    if (newValue > 0) next[entryId] = newValue;
                });
                return next;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [resendCooldownByEntryId]);

    // Extract unique ticket types from entries
    const ticketTypes = Array.from(new Set(entries.map(e => e.ticketType)));

    // Determine default ticket type: General Admission if it has entries, otherwise the first tier with entries
    const getDefaultTicketType = (source: WaitlistEntryRow[]) => {
        const generalAdmission = 'General Admission';
        const hasGeneralAdmission = source.some(e => e.ticketType === generalAdmission);
        if (hasGeneralAdmission) return generalAdmission;
        return source.length > 0 ? source[0].ticketType : '';
    };

    // Ticket type filter state
    const [selectedTicketType, setSelectedTicketType] = useState(() => getDefaultTicketType(entries));
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Keep selected ticket type in sync when entries change
    useEffect(() => {
        if (!selectedTicketType && entries.length > 0) {
            setSelectedTicketType(getDefaultTicketType(entries));
        }
    }, [entries, selectedTicketType]);

    // Filtered entries based on selected ticket type
    const filteredEntries = selectedTicketType
        ? entries.filter(e => e.ticketType === selectedTicketType)
        : [];

    const paginatedEntries = filteredEntries.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedTicketType]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage));
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, filteredEntries.length, rowsPerPage]);



    const handleSaveSettings = async () => {
        if (eventId.startsWith('evt-')) {
            setToast({ message: 'Settings saved locally for draft event.', type: 'success' });
            return;
        }

        try {
            setIsSavingSettings(true);
            const res = await fetch(`/api/events/${eventId}/waitlist`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_settings',
                    expiryDays,
                    inviteType,
                    showPosition,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed to save waitlist settings (${res.status})`);
            }
            setToast({ message: 'Waitlist settings saved successfully!', type: 'success' });
        } catch (e) {
            console.error('Failed to save waitlist settings:', e);
            setToast({ message: e instanceof Error ? e.message : 'Failed to save settings.', type: 'error' });
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleInvite = async (entryId: string, action: 'invite' | 'resend_invite' = 'invite') => {
        if (eventId.startsWith('evt-')) {
            setEntries(prev =>
                prev.map(entry =>
                    entry.id === entryId ? { ...entry, status: 'Invited', inviteSentAt: new Date().toISOString() } : entry
                )
            );
            setResendCooldownByEntryId(prev => ({ ...prev, [entryId]: 60 }));
            setToast({ message: `${action === 'resend_invite' ? 'Invitation resent' : 'Invitation sent'} for entry #${entryId}.`, type: 'success' });
            return;
        }

        try {
            setInvitingEntryId(entryId);
            const res = await fetch(`/api/events/${eventId}/waitlist`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, entryId }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed to invite waitlist entry (${res.status})`);
            }

            const inviteSentAt = typeof json?.data?.inviteSentAt === 'string'
                ? json.data.inviteSentAt
                : new Date().toISOString();

            setEntries(prev =>
                prev.map(entry =>
                    entry.id === entryId ? { ...entry, status: 'Invited', inviteSentAt } : entry
                )
            );
            setResendCooldownByEntryId(prev => ({ ...prev, [entryId]: 60 }));
            setToast({
                message: `${action === 'resend_invite' ? 'Invitation resent' : 'Invitation sent'} to ${entries.find(e => e.id === entryId)?.email || 'waitlist attendee'}.`,
                type: 'success'
            });
        } catch (e) {
            console.error('Error sending invite:', e);
            setToast({ message: e instanceof Error ? e.message : 'Failed to send invite', type: 'error' });
        } finally {
            setInvitingEntryId(null);
        }
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
            {/* Toast Notification */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <style jsx global>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
                
                @keyframes slide-down {
                    from { opacity: 0; max-height: 0; }
                    to { opacity: 1; max-height: 1000px; }
                }
                .animate-slide-down { animation: slide-down 0.3s ease-out; }
            `}</style>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                                <Clock className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Manage <span className="dark:bg-[#3D518C] px-2 py-0.5 rounded">Waitlist</span>
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
                        <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
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
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                            >
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>

                        {isSettingsOpen && (
                            <div className="p-6 space-y-6 animate-slide-down">
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
                                        disabled={isSavingSettings}
                                        className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSavingSettings ? (
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
                        )}
                    </div>

                    {/* Waitlist Queue Management Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                            <div className="flex items-center justify-between">
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
                                {/* Ticket Type Filter Dropdown */}
                                <div className="flex items-center gap-2">
                                    <Ticket size={16} className="text-gray-500 dark:text-gray-400" />
                                    <div className="relative">
                                        <select
                                            value={selectedTicketType}
                                            onChange={(e) => setSelectedTicketType(e.target.value)}
                                            className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent cursor-pointer transition-all duration-200 hover:border-[#3D518C]"
                                        >
                                            {ticketTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                        ({filteredEntries.length} in queue)
                                    </span>
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
                                    {isLoadingEntries ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                Loading waitlist...
                                            </td>
                                        </tr>
                                    ) : paginatedEntries.map((entry) => (
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
                                                        disabled={invitingEntryId === entry.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-xs font-medium rounded-lg hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {invitingEntryId === entry.id ? (
                                                            <>
                                                                <RefreshCw size={12} className="animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Mail size={12} />
                                                                Send Invite
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                {entry.status === 'Invited' && (
                                                    <button
                                                        onClick={() => handleInvite(entry.id, 'resend_invite')}
                                                        disabled={invitingEntryId === entry.id || (resendCooldownByEntryId[entry.id] || 0) > 0}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg hover:shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {invitingEntryId === entry.id ? (
                                                            <>
                                                                <RefreshCw size={12} className="animate-spin" />
                                                                Resending...
                                                            </>
                                                        ) : (resendCooldownByEntryId[entry.id] || 0) > 0 ? (
                                                            <>
                                                                <Clock size={12} />
                                                                Resend in {resendCooldownByEntryId[entry.id]}s
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Mail size={12} />
                                                                Resend Invite
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <TablePaginationControls
                            totalItems={filteredEntries.length}
                            currentPage={currentPage}
                            rowsPerPage={rowsPerPage}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={(rows) => {
                                setRowsPerPage(rows);
                                setCurrentPage(1);
                            }}
                        />

                        {filteredEntries.length === 0 && !isLoadingEntries && (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No one in waitlist for {selectedTicketType}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">When tickets sell out, people will be added to the waitlist here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
