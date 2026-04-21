"use client";

import React, { useEffect, useState } from 'react';
import {
    Presentation, Users, Calendar, Clock, MapPin, Video, Plus, Search,
    Edit2, Trash2, X, ChevronDown, List, BarChart3,
    CheckCircle, AlertCircle, PlayCircle, XCircle, User
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import TablePaginationControls from '@/components/admin/TablePaginationControls';

// Types
import { EventSummary } from '@/lib/types';

interface Speaker {
    name: string;
    imageUrl?: string;
}

interface BreakoutSession {
    id: string;
    title: string;
    type: 'Online' | 'In-Person';
    status: 'Not Started' | 'Ongoing' | 'Completed' | 'Cancelled';
    date: string;
    time: string;
    location?: string;
    joinLink?: string;
    currentAttendees: number;
    maxCapacity: number;
    speakers: Speaker[];
}

// Mock data
const mockSessions: BreakoutSession[] = [
    {
        id: '1',
        title: 'Modern Web Development',
        type: 'Online',
        status: 'Ongoing',
        date: 'June 25, 2025',
        time: '2:00 PM – 3:30 PM',
        joinLink: 'https://meet.example.com/abc',
        currentAttendees: 32,
        maxCapacity: 50,
        speakers: [{ name: 'Carlos Diaz', imageUrl: '' }],
    },
    {
        id: '2',
        title: 'AI in Product Design',
        type: 'In-Person',
        status: 'Not Started',
        date: 'June 28, 2025',
        time: '10:00 AM – 11:30 AM',
        location: 'Room A, Main Hall',
        currentAttendees: 18,
        maxCapacity: 30,
        speakers: [{ name: 'Elena Santos' }],
    },
    {
        id: '3',
        title: 'Remote Team Collaboration',
        type: 'Online',
        status: 'Ongoing',
        date: 'June 26, 2025',
        time: '4:00 PM – 5:30 PM',
        joinLink: 'https://meet.example.com/xyz',
        currentAttendees: 60,
        maxCapacity: 60,
        speakers: [{ name: 'Henry Tan' }, { name: 'Iris Reyes' }],
    },
    {
        id: '4',
        title: 'Design Thinking Workshop',
        type: 'In-Person',
        status: 'Not Started',
        date: 'June 29, 2025',
        time: '1:00 PM – 2:30 PM',
        location: 'Room B, Conference Center',
        currentAttendees: 29,
        maxCapacity: 30,
        speakers: [{ name: 'Jake Santos' }],
    },
    {
        id: '5',
        title: 'Intro to TypeScript',
        type: 'Online',
        status: 'Not Started',
        date: 'July 1, 2025',
        time: '9:00 AM – 10:00 AM',
        joinLink: 'https://meet.example.com/ts',
        currentAttendees: 5,
        maxCapacity: 40,
        speakers: [{ name: 'Sarah Lee' }],
    },
    {
        id: '6',
        title: 'Cloud Security Essentials',
        type: 'Online',
        status: 'Completed',
        date: 'June 20, 2025',
        time: '11:00 AM – 12:30 PM',
        joinLink: 'Session Ended',
        currentAttendees: 45,
        maxCapacity: 50,
        speakers: [{ name: 'Nathan Brown' }],
    },
    {
        id: '7',
        title: 'Future of IoT',
        type: 'In-Person',
        status: 'Cancelled',
        date: 'June 30, 2025',
        time: '2:00 PM – 3:00 PM',
        location: 'Room D, Expo Center',
        currentAttendees: 0,
        maxCapacity: 40,
        speakers: [{ name: 'Oliver Wang' }],
    },
];

// Helper Components
const TypeBadge = ({ type }: { type: 'Online' | 'In-Person' }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${type === 'Online'
        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        }`}>
        {type === 'Online' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        {type}
    </span>
);

const StatusBadge = ({ status }: { status: BreakoutSession['status'] }) => {
    const styles = {
        'Not Started': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        'Ongoing': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        'Completed': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
        'Cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
            {status}
        </span>
    );
};

const SpeakerAvatar = ({ speaker, size = 'sm' }: { speaker: Speaker; size?: 'sm' | 'md' }) => {
    const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
    const initials = speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2);

    return speaker.imageUrl ? (
        <img src={speaker.imageUrl} alt={speaker.name} className={`${sizeClass} rounded-full object-cover`} />
    ) : (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] text-white flex items-center justify-center font-medium`}>
            {initials}
        </div>
    );
};

