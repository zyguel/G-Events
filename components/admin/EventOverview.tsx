"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, MapPin, Upload, Plus, Clock, Trash2, X, Users, Pencil } from "lucide-react";
import Modal from "./Modal";
import Image from "next/image";

// Types
interface AgendaItem {
    id: string;
    title: string;
    speaker?: string;
    startTime: string;
    endTime: string;
    description: string;
}

interface EventData {
    id: string;
    name: string;
    subtitle?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location: string;
    description?: string;
    theme?: string;
    objectives: string[];
    agenda: AgendaItem[];
    bannerUrl?: string;
    status: string;
}

export default function EventOverview({ initialData }: { initialData: any }) {
    // State
    const [event, setEvent] = useState<EventData>({
        ...initialData,
        subtitle: initialData.subtitle || "",
        startTime: initialData.startTime || "14:00", // 24h format for inputs
        endTime: initialData.endTime || "20:00",
        // Ensure objectives start empty if not provided, or respecting user request to start empty
        objectives: initialData.objectives && initialData.objectives.length > 0 ? initialData.objectives : [],
        agenda: initialData.agenda || []
    });

    const [activeModal, setActiveModal] = useState<null | 'banner' | 'title' | 'dateLocation' | 'overview' | 'agenda' | 'deleteBanner'>(null);

    // Form States
    const [newAgenda, setNewAgenda] = useState<Partial<AgendaItem>>({});
    const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
    const [newObjective, setNewObjective] = useState("");
    const [isAddingObjective, setIsAddingObjective] = useState(false);
    const objectiveInputRef = useRef<HTMLInputElement>(null);

    // ... useEffect ...

    // --- Actions ---

    const handleSaveTitle = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setEvent(prev => ({
            ...prev,
            name: formData.get('name') as string,
            subtitle: formData.get('subtitle') as string
        }));
        setActiveModal(null);
    };

    const handleSaveDateLocation = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setEvent(prev => ({
            ...prev,
            date: formData.get('date') as string,
            startTime: formData.get('startTime') as string,
            endTime: formData.get('endTime') as string,
            location: formData.get('location') as string
        }));
        setActiveModal(null);
    };

    const handleSaveOverview = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setEvent(prev => ({
            ...prev,
            description: formData.get('description') as string,
            theme: formData.get('theme') as string,
        }));
        setActiveModal(null);
    };

    const handleAddObjective = () => {
        if (newObjective.trim()) {
            setEvent(prev => ({
                ...prev,
                objectives: [...prev.objectives, newObjective.trim()]
            }));
            setNewObjective("");
            setIsAddingObjective(false);
        }
    };

    const handleRemoveObjective = (index: number) => {
        setEvent(prev => ({
            ...prev,
            objectives: prev.objectives.filter((_, i) => i !== index)
        }));
    };

    const handleAddAgendaSlot = () => {
        if (!newAgenda.title || !newAgenda.speaker || !newAgenda.startTime || !newAgenda.endTime) return;

        if (editingAgendaId) {
            // Update existing item
            setEvent(prev => ({
                ...prev,
                agenda: prev.agenda.map(item =>
                    item.id === editingAgendaId
                        ? { ...item, ...newAgenda } as AgendaItem
                        : item
                )
            }));
        } else {
            // Add new item
            const newItem: AgendaItem = {
                id: Date.now().toString(), // Simple unique ID
                title: newAgenda.title,
                speaker: newAgenda.speaker || '',
                startTime: newAgenda.startTime || '',
                endTime: newAgenda.endTime || '',
                description: newAgenda.description || ''
            };

            setEvent(prev => ({
                ...prev,
                agenda: [...(prev.agenda || []), newItem]
            }));
        }
        setNewAgenda({});
        setEditingAgendaId(null);
        setActiveModal(null);
    };

    const handleEditAgendaItem = (item: AgendaItem) => {
        setNewAgenda(item);
        setEditingAgendaId(item.id);
        setActiveModal('agenda');
    };

    const handleDeleteBanner = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveModal('deleteBanner');
    };

    const confirmDeleteBanner = () => {
        setEvent(prev => ({
            ...prev,
            bannerUrl: undefined
        }));
        setActiveModal(null);
    };

    const handleSaveBanner = () => {
        // Mock saving a banner for demonstration
        setEvent(prev => ({
            ...prev,
            bannerUrl: "/api/placeholder/800/400" // Mock URL to trigger the "filled" state
        }));
        setActiveModal(null);
    };

    // Helper to format time for display
    const formatTimeDisplay = (time24: string) => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    // Helper to format date for display
    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            // Verify date is valid
            if (isNaN(date.getTime())) return dateStr;

            return new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC' // Assuming input date is YYYY-MM-DD without time, render as UTC to avoid timezone shifts
            }).format(date);
        } catch (e) {
            return dateStr;
        }
    };

    // ... existing handlers ...

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6 pb-20 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-gray-100">

            {/* 1. Banner */}
            <div className="relative w-full aspect-[21/9] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group">
                {event.bannerUrl ? (
                    <div className="absolute inset-0">
                        <Image
                            src={event.bannerUrl}
                            alt="Event Banner"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div
                            onClick={() => setActiveModal('banner')}
                            className="w-64 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col items-center gap-3 cursor-pointer hover:shadow-md hover:scale-105 transition-all"
                        >
                            <Upload className="text-indigo-600 dark:text-indigo-400" size={24} />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center leading-tight">
                                Upload event banner image
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions: Delete and Edit */}
                {event.bannerUrl && (
                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                        <button
                            onClick={handleDeleteBanner}
                            className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full text-red-500 hover:text-red-700 shadow-sm hover:scale-110 transition-transform"
                            title="Delete Banner"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={() => setActiveModal('banner')}
                            className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full text-indigo-600 dark:text-indigo-400 shadow-sm hover:scale-110 transition-transform"
                            title="Change Banner"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* 2. Title */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                {event.name && (
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 font-sans">
                        Event Title
                    </span>
                )}
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                    {event.name || <span className="opacity-50">Event Title</span>}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium italic">
                    {event.subtitle}
                </p>
                <button
                    onClick={() => setActiveModal('title')}
                    className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* 3. Date & Location */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700 align-top">
                    <div className="space-y-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Date and Time</h2>
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <Calendar className="text-indigo-500" size={20} />
                            </div>
                            <div className="flex flex-col">
                                {event.date ? (
                                    <span className="text-base font-semibold text-gray-900 dark:text-white">{formatDateDisplay(event.date)}</span>
                                ) : (
                                    <span className="text-base font-medium text-gray-400 italic">Date TBD</span>
                                )}
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                    {formatTimeDisplay(event.startTime || "")} - {formatTimeDisplay(event.endTime || "")} PST
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="md:pl-8 pt-6 md:pt-0 space-y-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Location</h2>
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <MapPin className="text-red-500" size={20} />
                            </div>
                            <div className="text-base text-gray-600 dark:text-gray-300 font-medium">
                                {event.location || <span className="text-gray-400 italic">No location set</span>}
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setActiveModal('dateLocation')}
                    className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* 4. Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
                {event.description ? (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {event.description}
                        </p>
                        {event.theme && (
                            <div className="mt-4">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white block mb-1">Theme</span>
                                <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">
                                    {event.theme}
                                </span>
                            </div>
                        )}
                        {event.objectives && event.objectives.length > 0 && (
                            <div className="mt-4">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">Objectives</span>
                                <ul className="space-y-1">
                                    {event.objectives.map((obj, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                            {obj}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No overview added yet. Click the + button to add details.</p>
                )}
                <button
                    onClick={() => setActiveModal('overview')}
                    className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* 5. Agenda */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda</h2>
                    {event.agenda.length > 0 && (
                        <button
                            onClick={() => {
                                setNewAgenda({});
                                setEditingAgendaId(null);
                                setActiveModal('agenda');
                            }}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors font-sans"
                        >
                            + Add Item
                        </button>
                    )}
                </div>

                {event.agenda.length > 0 ? (
                    <div className="space-y-2">
                        {[...event.agenda]
                            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                            .map((slot, i) => (
                                <div key={i} className="flex gap-4 py-3 px-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-100 dark:hover:border-indigo-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-gray-800/50 group/item">
                                    <div className="min-w-[140px] text-sm font-semibold text-indigo-600 dark:text-indigo-400 pt-0.5 whitespace-nowrap">
                                        {formatTimeDisplay(slot.startTime)}
                                        {slot.endTime && ` - ${formatTimeDisplay(slot.endTime)}`}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{slot.title}</h3>
                                            <div className="flex items-center gap-2">
                                                {slot.speaker && (
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 flex-shrink-0 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                                                        <Users size={14} className="text-gray-500 dark:text-gray-400" />
                                                        <span className="truncate max-w-[150px]">{slot.speaker}</span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditAgendaItem(slot);
                                                    }}
                                                    className="text-gray-400 hover:text-indigo-500 transition-colors p-1 opacity-0 group-hover/item:opacity-100"
                                                    title="Edit Item"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEvent(prev => ({
                                                            ...prev,
                                                            agenda: prev.agenda.filter(item => item.id !== slot.id)
                                                        }));
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover/item:opacity-100"
                                                    title="Remove Item"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        {slot.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{slot.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                        <p className="text-gray-400 mb-2 text-sm">No agenda items yet</p>
                        <button
                            onClick={() => {
                                setNewAgenda({});
                                setEditingAgendaId(null);
                                setActiveModal('agenda');
                            }}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 font-sans"
                        >
                            + Add Agenda Item
                        </button>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* Banner Modal */}
            <Modal isOpen={activeModal === 'banner'} onClose={() => setActiveModal(null)} title="Upload Banner">
                <div className="space-y-6">
                    <div className="group relative border-2 border-dashed border-gray-300 dark:border-gray-600 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-all duration-300 cursor-pointer hover:border-indigo-400">
                        <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-sm flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 border border-gray-100 dark:border-gray-600">
                            <Upload size={28} className="drop-shadow-sm" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Click to upload</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (max. 20MB)</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 rounded-xl transition-colors font-sans">Cancel</button>
                        <button onClick={handleSaveBanner} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl rounded-xl shadow-md hover:-translate-y-0.5 transition-all font-sans">Save Changes</button>
                    </div>
                </div>
            </Modal>

            {/* Title Modal */}
            <Modal isOpen={activeModal === 'title'} onClose={() => setActiveModal(null)} title="Edit Event Details">
                <form onSubmit={handleSaveTitle} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Title</label>
                        <input name="name" defaultValue={event.name} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm font-sans" placeholder="Input event title" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subtitle</label>
                        <textarea name="subtitle" rows={3} defaultValue={event.subtitle} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all shadow-sm font-sans" placeholder="Input subtitle" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 rounded-xl transition-colors font-sans">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl rounded-xl shadow-md hover:-translate-y-0.5 transition-all font-sans">Save</button>
                    </div>
                </form>
            </Modal>

            {/* Date/Location Modal */}
            <Modal isOpen={activeModal === 'dateLocation'} onClose={() => setActiveModal(null)} title="Edit Date & Location" size="lg">
                <form onSubmit={handleSaveDateLocation} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                            <input type="date" name="date" defaultValue={event.date} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                            <input type="time" name="startTime" defaultValue={event.startTime} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                            <input type="time" name="endTime" defaultValue={event.endTime} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3.5 top-3 text-gray-400" size={18} />
                            <input name="location" defaultValue={event.location} className="w-full pl-10 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="Enter venue or address" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors font-sans">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl rounded-xl shadow-md hover:-translate-y-0.5 transition-all font-sans">Save</button>
                    </div>
                </form>
            </Modal>

            {/* Overview Modal */}
            <Modal isOpen={activeModal === 'overview'} onClose={() => setActiveModal(null)} title="Edit Overview" size="lg">
                <form onSubmit={handleSaveOverview} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Description</label>
                        <textarea name="description" rows={5} defaultValue={event.description} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all shadow-sm" placeholder="What is this event about?" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                        <input name="theme" defaultValue={event.theme} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="e.g. Technology & Innovation" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Objectives</label>
                        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-5 space-y-3 border border-gray-100 dark:border-gray-700">
                            {event.objectives.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No objectives added yet.</p>
                            )}
                            <ul className="space-y-2">
                                {event.objectives.map((obj, i) => (
                                    <li key={i} className="flex items-center justify-between group bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:border-indigo-200">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{obj}</span>
                                        <button type="button" onClick={() => handleRemoveObjective(i)} className="text-gray-400 hover:text-red-500 transition-colors px-1">
                                            <X size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {/* Add Objective Input */}
                            <div className="flex items-center gap-2 mt-2">
                                {isAddingObjective ? (
                                    <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                        <input
                                            ref={objectiveInputRef}
                                            value={newObjective}
                                            onChange={(e) => setNewObjective(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                                            placeholder="Type a new objective..."
                                            className="flex-1 px-4 py-2 text-sm rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 shadow-sm"
                                        />
                                        <button type="button" onClick={handleAddObjective} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                                            <Plus size={16} />
                                        </button>
                                        <button type="button" onClick={() => setIsAddingObjective(false)} className="text-gray-400 p-2 hover:text-gray-600">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setIsAddingObjective(true)} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                                        <Plus size={16} /> Add Objective
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl rounded-xl shadow-md hover:-translate-y-0.5 transition-all font-sans">Save Changes</button>
                    </div>
                </form>
            </Modal>

            {/* Agenda Modal */}
            <Modal isOpen={activeModal === 'agenda'} onClose={() => setActiveModal(null)} title="Add Agenda Item" size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleAddAgendaSlot(); }} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title <span className="text-red-500">*</span></label>
                        <input
                            required
                            value={newAgenda.title || ''}
                            onChange={e => setNewAgenda({ ...newAgenda, title: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            placeholder="e.g. Opening Keynote"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Speaker <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Users className="absolute left-3.5 top-3 text-gray-400" size={18} />
                            <input
                                required
                                value={newAgenda.speaker || ''}
                                onChange={e => setNewAgenda({ ...newAgenda, speaker: e.target.value })}
                                className="w-full pl-10 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                placeholder="Name"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="time"
                                value={newAgenda.startTime || ''}
                                onChange={e => setNewAgenda({ ...newAgenda, startTime: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="time"
                                value={newAgenda.endTime || ''}
                                onChange={e => setNewAgenda({ ...newAgenda, endTime: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <textarea
                            rows={3}
                            value={newAgenda.description || ''}
                            onChange={e => setNewAgenda({ ...newAgenda, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all shadow-sm"
                            placeholder="Brief description of the activity"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 rounded-xl transition-colors font-sans">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl rounded-xl shadow-md hover:-translate-y-0.5 transition-all font-sans">{editingAgendaId ? "Save Changes" : "Add Item"}</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Banner Confirmation Modal */}
            <Modal isOpen={activeModal === 'deleteBanner'} onClose={() => setActiveModal(null)} title="Remove Banner?" size="sm">
                <div className="text-center space-y-6 py-2">
                    <div className="relative w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500 ring-8 ring-red-50/50 dark:ring-red-900/10">
                        <Trash2 size={32} className="drop-shadow-sm" />
                    </div>
                    <div>
                        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed px-4">
                            Are you sure you want to remove the event banner?<br />This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex justify-center gap-3 pt-2">
                        <button
                            onClick={() => setActiveModal(null)}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors font-sans"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteBanner}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all font-sans"
                        >
                            Yes, Remove It
                        </button>
                    </div>
                </div>
            </Modal>

        </div >
    );
}
