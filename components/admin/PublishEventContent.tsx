"use client";

import { useState } from "react";
import Image from "next/image";
import { Send, FileText, Settings, Ticket, Globe, Calendar, MapPin, ImageIcon, CheckCircle, AlertCircle, Clock } from "lucide-react";
import DateTimeInput from "./DateTimeInput";

interface EventData {
    id: string;
    name: string;
    date: string;
    location?: string;
    description?: string;
    bannerImage?: string;
    startTime?: string;
    endTime?: string;
}

interface TicketData {
    name: string;
    price: string;
    quantity: number;
    sellingStart: string;
    sellingEnd: string;
}

export default function PublishEventContent({ event }: { event: EventData }) {
    // Mock Ticket Data
    const tickets: TicketData[] = [];

    // Form State
    const [settings, setSettings] = useState<{
        allowGroupRegistration: boolean;
        allowWaitlist: boolean;
        enableBreakoutSession: boolean;
        registrationOpenDate: Date | null;
        registrationCloseDate: Date | null;
        isVisibleToPublic: boolean;
    }>({
        allowGroupRegistration: false,
        allowWaitlist: false,
        enableBreakoutSession: false,
        registrationOpenDate: null,
        registrationCloseDate: null,
        isVisibleToPublic: false
    });

    const handleCheckboxChange = (key: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key as keyof typeof settings]
        }));
    };

    const handlePublish = () => {
        console.log("Publishing event:", settings);
        // Implement publish logic here
        alert("Event published successfully!");
    };

    const handleSaveDraft = () => {
        console.log("Saving draft:", settings);
        // Implement save draft logic here
        alert("Draft saved!");
    };

    // Helper for empty states
    const renderEmptyState = (value: string | undefined, label: string) => {
        if (!value) {
            return <span className="text-gray-400 italic font-light text-base">No {label.toLowerCase()} provided</span>;
        }
        return <span className="text-gray-900 dark:text-gray-200 font-medium">{value}</span>;
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8 pb-24 font-sans text-gray-900 dark:text-gray-100 animate-in fade-in duration-500">
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
                                <div className="text-lg">{renderEmptyState(event.date, "Date")}</div>
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
                                <Image src={event.bannerImage} alt="Event Banner" fill className="object-cover" />
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
                                        <td className="px-8 py-4">{ticket.price}</td>
                                        <td className="px-8 py-4">{ticket.quantity}</td>
                                        <td className="px-8 py-4 text-sm text-gray-500">
                                            {ticket.sellingStart} <span className="mx-1">→</span> {ticket.sellingEnd}
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
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
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

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Registration Open Date</label>
                            <DateTimeInput
                                value={settings.registrationOpenDate}
                                onChange={(date) => setSettings({ ...settings, registrationOpenDate: date })}
                                placeholder="Select open date & time"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Registration Close Date</label>
                            <DateTimeInput
                                value={settings.registrationCloseDate}
                                onChange={(date) => setSettings({ ...settings, registrationCloseDate: date })}
                                placeholder="Select close date & time"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
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
                            <input type="checkbox" className="hidden" checked={settings.isVisibleToPublic} onChange={() => handleCheckboxChange('isVisibleToPublic')} />
                            <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white block">Make Event Page Visible to Public</span>
                                <span className="text-xs text-gray-500">Enable this to make the landing page accessible even if registration hasn't started.</span>
                            </div>
                        </label>
                    </div>
                </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8">
                <button
                    onClick={handleSaveDraft}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors shadow-sm"
                >
                    Save as Draft
                </button>

                <button
                    onClick={handlePublish}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-lg hover:-translate-y-0.5 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                    <Send size={16} />
                    Publish Event
                </button>
            </div>
        </div>
    );
}
