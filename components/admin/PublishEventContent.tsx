"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Send, FileText, Settings, Ticket, Globe, Calendar, MapPin, ImageIcon, CheckCircle, AlertCircle, Clock } from "lucide-react";
import DateInput from "./DateInput";
import TimeInput from "./TimeInput";
import { useRouter } from "next/navigation";
import SuccessModal from "./SuccessModal";
import Modal, { ModalFooter } from "./Modal";

import { EventData } from "@/lib/types";
import { usePermissions } from "@/contexts/PermissionContext";

interface TicketData {
    id: string;
    name: string;
    type: "paid" | "free";
    quantity: number;
    price: number;
    currency: string;
    startDate: string;
    endDate: string;
    // ... any other fields from the Ticket interface
}

export default function PublishEventContent({ event, tickets }: { event: EventData; tickets: any[] }) {
    const router = useRouter();
    const { hasPermission, isAdmin } = usePermissions();
    const canManageEventStatus = isAdmin || hasPermission('Manage Event Status');

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
    const [localStatus, setLocalStatus] = useState(event.status);
    const isEventPublished = localStatus === 'Published' || localStatus === 'Ongoing' || localStatus === 'Completed';

    // Form State
    const [settings, setSettings] = useState<{
        allowGroupRegistration: boolean;
        allowWaitlist: boolean;
        enableBreakoutSession: boolean;
        registrationOpenDate: string;
        registrationOpenTime: string;
        registrationCloseDate: string;
        registrationCloseTime: string;
        isVisibleToPublic: boolean;
    }>({
        allowGroupRegistration: event.allowGroupRegistration || false,
        allowWaitlist: event.allowWaitlist || false,
        enableBreakoutSession: event.enableBreakoutSession || false,
        registrationOpenDate: event.registrationOpenDate || '',
        registrationOpenTime: event.registrationOpenTime || '',
        registrationCloseDate: event.registrationCloseDate || '',
        registrationCloseTime: event.registrationCloseTime || '',
        isVisibleToPublic: event.isVisibleToPublic || false
    });

    const handleCheckboxChange = (key: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key as keyof typeof settings]
        }));
    };

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const toIsoDate = (value: Date) => {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const buildRegistrationTimestamp = (date: string, time: string, fallbackTime: string) => {
        if (!date) return null;
        const normalizedTime = time || fallbackTime;
        const candidate = new Date(`${date}T${normalizedTime}:00`);
        return Number.isNaN(candidate.getTime()) ? null : candidate;
    };

    const validateRegistrationWindow = () => {
        const openDate = settings.registrationOpenDate;
        const closeDate = settings.registrationCloseDate;

        if (openDate && openDate < toIsoDate(startOfToday)) {
            return 'Registration open date cannot be earlier than today.';
        }

        if (closeDate && closeDate < toIsoDate(startOfToday)) {
            return 'Registration close date cannot be earlier than today.';
        }

        const openAt = buildRegistrationTimestamp(openDate, settings.registrationOpenTime, '00:00');
        const closeAt = buildRegistrationTimestamp(closeDate, settings.registrationCloseTime, '23:59');

        if (openDate && !openAt) {
            return 'Registration open date/time is invalid.';
        }

        if (closeDate && !closeAt) {
            return 'Registration close date/time is invalid.';
        }

        if (openAt && closeAt && closeAt.getTime() < openAt.getTime()) {
            return 'Registration close date/time cannot be earlier than registration open date/time.';
        }

        return null;
    };

    const buildPublishSettingsPayload = () => {
        const regStartDate = buildRegistrationTimestamp(settings.registrationOpenDate, settings.registrationOpenTime, '00:00');
        const regEndDate = buildRegistrationTimestamp(settings.registrationCloseDate, settings.registrationCloseTime, '23:59');

        return {
            allow_group_registration: settings.allowGroupRegistration,
            allow_waitlist: settings.allowWaitlist,
            allow_breakout_sessions: settings.enableBreakoutSession,
            is_visible: settings.isVisibleToPublic,
            registration_open_at: regStartDate ? regStartDate.toISOString() : null,
            registration_close_at: regEndDate ? regEndDate.toISOString() : null,
        };
    };

    // Toast Component
    const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
        useEffect(() => {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }, [onClose]);

        const bgColor = type === 'success' ? 'from-emerald-500 to-green-600' : type === 'error' ? 'from-red-500 to-rose-600' : 'from-blue-500 to-indigo-600';

        return (
            <div className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up`}>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <CheckCircle size={18} />
                </div>
                <span className="font-medium">{message}</span>
            </div>
        );
    };

    const handlePublish = async () => {
        if (isPublishing) return;

        const validationError = validateRegistrationWindow();
        if (validationError) {
            setToast({ message: validationError, type: 'error' });
            return;
        }

        setIsPublishing(true);
        try {
            // 1. Update in Supabase
            const id = parseInt(event.id);
            if (!isNaN(id)) {
                const { updateEvent } = await import('@/lib/actions/events');
                const payload = buildPublishSettingsPayload();

                const res = await updateEvent(id, {
                    ...payload,
                    is_published: true,
                    // Publishing always makes the public event page available.
                    is_visible: true,
                });

                if (!res.success) {
                    console.error('Failed to publish event on server:', res.error);
                    setToast({ message: `Failed to publish event: ${res.error}`, type: 'error' });
                    setIsPublishing(false);
                    return;
                }
            }

            // 2. Update localStorage for backward compatibility
            try {
                const localDetail = localStorage.getItem(`event_detail_${event.id}`);
                if (localDetail) {
                    const parsed = JSON.parse(localDetail);
                    parsed.status = 'Upcoming';
                    localStorage.setItem(`event_detail_${event.id}`, JSON.stringify(parsed));
                }

                const storedEvents = JSON.parse(localStorage.getItem('mock_created_events') || '[]');
                const updatedEvents = storedEvents.map((e: any) => {
                    if (String(e.id) === String(event.id)) {
                        return { ...e, status: 'Upcoming', type: 'upcoming' };
                    }
                    return e;
                });
                localStorage.setItem('mock_created_events', JSON.stringify(updatedEvents));
            } catch (storageErr) {
                console.warn('localStorage update failed (non-critical):', storageErr);
            }

            setLocalStatus('Published');
            setSettings((prev) => ({ ...prev, isVisibleToPublic: true }));
            setShowSuccessModal(true);

        } catch (e) {
            console.error("Failed to publish event", e);
            setToast({ message: "Failed to publish event. Please try again.", type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleSaveSettings = async () => {
        if (isSavingSettings || isPublishing) return;

        const validationError = validateRegistrationWindow();
        if (validationError) {
            setToast({ message: validationError, type: 'error' });
            return;
        }

        setIsSavingSettings(true);
        try {
            const id = parseInt(event.id);
            if (isNaN(id)) {
                setToast({ message: 'Unable to save settings for this event.', type: 'error' });
                return;
            }

            const { updateEvent } = await import('@/lib/actions/events');
            const res = await updateEvent(id, buildPublishSettingsPayload());

            if (!res.success) {
                setToast({ message: `Failed to save settings: ${res.error}`, type: 'error' });
                return;
            }

            if (!isEventPublished && settings.isVisibleToPublic) {
                setToast({ message: 'Saved. Event page is now visible to the public.', type: 'success' });
            } else {
                setToast({ message: 'Publish settings saved.', type: 'success' });
            }

            router.refresh();
        } catch (e) {
            console.error('Failed to save publish settings', e);
            setToast({ message: 'Failed to save publish settings.', type: 'error' });
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleUnpublishClick = () => {
        setIsUnpublishModalOpen(true);
    };

    const confirmUnpublish = async () => {
        setIsPublishing(true);
        try {
            const id = parseInt(event.id);
            if (!isNaN(id)) {
                setToast({ message: 'Unpublishing...', type: 'info' });
                const { updateEvent } = await import('@/lib/actions/events');

                const res = await updateEvent(id, {
                    is_published: false,
                    is_visible: false,
                });

                if (res.success) {
                    setLocalStatus('Draft');
                    setToast({ message: 'Event unpublished successfully!', type: 'success' });
                    // Give the toast a moment to show, then refresh/redirect
                    setTimeout(() => router.refresh(), 1000);
                } else {
                    setToast({ message: `Failed to unpublish: ${res.error}`, type: 'error' });
                }
            } else {
                setToast({ message: "Mock event unpublished!", type: 'success' });
            }
        } catch (e) {
            console.error("Failed to unpublish", e);
            setToast({ message: "Failed to unpublish.", type: 'error' });
        } finally {
            setIsPublishing(false);
            setIsUnpublishModalOpen(false);
        }
    };

    // Helper for empty states
    const renderEmptyState = (value: string | undefined, label: string) => {
        if (!value) {
            return <span className="text-gray-400 italic font-light text-base">No {label.toLowerCase()} provided</span>;
        }
        return <span className="text-gray-900 dark:text-gray-200 font-medium">{value}</span>;
    };

    // Helper to format event date from ISO string to readable format
    const formatEventDate = (dateStr: string | undefined) => {
        if (!dateStr) {
            return <span className="text-gray-400 italic font-light text-base">No date provided</span>;
        }
        try {
            const date = new Date(dateStr);
            const formatted = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            return <span className="text-gray-900 dark:text-gray-200 font-medium">{formatted}</span>;
        } catch {
            return <span className="text-gray-900 dark:text-gray-200 font-medium">{dateStr}</span>;
        }
    };

    // Helper to format date range
    const formatSellingPeriod = (start: string, end: string) => {
        if (!start && !end) return <span className="text-gray-400 italic">Not set</span>;
        const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '...';
        return `${formatDate(start)} → ${formatDate(end)}`;
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8 pb-24 font-sans text-gray-900 dark:text-gray-100 animate-in fade-in duration-500">
            {/* Toast Notification */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <style jsx global>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>

            {/* Page Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                    <Send className="w-7 h-7 text-white ml-0.5 mt-0.5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Publish Event
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Review details and configure settings before going live
                    </p>
                </div>
            </div>

            {/* 1. Event Summary */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Event Summary
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                Review all basic event details
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Title</label>
                                <div className="text-lg">{renderEmptyState(event.name, "Title")}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Calendar size={12} /> Date & Time
                                </label>
                                <div className="text-lg">{formatEventDate(event.date)}</div>
                                {(event.startTime && event.endTime) ? (
                                    <div className="text-sm text-gray-500 mt-1">{event.startTime} - {event.endTime} PST</div>
                                ) : (
                                    <div className="text-gray-400 italic font-light mt-1 text-base">No time provided</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <MapPin size={12} /> Location
                                </label>
                                <div className="text-lg">{renderEmptyState(event.location, "Location")}</div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-6">
                                    {event.description || <span className="text-gray-400 italic font-light text-base">No description provided</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Banner Preview */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                            <ImageIcon size={12} /> Banner Preview
                        </label>
                        <div className="relative w-full aspect-[21/9] bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            {event.bannerImage ? (
                                <Image src={event.bannerImage} alt="Event Banner" fill sizes="(max-width: 768px) 100vw, 900px" className="object-cover" priority />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <ImageIcon size={32} className="opacity-50" />
                                    <span className="text-sm font-medium">No banner uploaded</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Registration Settings */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Registration Settings
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                Configure participant options
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { key: 'allowGroupRegistration', label: 'Allow Group Registration', desc: 'Enable multi-person signup' },
                            { key: 'allowWaitlist', label: 'Allow Waitlist', desc: 'Queue when capacity full' },
                            { key: 'enableBreakoutSession', label: 'Enable Breakouts', desc: 'Sub-sessions within event' }
                        ].map((item) => (
                            <label key={item.key} className={`
                                relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                ${settings[item.key as keyof typeof settings]
                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                                    : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-gray-600'}
                            `}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`
                                        w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                        ${settings[item.key as keyof typeof settings]
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'border-gray-300 dark:border-gray-600'}
                                    `}>
                                        {settings[item.key as keyof typeof settings] && <CheckCircle size={12} />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={settings[item.key as keyof typeof settings] as boolean}
                                        onChange={() => handleCheckboxChange(item.key as keyof typeof settings)}
                                        disabled={!canManageEventStatus}
                                    />
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{item.label}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Ticket Summary */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Ticket Summary
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                Overview of created tickets
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-0 overflow-x-auto">
                    {tickets.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-[#ABD2FA] text-gray-700 dark:bg-[#3D518C] dark:text-white uppercase font-semibold text-xs tracking-wider">
                                <tr>
                                    <th className="px-8 py-4">Ticket Name</th>
                                    <th className="px-8 py-4">Price</th>
                                    <th className="px-8 py-4">Quantity</th>
                                    <th className="px-8 py-4">Selling Period</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {tickets.map((ticket, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-8 py-4 font-medium text-gray-900 dark:text-white">{ticket.name}</td>
                                        <td className="px-8 py-4">
                                            {ticket.type === 'free' ? 'Free' : `${ticket.currency} ${ticket.price}`}
                                        </td>
                                        <td className="px-8 py-4">{ticket.quantity}</td>
                                        <td className="px-8 py-4 text-sm text-gray-500">
                                            {formatSellingPeriod(ticket.startDate, ticket.endDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-gray-400 italic">
                            No tickets created yet.
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Publish Settings */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Publish Settings
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                Visibility and timing controls
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Registration Open Date */}
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Registration Open Date</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
                                    <DateInput
                                        value={settings.registrationOpenDate ? new Date(settings.registrationOpenDate) : null}
                                        onChange={(date) => setSettings({ ...settings, registrationOpenDate: date ? date.toISOString().split('T')[0] : '' })}
                                        placeholder="Select date"
                                        disabled={!canManageEventStatus}
                                        minDate={startOfToday}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Time</label>
                                    <TimeInput
                                        value={settings.registrationOpenTime}
                                        onChange={(time) => setSettings({ ...settings, registrationOpenTime: time })}
                                        placeholder="Select time"
                                        disabled={!canManageEventStatus}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Registration Close Date */}
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Registration Close Date</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
                                    <DateInput
                                        value={settings.registrationCloseDate ? new Date(settings.registrationCloseDate) : null}
                                        onChange={(date) => setSettings({ ...settings, registrationCloseDate: date ? date.toISOString().split('T')[0] : '' })}
                                        placeholder="Select date"
                                        disabled={!canManageEventStatus}
                                        minDate={startOfToday}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Time</label>
                                    <TimeInput
                                        value={settings.registrationCloseTime}
                                        onChange={(time) => setSettings({ ...settings, registrationCloseTime: time })}
                                        placeholder="Select time"
                                        disabled={!canManageEventStatus}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isEventPublished && (
                    <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                        <label className={`
                            flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer
                            ${settings.isVisibleToPublic
                                ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10'
                                : 'border-gray-100 dark:border-gray-700 hover:border-emerald-200'}
                        `}>
                            <div className={`
                                w-6 h-6 rounded-full border flex items-center justify-center transition-colors flex-shrink-0
                                ${settings.isVisibleToPublic
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-gray-300 dark:border-gray-600'}
                            `}>
                                {settings.isVisibleToPublic && <CheckCircle size={14} />}
                            </div>
                            <input type="checkbox" className="hidden" checked={settings.isVisibleToPublic} onChange={() => handleCheckboxChange('isVisibleToPublic')} disabled={!canManageEventStatus} />
                            <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white block">Make Event Page Visible to Public</span>
                                <span className="text-xs text-gray-500">While the event is still unpublished, enable this to make the landing page accessible even if registration has not started or tickets are not on sale yet. Publishing the event always makes the public page available.</span>
                            </div>
                        </label>
                    </div>
                    )}
                </div>
            </section>

            {/* Actions */}
            {canManageEventStatus && (
                <div className="flex justify-end gap-3 mt-8">
                    {isEventPublished && (
                        <button
                            onClick={handleUnpublishClick}
                            disabled={isPublishing}
                            className="px-6 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors shadow-sm"
                        >
                            Unpublish Event
                        </button>
                    )}

                    <button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings || isPublishing}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 border ${isSavingSettings || isPublishing
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
                            }`}
                    >
                        {isSavingSettings ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-500 rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                Save Changes
                            </>
                        )}
                    </button>

                    {!isEventPublished && (
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing || isSavingSettings}
                            className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${isPublishing || isSavingSettings
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                        >
                            {isPublishing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Publish Event
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                eventName={event.name}
                eventId={event.id}
                onGoToDashboard={() => router.push('/admin/events')}
            />

            <Modal
                isOpen={isUnpublishModalOpen}
                onClose={() => !isPublishing && setIsUnpublishModalOpen(false)}
                title="Unpublish Event"
                subtitle="This action will hide the event from the public."
                size="sm"
            >
                <div className="text-sm border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-r-lg mb-6">
                    <p className="text-amber-800 dark:text-amber-300">
                        Are you sure you want to unpublish <strong>{event.name}</strong>? Users will no longer be able to view the landing page or register for this event.
                    </p>
                </div>

                <ModalFooter
                    onCancel={() => setIsUnpublishModalOpen(false)}
                    cancelText="Keep Published"
                    onSave={confirmUnpublish}
                    saveText="Unpublish Event"
                    isSubmitting={isPublishing}
                    isDanger={true}
                    submitType="button"
                />
            </Modal>
        </div>
    );
}
