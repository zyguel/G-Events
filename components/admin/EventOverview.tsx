"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, MapPin, Upload, Plus, Clock, Trash2, X, Users, Pencil, Image as ImageIcon, Type, AlignLeft, List, Check, CheckCircle } from "lucide-react";
import Modal from "./Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DateTimeInput from "./DateTimeInput";
import TimeInput from "./TimeInput";
import DateInput from "./DateInput";

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
                <Check size={18} />
            </div>
            <span className="font-medium">{message}</span>
        </div>
    );
};

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

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Temporary state for date/time modal (using Date objects for DateTimeInput)
    const [tempEventDate, setTempEventDate] = useState<Date | null>(null);
    const [tempStartTime, setTempStartTime] = useState<string>('');
    const [tempEndTime, setTempEndTime] = useState<string>('');

    const [activeModal, setActiveModal] = useState<null | 'banner' | 'title' | 'dateLocation' | 'overview' | 'agenda' | 'deleteBanner'>(null);

    // Form States
    const [newAgenda, setNewAgenda] = useState<Partial<AgendaItem>>({});
    const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
    const [newObjective, setNewObjective] = useState("");
    const [isAddingObjective, setIsAddingObjective] = useState(false);

    const objectiveInputRef = useRef<HTMLInputElement>(null);

    // Banner Upload State
    const [tempBanner, setTempBanner] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ... useEffect ...

    // --- Actions ---

    // --- Persistence Helper ---
    const persistEvent = (updatedEvent: EventData) => {
        try {
            // 1. Save full detail
            localStorage.setItem(`event_detail_${updatedEvent.id}`, JSON.stringify(updatedEvent));

            // 2. Update summary list
            const storedEvents: any[] = JSON.parse(localStorage.getItem('mock_created_events') || '[]');
            const updatedList = storedEvents.map(e => {
                if (String(e.id) === String(updatedEvent.id)) {
                    return {
                        ...e,
                        name: updatedEvent.name,
                        location: updatedEvent.location,
                        date: updatedEvent.date,
                        status: updatedEvent.status,
                        image: updatedEvent.bannerUrl // Map banner to image for list view
                    };
                }
                return e;
            });
            localStorage.setItem('mock_created_events', JSON.stringify(updatedList));
        } catch (e: any) {
            console.error("Error updating local storage", e);
            if (e.name === 'QuotaExceededError') {
                setToast({ message: 'Storage full! Image might be too large.', type: 'error' });
            }
        }
    };

    // --- Actions ---

    const handleSaveTitle = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const updatedEvent = {
            ...event,
            name: formData.get('name') as string,
            subtitle: formData.get('subtitle') as string
        };
        setEvent(updatedEvent);
        persistEvent(updatedEvent);
        setActiveModal(null);
        setToast({ message: 'Event details updated successfully!', type: 'success' });
    };

    // Initialize date/time modal values when it opens
    useEffect(() => {
        if (activeModal === 'dateLocation') {
            // Parse the event date into a Date object
            let eventDate = null;
            if (event.date) {
                const parsed = new Date(event.date);
                if (!isNaN(parsed.getTime())) {
                    eventDate = parsed;
                }
            }
            setTempEventDate(eventDate);
            setTempStartTime(event.startTime || '');
            setTempEndTime(event.endTime || '');
        }
    }, [activeModal, event.date, event.startTime, event.endTime]);


    const handleSaveDateLocation = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        // Format date from Date object to YYYY-MM-DD
        const formattedDate = tempEventDate ? tempEventDate.toISOString().split('T')[0] : event.date;

        const updatedEvent = {
            ...event,
            date: formattedDate,
            startTime: tempStartTime,
            endTime: tempEndTime,
            location: formData.get('location') as string
        };
        setEvent(updatedEvent);
        persistEvent(updatedEvent);
        setActiveModal(null);
        setToast({ message: 'Date and location updated successfully!', type: 'success' });
    };

    const handleSaveOverview = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const updatedEvent = {
            ...event,
            description: formData.get('description') as string,
            theme: formData.get('theme') as string,
        };
        setEvent(updatedEvent);
        persistEvent(updatedEvent);
        setActiveModal(null);
        setToast({ message: 'Overview updated successfully!', type: 'success' });
    };

    const handleAddObjective = () => {
        if (newObjective.trim()) {
            const updatedEvent = {
                ...event,
                objectives: [...event.objectives, newObjective.trim()]
            };
            setEvent(updatedEvent);
            persistEvent(updatedEvent);
            setNewObjective("");
            setIsAddingObjective(false);
        }
    };

    const handleRemoveObjective = (index: number) => {
        const updatedEvent = {
            ...event,
            objectives: event.objectives.filter((_, i) => i !== index)
        };
        setEvent(updatedEvent);
        persistEvent(updatedEvent);
    };

    const handleAddAgendaSlot = () => {
        if (!newAgenda.title || !newAgenda.speaker || !newAgenda.startTime || !newAgenda.endTime) return;

        let updatedEvent: EventData;

        if (editingAgendaId) {
            // Update existing item
            updatedEvent = {
                ...event,
                agenda: event.agenda.map(item =>
                    item.id === editingAgendaId
                        ? { ...item, ...newAgenda } as AgendaItem
                        : item
                )
            };
            setToast({ message: 'Agenda item updated successfully!', type: 'success' });
        } else {
            // Add new item
            const newItem: AgendaItem = {
                id: Date.now().toString(), // Simple unique ID
                title: newAgenda.title || '',
                speaker: newAgenda.speaker || '',
                startTime: newAgenda.startTime || '',
                endTime: newAgenda.endTime || '',
                description: newAgenda.description || ''
            };

            updatedEvent = {
                ...event,
                agenda: [...(event.agenda || []), newItem]
            };
            setToast({ message: 'Agenda item added successfully!', type: 'success' });
        }
        setEvent(updatedEvent);
        persistEvent(updatedEvent);
        setNewAgenda({});
        setEditingAgendaId(null);
        setActiveModal(null);
    };

    const handleEditAgendaItem = (item: AgendaItem) => {
        setNewAgenda(item);
        setEditingAgendaId(item.id);
        setActiveModal('agenda');
    };

    const handleDeleteBanner = () => {
        setActiveModal('deleteBanner');
    };

    const confirmDeleteBanner = () => {
        const updatedEvent = { ...event, bannerUrl: undefined };
        setEvent(updatedEvent);
        persistEvent(updatedEvent);
        setActiveModal(null);
        setToast({ message: 'Banner removed successfully', type: 'info' });
    };

    // Helper to compress image
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    const width = (scaleSize < 1) ? MAX_WIDTH : img.width;
                    const height = (scaleSize < 1) ? img.height * scaleSize : img.height;

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // Banner Upload Handlers
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            setToast({ message: 'File too large (max 20MB)', type: 'error' });
            return;
        }

        if (!file.type.startsWith('image/')) {
            setToast({ message: 'Please upload an image file', type: 'error' });
            return;
        }

        try {
            const compressedDataUrl = await compressImage(file);
            setTempBanner(compressedDataUrl);
        } catch (error) {
            console.error("Error compressing image", error);
            setToast({ message: 'Error processing image', type: 'error' });
        }
    };

    const handleSaveBanner = () => {
        if (tempBanner) {
            const updatedEvent = { ...event, bannerUrl: tempBanner };
            setEvent(updatedEvent);
            persistEvent(updatedEvent);
            setTempBanner(null); // Clear temp state
            setActiveModal(null);
            setToast({ message: 'Banner updated successfully', type: 'success' });
        }
    };

    const handleCloseBannerModal = () => {
        setTempBanner(null);
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

    const router = useRouter();

    const handleCreateEvent = async () => {
        // Basic validation
        if (!event.name) {
            setToast({ message: 'Please enter an event title.', type: 'error' });
            return;
        }
        if (!event.date) {
            setToast({ message: 'Please select an event date.', type: 'error' });
            return;
        }

        // Mock API call
        setToast({ message: 'Creating event...', type: 'info' });

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Create new event object
        const newEventId = `evt-${Date.now()}`;
        const newEventSummary = {
            id: newEventId,
            name: event.name,
            location: event.location || 'TBD',
            date: event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD',
            ticketsSold: 0,
            totalTickets: 100, // Default
            attendees: 0,
            status: 'Draft',
            type: 'draft',
            analyticsId: newEventId,
            image: event.bannerUrl
        };

        // Save to localStorage
        try {
            const existingEvents = JSON.parse(localStorage.getItem('mock_created_events') || '[]');
            localStorage.setItem('mock_created_events', JSON.stringify([newEventSummary, ...existingEvents]));

            // Also save the full event detail
            localStorage.setItem(`event_detail_${newEventId}`, JSON.stringify({
                ...event,
                id: newEventId,
                status: 'Draft',
                // Ensure default empty arrays if undefined
                objectives: event.objectives || [],
                agenda: event.agenda || []
            }));

        } catch (e) {
            console.error('Failed to save event', e);
        }

        setToast({ message: 'Event created successfully!', type: 'success' });

        // Redirect to events list after short delay
        setTimeout(() => {
            router.push('/events');
        }, 1000);
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8 pb-20 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-gray-100">
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
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {(() => {
                        const getStatusConfig = (status: string) => {
                            const normalized = status?.toLowerCase() || '';
                            if (normalized === 'draft') {
                                return {
                                    bg: 'from-gray-400 to-gray-500',
                                    icon: CheckCircle
                                };
                            }
                            if (normalized === 'completed') {
                                return {
                                    bg: 'from-emerald-500 to-green-600',
                                    icon: CheckCircle
                                };
                            }
                            // Default to Blue for "Upcoming" / "Published" / "Not Yet Published" / "Ongoing"
                            return {
                                bg: 'from-[#3D518C] to-[#5C6BC0]',
                                icon: CheckCircle
                            };
                        };

                        const config = getStatusConfig(event.status);
                        const StatusIcon = config.icon;

                        return (
                            <div className={`w-14 h-14 bg-gradient-to-br ${config.bg} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300`}>
                                <StatusIcon className="w-7 h-7 text-white" />
                            </div>
                        );
                    })()}

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {event.id === 'new' ? 'Create New Event' : 'Event Overview'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Manage your event details, schedule, and content
                        </p>
                    </div>
                </div>

                {event.id === 'new' && (
                    <button
                        onClick={handleCreateEvent}
                        className="px-6 py-2.5 bg-[#3D518C] text-white rounded-xl text-sm font-semibold hover:bg-[#2d3d6b] transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <Check size={18} />
                        Save Event
                    </button>
                )}
            </div>

            {/* 1. Banner */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md group/card">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Event Banner
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                The main visual representation of your event
                            </p>
                        </div>
                    </div>
                    {event.bannerUrl && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeleteBanner}
                                className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg text-red-500 hover:text-red-700 shadow-sm hover:scale-105 transition-all"
                                title="Delete Banner"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={() => setActiveModal('banner')}
                                className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-sm hover:scale-105 transition-all"
                                title="Change Banner"
                            >
                                <Pencil size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <div className="relative w-full aspect-[21/9] bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner group">
                        {event.bannerUrl ? (
                            <div className="absolute inset-0">
                                <Image
                                    src={event.bannerUrl!}
                                    alt="Event Banner"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div
                                    onClick={() => setActiveModal('banner')}
                                    className="w-64 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col items-center gap-3 cursor-pointer hover:shadow-md hover:scale-105 transition-all border border-dashed border-gray-300 dark:border-gray-600"
                                >
                                    <Upload className="text-indigo-600 dark:text-indigo-400" size={24} />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center leading-tight">
                                        Upload event banner image
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 2. Title & Details */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md relative">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Type className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Event Details
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                Basic information about your event
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveModal('title')}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50"
                    >
                        <Pencil size={20} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="space-y-2">
                        {event.name && (
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 font-sans">
                                Event Title
                            </span>
                        )}
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                            {event.name || <span className="opacity-50">Event Title</span>}
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium italic">
                            {event.subtitle}
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Date & Location */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Date & Location
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                When and where the event will take place
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveModal('dateLocation')}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50"
                    >
                        <Pencil size={20} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700 align-top">
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="text-[#3D518C]" size={18} /> Time & Date
                            </h2>
                            <div className="flex flex-col pl-7">
                                {event.date ? (
                                    <span className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{formatDateDisplay(event.date)}</span>
                                ) : (
                                    <span className="text-xl font-medium text-gray-400 italic">Date TBD</span>
                                )}
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                                    {formatTimeDisplay(event.startTime || "")} - {formatTimeDisplay(event.endTime || "")} PST
                                </span>
                            </div>
                        </div>
                        <div className="md:pl-8 pt-6 md:pt-0 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin className="text-[#3D518C]" size={18} /> Venue
                            </h2>
                            <div className="text-lg text-gray-700 dark:text-gray-300 font-medium pl-7">
                                {event.location || <span className="text-gray-400 italic">No location set</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Overview */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center">
                            <AlignLeft className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Overview
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                Detailed description and objectives
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveModal('overview')}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50"
                    >
                        <Pencil size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {event.description ? (
                        <div className="space-y-6">
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-base">
                                    {event.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                {event.theme && (
                                    <div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Theme</span>
                                        <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
                                            {event.theme}
                                        </span>
                                    </div>
                                )}

                                {event.objectives && event.objectives.length > 0 && (
                                    <div className="flex-1 min-w-[200px]">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Key Objectives</span>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {event.objectives.map((obj, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                                                    {obj}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400 italic">No overview added yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 5. Agenda */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                            <List className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Agenda
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                Schedule of activities
                            </p>
                        </div>
                    </div>
                    {event.agenda.length > 0 && (
                        <button
                            onClick={() => {
                                setNewAgenda({});
                                setEditingAgendaId(null);
                                setActiveModal('agenda');
                            }}
                            className="text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-md px-4 py-2 rounded-lg transition-all transform hover:-translate-y-0.5 font-sans"
                        >
                            + Add Item
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {event.agenda.length > 0 ? (
                        <div className="space-y-3">
                            {[...event.agenda]
                                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                                .map((slot, i) => (
                                    <div key={i} className="flex gap-4 py-4 px-6 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md bg-white dark:bg-gray-800/50 group/item shadow-sm">
                                        <div className="min-w-[120px] pt-1">
                                            <div className="text-sm font-bold text-[#3D518C] dark:text-indigo-400 whitespace-nowrap bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg inline-block">
                                                {formatTimeDisplay(slot.startTime)}
                                            </div>
                                            {slot.endTime && (
                                                <div className="text-xs text-gray-400 mt-1 pl-1">
                                                    to {formatTimeDisplay(slot.endTime)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{slot.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    {slot.speaker && (
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md uppercase tracking-wide">
                                                            <Users size={12} className="text-gray-400 dark:text-gray-500" />
                                                            <span className="truncate max-w-[150px]">{slot.speaker}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditAgendaItem(slot);
                                                            }}
                                                            className="text-gray-400 hover:text-indigo-500 transition-colors p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
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
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                                                            title="Remove Item"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {slot.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">{slot.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <List size={24} />
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-medium mb-1">No agenda items</h3>
                            <p className="text-gray-500 text-sm mb-4">Start building your event schedule</p>
                            <button
                                onClick={() => {
                                    setNewAgenda({});
                                    setEditingAgendaId(null);
                                    setActiveModal('agenda');
                                }}
                                className="text-sm font-semibold text-white bg-[#3D518C] hover:bg-[#2D4178] px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                            >
                                + Add First Item
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* --- MODALS --- */}

            {/* Banner Modal */}
            <Modal isOpen={activeModal === 'banner'} onClose={handleCloseBannerModal} title="Upload Banner" size="md">
                <div className="space-y-6">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    {tempBanner ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-700">
                            <Image
                                src={tempBanner}
                                alt="Banner Preview"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all"
                                >
                                    <Pencil size={20} />
                                </button>
                                <button
                                    onClick={() => setTempBanner(null)}
                                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative border-2 border-dashed border-gray-300 dark:border-gray-600 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-all duration-300 cursor-pointer hover:border-indigo-400"
                        >
                            <div className="w-14 h-14 bg-white dark:bg-gray-700 rounded-xl shadow-sm flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 border border-gray-100 dark:border-gray-600">
                                <Upload size={28} className="drop-shadow-sm" />
                            </div>
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Click to upload</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (max. 20MB)</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={handleCloseBannerModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors font-sans">Cancel</button>
                        <button
                            onClick={handleSaveBanner}
                            disabled={!tempBanner}
                            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all font-sans ${tempBanner
                                ? 'bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl hover:-translate-y-0.5'
                                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                }`}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Title Modal */}
            <Modal isOpen={activeModal === 'title'} onClose={() => setActiveModal(null)} title="Edit Event Details" size="md">
                <form onSubmit={handleSaveTitle} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Title</label>
                        <input name="name" defaultValue={event.name} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm font-sans" placeholder="Input event title" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subtitle</label>
                        <textarea name="subtitle" rows={3} defaultValue={event.subtitle} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all shadow-sm font-sans" placeholder="Input subtitle" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors font-sans">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl rounded-xl shadow-md hover:-translate-y-0.5 transition-all font-sans">Save</button>
                    </div>
                </form>
            </Modal>

            {/* Date/Location Modal */}
            <Modal isOpen={activeModal === 'dateLocation'} onClose={() => setActiveModal(null)} title="Edit Date & Location" size="lg">
                <form onSubmit={handleSaveDateLocation} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                            <DateInput
                                value={tempEventDate}
                                onChange={(date) => setTempEventDate(date)}
                                placeholder="Select event date"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                                <TimeInput
                                    value={tempStartTime}
                                    onChange={(time) => setTempStartTime(time)}
                                    placeholder="Select start time"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                                <TimeInput
                                    value={tempEndTime}
                                    onChange={(time) => setTempEndTime(time)}
                                    placeholder="Select end time"
                                />
                            </div>
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
            <Modal isOpen={activeModal === 'overview'} onClose={() => setActiveModal(null)} title="Edit Overview" size="md">
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
                <form onSubmit={(e) => { e.preventDefault(); handleAddAgendaSlot(); }} className="space-y-6">
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
                            <TimeInput
                                required
                                value={newAgenda.startTime || ''}
                                onChange={(time) => setNewAgenda({ ...newAgenda, startTime: time })}
                                placeholder="Select start time"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time <span className="text-red-500">*</span></label>
                            <TimeInput
                                required
                                value={newAgenda.endTime || ''}
                                onChange={(time) => setNewAgenda({ ...newAgenda, endTime: time })}
                                placeholder="Select end time"
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
                        <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors font-sans">Cancel</button>
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