// Session Modal Component
const SessionModal = ({
    isOpen,
    onClose,
    session,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    session?: BreakoutSession | null;
    onSave: (session: BreakoutSession) => void;
}) => {
    const isEdit = !!session;
    const [formData, setFormData] = useState<Partial<BreakoutSession>>(session || {
        title: '',
        type: 'In-Person',
        status: 'Not Started',
        date: '',
        time: '',
        joinLink: '',
        location: '',
        currentAttendees: 0,
        maxCapacity: undefined,
        speakers: [],
    });
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [newSpeakerName, setNewSpeakerName] = useState('');
    const [newSpeakerImage, setNewSpeakerImage] = useState('');

    React.useEffect(() => {
        if (session) {
            setFormData(session);
        } else {
            setFormData({
                title: '',
                type: 'In-Person',
                status: 'Not Started',
                date: '',
                time: '',
                joinLink: '',
                location: '',
                currentAttendees: 0,
                maxCapacity: undefined,
                speakers: [],
            });
        }
        setValidationErrors({});
    }, [session, isOpen]);

    const handleAddSpeaker = () => {
        if (newSpeakerName.trim()) {
            setFormData({
                ...formData,
                speakers: [...(formData.speakers || []), { name: newSpeakerName, imageUrl: newSpeakerImage || undefined }],
            });
            setNewSpeakerName('');
            setNewSpeakerImage('');
        }
    };

    const handleRemoveSpeaker = (index: number) => {
        setFormData({
            ...formData,
            speakers: (formData.speakers || []).filter((_, i) => i !== index),
        });
    };

    const handleSave = () => {
        const nextErrors: Record<string, string> = {};
        const title = String(formData.title || '').trim();
        const date = String(formData.date || '').trim();
        const time = String(formData.time || '').trim();
        const maxCapacity = Number(formData.maxCapacity);
        const locationOrJoinLink = formData.type === 'Online'
            ? String(formData.joinLink || '').trim()
            : String(formData.location || '').trim();

        if (!title) {
            nextErrors.title = 'Title is required.';
        }
        if (!date) {
            nextErrors.date = 'Date is required.';
        }
        if (!time) {
            nextErrors.time = 'Time is required.';
        }
        if (!locationOrJoinLink) {
            nextErrors.locationOrJoinLink = formData.type === 'Online'
                ? 'Join link is required for online sessions.'
                : 'Location is required for in-person sessions.';
        }
        if (!Number.isFinite(maxCapacity) || maxCapacity <= 0) {
            nextErrors.maxCapacity = 'Maximum capacity must be greater than 0.';
        }

        if (Object.keys(nextErrors).length > 0) {
            setValidationErrors(nextErrors);
            return;
        }

        setValidationErrors({});
        onSave({
            id: session?.id || Date.now().toString(),
            title,
            type: formData.type || 'In-Person',
            status: formData.status || 'Not Started',
            date,
            time,
            joinLink: formData.joinLink,
            location: formData.location,
            currentAttendees: formData.currentAttendees || 0,
            maxCapacity,
            speakers: formData.speakers || [],
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Session' : 'Create New Session'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Session Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[#3D518C] dark:text-[#ABD2FA]">
                            <Calendar size={18} />
                            <h3 className="font-semibold">Session Information</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                            {isEdit ? 'Update information about the breakout session.' : 'Basic information about the breakout session.'}
                        </p>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => {
                                    setFormData({ ...formData, title: e.target.value });
                                    if (validationErrors.title) {
                                        setValidationErrors((prev) => ({ ...prev, title: '' }));
                                    }
                                }}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                placeholder="Enter session title"
                            />
                            {validationErrors.title && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.title}</p>
                            )}
                        </div>

                        {/* Type & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Online' | 'In-Person' })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                >
                                    <option value="Online">Online</option>
                                    <option value="In-Person">In-Person</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as BreakoutSession['status'] })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                >
                                    <option value="Not Started">Not Started</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => {
                                        setFormData({ ...formData, date: e.target.value });
                                        if (validationErrors.date) {
                                            setValidationErrors((prev) => ({ ...prev, date: '' }));
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                />
                                {validationErrors.date && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.date}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                <input
                                    type="text"
                                    value={formData.time}
                                    onChange={(e) => {
                                        setFormData({ ...formData, time: e.target.value });
                                        if (validationErrors.time) {
                                            setValidationErrors((prev) => ({ ...prev, time: '' }));
                                        }
                                    }}
                                    placeholder="e.g. 2:00 PM – 3:30 PM"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                />
                                {validationErrors.time && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.time}</p>
                                )}
                            </div>
                        </div>

                        {/* Join Link / Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {formData.type === 'Online' ? 'Join Link' : 'Location'}
                            </label>
                            <input
                                type="text"
                                value={formData.type === 'Online' ? formData.joinLink : formData.location}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        [formData.type === 'Online' ? 'joinLink' : 'location']: e.target.value
                                    });
                                    if (validationErrors.locationOrJoinLink) {
                                        setValidationErrors((prev) => ({ ...prev, locationOrJoinLink: '' }));
                                    }
                                }}
                                placeholder={formData.type === 'Online' ? 'https://meet.example.com/session' : 'Room A, Main Hall'}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                            />
                            {validationErrors.locationOrJoinLink && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.locationOrJoinLink}</p>
                            )}
                        </div>

                        {/* Capacity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Attendees</label>
                                <input
                                    type="number"
                                    value={formData.currentAttendees}
                                    onChange={(e) => setFormData({ ...formData, currentAttendees: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maximum Capacity</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={formData.maxCapacity ?? ''}
                                    onChange={(e) => {
                                        const nextValue = e.target.value.trim();
                                        setFormData({
                                            ...formData,
                                            maxCapacity: nextValue === '' ? undefined : Number(nextValue),
                                        });
                                        if (validationErrors.maxCapacity) {
                                            setValidationErrors((prev) => ({ ...prev, maxCapacity: '' }));
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                />
                                {validationErrors.maxCapacity && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.maxCapacity}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Speakers Section */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex items-center gap-2 text-[#3D518C] dark:text-[#ABD2FA]">
                            <Users size={18} />
                            <h3 className="font-semibold">Speakers</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                            {isEdit ? 'Manage speakers for this session.' : 'Add speakers for this session.'}
                        </p>

                        {/* Add Speaker Form */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSpeakerName}
                                onChange={(e) => setNewSpeakerName(e.target.value)}
                                placeholder="Speaker Name"
                                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                            />
                            <input
                                type="text"
                                value={newSpeakerImage}
                                onChange={(e) => setNewSpeakerImage(e.target.value)}
                                placeholder="Image URL (Optional)"
                                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                            />
                            <button
                                onClick={handleAddSpeaker}
                                className="px-4 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all flex items-center gap-1"
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>

                        {/* Current Speakers */}
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Current Speakers</p>
                            {(formData.speakers?.length || 0) === 0 ? (
                                <div className="flex items-center justify-center gap-2 py-6 text-gray-400 dark:text-gray-500">
                                    <User size={16} />
                                    <span className="text-sm">No speakers added yet</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {formData.speakers?.map((speaker, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <SpeakerAvatar speaker={speaker} size="md" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{speaker.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveSpeaker(index)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all"
                    >
                        {isEdit ? 'Save Changes' : 'Create Session'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface BreakoutsClientProps {
    event: EventSummary;
}

// Main Page Component
export default function ManageBreakoutsPage({ event }: BreakoutsClientProps) {
    const { t } = useLocale();
    const eventId = event.id;

    // Add validation for eventId
    if (!eventId || eventId === 'undefined') {
        console.error('Invalid eventId in breakouts page:', eventId);
        return (
            <div className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Event</h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('Unable to load breakout sessions. Event ID is invalid.')}</p>
                </div>
            </div>
        );
    }

    const [sessions, setSessions] = useState<BreakoutSession[]>(eventId.startsWith('evt-') ? mockSessions : []);
    const [activeView, setActiveView] = useState<'dashboard' | 'list'>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Online' | 'In-Person'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | BreakoutSession['status']>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<BreakoutSession | null>(null);
    const [isLoading, setIsLoading] = useState(!eventId.startsWith('evt-'));
    const [error, setError] = useState<string | null>(null);
    const [upcomingPage, setUpcomingPage] = useState(1);
    const [upcomingRowsPerPage, setUpcomingRowsPerPage] = useState(5);
    const [listPage, setListPage] = useState(1);
    const [listRowsPerPage, setListRowsPerPage] = useState(10);

    // Load sessions from backend for real events
    useEffect(() => {
        if (eventId.startsWith('evt-')) {
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();

        const loadSessions = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await fetch(`/api/events/${eventId}/breakouts`, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    throw new Error(`Failed to load breakout sessions (${res.status})`);
                }
                const json = await res.json();
                if (json?.success && Array.isArray(json.data)) {
                    setSessions(json.data);
                } else {
                    throw new Error(json?.error || 'Unexpected response format');
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                console.error('Error loading breakout sessions:', e);
                setError(e instanceof Error ? e.message : 'Failed to load breakout sessions');
            } finally {
                setIsLoading(false);
            }
        };

        loadSessions();

        return () => controller.abort();
    }, [eventId]);

    // Use passed event data for sidebar
    const sidebarEvent = event;

    // Filtered sessions
    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.speakers.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = typeFilter === 'All' || session.type === typeFilter;
        const matchesStatus = statusFilter === 'All' || session.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const upcomingSessions = sessions.filter(s => s.status === 'Not Started');

    const paginatedUpcomingSessions = upcomingSessions.slice(
        (upcomingPage - 1) * upcomingRowsPerPage,
        upcomingPage * upcomingRowsPerPage
    );

    const paginatedFilteredSessions = filteredSessions.slice(
        (listPage - 1) * listRowsPerPage,
        listPage * listRowsPerPage
    );

    useEffect(() => {
        setListPage(1);
    }, [searchQuery, typeFilter, statusFilter]);

    useEffect(() => {
        const totalUpcomingPages = Math.max(1, Math.ceil(upcomingSessions.length / upcomingRowsPerPage));
        if (upcomingPage > totalUpcomingPages) {
            setUpcomingPage(totalUpcomingPages);
        }
    }, [upcomingPage, upcomingRowsPerPage, upcomingSessions.length]);

    useEffect(() => {
        const totalListPages = Math.max(1, Math.ceil(filteredSessions.length / listRowsPerPage));
        if (listPage > totalListPages) {
            setListPage(totalListPages);
        }
    }, [filteredSessions.length, listPage, listRowsPerPage]);

    // Stats
    const stats = {
        total: sessions.length,
        totalAttendees: sessions.reduce((sum, s) => sum + s.currentAttendees, 0),
        totalCapacity: sessions.reduce((sum, s) => sum + s.maxCapacity, 0),
        ongoing: sessions.filter(s => s.status === 'Ongoing').length,
        upcoming: sessions.filter(s => s.status === 'Not Started').length,
        online: sessions.filter(s => s.type === 'Online').length,
        inPerson: sessions.filter(s => s.type === 'In-Person').length,
        completed: sessions.filter(s => s.status === 'Completed').length,
        cancelled: sessions.filter(s => s.status === 'Cancelled').length,
    };

    const handleSaveSession = async (session: BreakoutSession) => {
        // Local draft events: keep purely in-memory
        if (eventId.startsWith('evt-')) {
            if (editingSession) {
                setSessions(prev => prev.map(s => (s.id === session.id ? session : s)));
            } else {
                setSessions(prev => [...prev, session]);
            }
            setEditingSession(null);
            return;
        }

        try {
            const isEdit = !!editingSession;
            const endpoint = isEdit
                ? `/api/events/${eventId}/breakouts/${session.id}`
                : `/api/events/${eventId}/breakouts`;
            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session: {
                        id: session.id,
                        title: session.title,
                        type: session.type,
                        status: session.status,
                        date: session.date,
                        time: session.time,
                        location: session.location,
                        joinLink: session.joinLink,
                        maxCapacity: session.maxCapacity,
                        speakers: session.speakers,
                    },
                }),
            });

            if (!res.ok) {
                throw new Error(`Failed to save session (${res.status})`);
            }

            const json = await res.json();
            if (!json?.success || !json.data) {
                throw new Error(json?.error || 'Unexpected response format');
            }

            const saved: BreakoutSession = json.data;
            setSessions(prev =>
                isEdit
                    ? prev.map(s => (s.id === saved.id ? saved : s))
                    : [...prev, saved]
            );
            setEditingSession(null);
        } catch (e) {
            console.error('Error saving breakout session:', e);
            setError(e instanceof Error ? e.message : 'Failed to save breakout session');
        }
    };

    const handleDeleteSession = async (id: string) => {
        // Local draft events: in-memory delete only
        if (eventId.startsWith('evt-')) {
            setSessions(prev => prev.filter(s => s.id !== id));
            return;
        }

        try {
            const res = await fetch(`/api/events/${eventId}/breakouts/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                throw new Error(`Failed to delete session (${res.status})`);
            }
            setSessions(prev => prev.filter(s => s.id !== id));
        } catch (e) {
            console.error('Error deleting breakout session:', e);
            setError(e instanceof Error ? e.message : 'Failed to delete breakout session');
        }
    };

    const openCreateModal = () => {
        setEditingSession(null);
        setIsModalOpen(true);
    };

    const openEditModal = (session: BreakoutSession) => {
        setEditingSession(session);
        setIsModalOpen(true);
    };

    return (
        <>
            {/* Session Modal */}
            <SessionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingSession(null); }}
                session={editingSession}
                onSave={handleSaveSession}
            />

            {/* Main Content Area */}
            <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
                <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                                <Presentation className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {t('Manage Breakout Sessions')}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {t('Create and manage breakout sessions for your event')}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="w-full sm:w-auto min-h-[48px] shrink-0 px-5 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 touch-manipulation"
                        >
                            <Plus size={18} />
                            {t('Add Session')}
                        </button>
                    </div>

                    {/* Error state */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {/* View Tabs */}
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-full overflow-x-auto sm:w-fit touch-manipulation">
                        <button
                            onClick={() => setActiveView('dashboard')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'dashboard'
                                ? 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <BarChart3 size={16} />
                            {t('Dashboard')}
                        </button>
                        <button
                            onClick={() => setActiveView('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'list'
                                ? 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <List size={16} />
                            {t('List')}
                        </button>
                    </div>

                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Total Sessions')}</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Total Attendees')}</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAttendees} / {stats.totalCapacity}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                            <PlayCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Ongoing Sessions</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ongoing}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming Sessions</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcoming}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Session Breakdown */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Session Breakdown</h3>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    <div className="flex justify-between items-center px-5 py-3">
                                        <span className="text-sm text-emerald-600 dark:text-emerald-400">Online Sessions</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.online} ({Math.round(stats.online / stats.total * 100)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center px-5 py-3">
                                        <span className="text-sm text-blue-600 dark:text-blue-400">In-Person Sessions</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.inPerson} ({Math.round(stats.inPerson / stats.total * 100)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center px-5 py-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Ongoing Sessions</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.ongoing} ({Math.round(stats.ongoing / stats.total * 100)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center px-5 py-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Not Started Sessions</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.upcoming} ({Math.round(stats.upcoming / stats.total * 100)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center px-5 py-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Completed Sessions</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.completed} ({Math.round(stats.completed / stats.total * 100)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center px-5 py-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled Sessions</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.cancelled} ({Math.round(stats.cancelled / stats.total * 100)}%)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Sessions Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Sessions</h3>
                                    <button onClick={() => setActiveView('list')} className="text-sm text-[#3D518C] dark:text-[#ABD2FA] hover:underline">
                                        View all →
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                                <th className="px-5 py-3 text-left font-medium">Title</th>
                                                <th className="px-5 py-3 text-left font-medium">Type</th>
                                                <th className="px-5 py-3 text-left font-medium">Date</th>
                                                <th className="px-5 py-3 text-left font-medium">Time</th>
                                                <th className="px-5 py-3 text-left font-medium">Capacity</th>
                                                <th className="px-5 py-3 text-right font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {paginatedUpcomingSessions.map((session) => (
                                                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{session.title}</td>
                                                    <td className="px-5 py-4"><TypeBadge type={session.type} /></td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.date}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.time}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.currentAttendees} / {session.maxCapacity}</td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button onClick={() => openEditModal(session)} className="text-sm text-[#3D518C] dark:text-[#ABD2FA] hover:underline">Edit</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <TablePaginationControls
                                    totalItems={upcomingSessions.length}
                                    currentPage={upcomingPage}
                                    rowsPerPage={upcomingRowsPerPage}
                                    onPageChange={setUpcomingPage}
                                    onRowsPerPageChange={(rows) => {
                                        setUpcomingRowsPerPage(rows);
                                        setUpcomingPage(1);
                                    }}
                                    pageSizeOptions={[5, 10, 25, 50]}
                                />
                            </div>
                        </div>
                    )}

                    {/* List View */}
                    {activeView === 'list' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search sessions or speakers..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                    />
                                </div>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                                    className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                >
                                    <option value="All">Type: All</option>
                                    <option value="Online">Online</option>
                                    <option value="In-Person">In-Person</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                                    className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                >
                                    <option value="All">Status: All</option>
                                    <option value="Not Started">Not Started</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#ABD2FA] dark:bg-[#3D518C] text-gray-700 dark:text-white">
                                            <tr className="text-xs uppercase font-semibold tracking-wider">
                                                <th className="px-5 py-4 text-left">Title</th>
                                                <th className="px-5 py-4 text-left">Type</th>
                                                <th className="px-5 py-4 text-left">Status</th>
                                                <th className="px-5 py-4 text-left">Date</th>
                                                <th className="px-5 py-4 text-left">Capacity</th>
                                                <th className="px-5 py-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {paginatedFilteredSessions.map((session) => (
                                                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${session.status === 'Ongoing' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                                                session.status === 'Completed' ? 'bg-gray-100 dark:bg-gray-700' :
                                                                    session.status === 'Cancelled' ? 'bg-red-100 dark:bg-red-900/30' :
                                                                        'bg-amber-100 dark:bg-amber-900/30'
                                                                }`}>
                                                                {session.status === 'Ongoing' && <PlayCircle size={12} className="text-emerald-600" />}
                                                                {session.status === 'Completed' && <CheckCircle size={12} className="text-gray-600" />}
                                                                {session.status === 'Cancelled' && <XCircle size={12} className="text-red-600" />}
                                                                {session.status === 'Not Started' && <AlertCircle size={12} className="text-amber-600" />}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{session.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4"><TypeBadge type={session.type} /></td>
                                                    <td className="px-5 py-4"><StatusBadge status={session.status} /></td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.date}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.currentAttendees} / {session.maxCapacity}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditModal(session)}
                                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-[#3D518C] dark:text-[#ABD2FA]"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSession(session.id)}
                                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <TablePaginationControls
                                    totalItems={filteredSessions.length}
                                    currentPage={listPage}
                                    rowsPerPage={listRowsPerPage}
                                    onPageChange={setListPage}
                                    onRowsPerPageChange={(rows) => {
                                        setListRowsPerPage(rows);
                                        setListPage(1);
                                    }}
                                />

                                {filteredSessions.length === 0 && (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Presentation className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sessions found</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
