"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import EventsSidebar from '@/components/admin/EventsSidebar';
import { Mail, Filter, Send, Clock, Eye, Users, Check, X, Calendar, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';
import Modal from '@/components/admin/Modal';
import TimeInput from '@/components/admin/TimeInput';
import DateInput from '@/components/admin/DateInput';
import { EventSummary } from '@/lib/api';

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'from-emerald-500 to-green-600' : type === 'error' ? 'from-red-500 to-rose-600' : 'from-blue-500 to-indigo-600';
    const Icon = type === 'success' ? Check : type === 'error' ? X : Mail;

    return (
        <div className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up`}>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon size={18} />
            </div>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-lg p-1 transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};

// Email interface
interface SentEmail {
    id: string;
    subject: string;
    body: string;
    recipientCount: number;
    sentAt: Date;
    status: 'sent' | 'scheduled' | 'draft';
    scheduledFor?: Date;
}

// Checkbox component with modern styling
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

// Radio button component with modern styling
const RadioButton = ({ label, checked, onChange, icon: Icon }: { label: string; checked: boolean; onChange: () => void; icon?: React.ElementType }) => (
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
        {Icon && <Icon size={16} className={`${checked ? 'text-[#3D518C]' : 'text-gray-400'} transition-colors duration-200`} />}
        <span className={`text-sm transition-colors duration-200 ${checked ? 'text-[#3D518C] dark:text-[#7986CB] font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
    </div>
);



// Custom Time Picker Popup with 3 columns
const CustomTimePicker = ({ value, onChange, onClose }: { value: string; onChange: (value: string) => void; onClose: () => void }) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [isPM, setIsPM] = useState(false);

    // Initialize from value
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            setSelectedHour(h === 0 ? 12 : h > 12 ? h - 12 : h);
            setSelectedMinute(m);
            setIsPM(h >= 12);
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const updateTime = (newHour: number, newMinute: number, newIsPM: boolean) => {
        let h = newHour;
        if (newIsPM && h !== 12) h += 12;
        if (!newIsPM && h === 12) h = 0;
        onChange(`${h.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`);
    };

    // Reorder to 12, 01, 02... 11 is cleaner for list
    const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutesList = Array.from({ length: 60 }, (_, i) => i);

    const Column = ({ title, children }: { title?: string, children: React.ReactNode }) => (
        <div className="flex-1 h-64 overflow-y-auto scrollbar-hide snap-y snap-mandatory text-center">
            <div className="space-y-1 py-2">
                {children}
            </div>
        </div>
    );

    const Item = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
        <div
            onClick={onClick}
            className={`cursor-pointer py-1 text-sm font-medium transition-colors snap-center ${active
                ? 'bg-blue-400 text-white rounded-md mx-2'
                : 'text-gray-300 hover:text-white'
                }`}
        >
            {children}
        </div>
    );

    return (
        <div ref={pickerRef} className="absolute top-full left-0 mt-2 z-50 bg-[#2D2D2D] rounded-xl shadow-2xl border border-gray-700 p-2 w-64 animate-slide-up select-none">
            {/* Header (Selection) */}
            <div className="grid grid-cols-3 gap-2 mb-2 p-1 border-b border-gray-600 pb-2">
                <div className="bg-blue-400 text-white text-center py-1 rounded-md font-bold text-sm">
                    {selectedHour.toString().padStart(2, '0')}
                </div>
                <div className="bg-blue-400 text-white text-center py-1 rounded-md font-bold text-sm">
                    {selectedMinute.toString().padStart(2, '0')}
                </div>
                <div className="bg-blue-400 text-white text-center py-1 rounded-md font-bold text-sm">
                    {isPM ? 'PM' : 'AM'}
                </div>
            </div>

            <div className="flex text-gray-300">
                {/* Hours */}
                <Column>
                    {hoursList.map(h => (
                        <Item
                            key={h}
                            active={h === selectedHour}
                            onClick={() => {
                                setSelectedHour(h);
                                updateTime(h, selectedMinute, isPM);
                            }}
                        >
                            {h.toString().padStart(2, '0')}
                        </Item>
                    ))}
                </Column>

                {/* Minutes */}
                <Column>
                    {minutesList.map(m => (
                        <Item
                            key={m}
                            active={m === selectedMinute}
                            onClick={() => {
                                setSelectedMinute(m);
                                updateTime(selectedHour, m, isPM);
                            }}
                        >
                            {m.toString().padStart(2, '0')}
                        </Item>
                    ))}
                </Column>

                {/* Period */}
                <Column>
                    <Item
                        active={!isPM}
                        onClick={() => {
                            setIsPM(false);
                            updateTime(selectedHour, selectedMinute, false);
                        }}
                    >
                        AM
                    </Item>
                    <Item
                        active={isPM}
                        onClick={() => {
                            setIsPM(true);
                            updateTime(selectedHour, selectedMinute, true);
                        }}
                    >
                        PM
                    </Item>
                </Column>
            </div>
        </div>
    );
};

// Wrapper for Input + Picker
const TimeInputWithPicker = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div className="relative">
            <div className="relative">
                <input
                    type="time"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C] [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3D518C] transition-colors"
                >
                    <Clock size={16} />
                </button>
            </div>
            {showPicker && (
                <CustomTimePicker
                    value={value}
                    onChange={onChange}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
};

interface EmailAttendeesProps {
    event: EventSummary;
}

export default function EmailAttendeesClient({ event }: EmailAttendeesProps) {
    // const editorRef = useRef<HTMLDivElement>(null); // Removed ref

    const [activeTab, setActiveTab] = useState<'create' | 'emails' | 'drafts'>('create');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initial event prop is used instead of hardcoded data

    // Filter states
    const [ticketTypes, setTicketTypes] = useState({
        selectAll: false,
        generalAdmission: false,
        premiumAdmission: false,
    });

    const [statuses, setStatuses] = useState({
        selectAll: false,
        pending: false,
        confirmed: false,
        attended: false,
        notAttended: false,
        waitlisted: false,
    });

    const [attendanceTypes, setAttendanceTypes] = useState({
        selectAll: false,
        mainEvent: false,
        breakoutSession: false,
    });

    // Email composer states
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState(''); // New state for RichTextEditor
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    // Save options states
    const [scheduleOption, setScheduleOption] = useState<'immediately' | 'later'>('immediately');
    const [sendOption, setSendOption] = useState<'preview' | 'attendees'>('preview');
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
    const [emailToDelete, setEmailToDelete] = useState<SentEmail | null>(null);

    // Sent emails list
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([
        {
            id: '1',
            subject: 'Welcome to DevFest Cebu 2025!',
            body: 'We are excited to have you join us...',
            recipientCount: 350,
            sentAt: new Date(Date.now() - 86400000 * 2),
            status: 'sent'
        },
        {
            id: '2',
            subject: 'Event Reminder - DevFest Cebu 2025',
            body: 'Just a friendly reminder that the event is coming up...',
            recipientCount: 320,
            sentAt: new Date(Date.now() - 86400000),
            status: 'sent'
        }
    ]);


    // Calculate attendees count based on filters
    const getAttendeesCount = () => {
        let count = 0;
        if (ticketTypes.selectAll) return 200;
        if (ticketTypes.generalAdmission) count += 150;
        if (ticketTypes.premiumAdmission) count += 50;
        if (count === 0) {
            // If no ticket type selected, use status filters
            if (statuses.selectAll) return 200;
            if (statuses.confirmed) count += 120;
            if (statuses.pending) count += 30;
            if (statuses.attended) count += 45;
            if (statuses.waitlisted) count += 5;
        }
        return count || 200;
    };

    // Handle select all for ticket types
    const handleTicketSelectAll = () => {
        const newValue = !ticketTypes.selectAll;
        setTicketTypes({
            selectAll: newValue,
            generalAdmission: newValue,
            premiumAdmission: newValue,
        });
    };

    // Handle select all for statuses
    const handleStatusSelectAll = () => {
        const newValue = !statuses.selectAll;
        setStatuses({
            selectAll: newValue,
            pending: newValue,
            confirmed: newValue,
            attended: newValue,
            notAttended: newValue,
            waitlisted: newValue,
        });
    };

    // Handle select all for attendance types
    const handleAttendanceSelectAll = () => {
        const newValue = !attendanceTypes.selectAll;
        setAttendanceTypes({
            selectAll: newValue,
            mainEvent: newValue,
            breakoutSession: newValue,
        });
    };
    // Validate form
    const validateForm = () => {
        if (!emailSubject.trim()) {
            setToast({ message: 'Please enter an email subject', type: 'error' });
            return false;
        }
        if (!emailBody || emailBody === '<p></p>' || emailBody.trim() === '') {
            setToast({ message: 'Please enter email content', type: 'error' });
            return false;
        }
        if (scheduleOption === 'later' && (!scheduledDate || !scheduledTime)) {
            setToast({ message: 'Please select a date and time for scheduling', type: 'error' });
            return false;
        }
        return true;
    };

    // Save as draft
    const handleSaveAsDraft = () => {
        if (!emailSubject.trim()) {
            setToast({ message: 'Please enter at least a subject to save as draft', type: 'error' });
            return;
        }

        const draft: SentEmail = {
            id: Date.now().toString(),
            subject: emailSubject,
            body: emailBody,
            recipientCount: getAttendeesCount(),
            sentAt: new Date(),
            status: 'draft'
        };

        setSentEmails(prev => [draft, ...prev]);
        setToast({ message: 'Draft saved successfully!', type: 'success' });
    };

    // Send email
    const handleSendEmail = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newEmail: SentEmail = {
            id: Date.now().toString(),
            subject: emailSubject,
            body: emailBody,
            recipientCount: getAttendeesCount(),
            sentAt: new Date(),
            status: scheduleOption === 'later' ? 'scheduled' : 'sent',
            scheduledFor: scheduleOption === 'later' ? new Date(`${scheduledDate}T${scheduledTime}`) : undefined
        };

        setSentEmails(prev => [newEmail, ...prev]);

        if (sendOption === 'preview') {
            setToast({ message: 'Preview email sent to your inbox!', type: 'success' });
        } else if (scheduleOption === 'later') {
            setToast({ message: `Email scheduled for ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}`, type: 'success' });
        } else {
            setToast({ message: `Email sent to ${getAttendeesCount()} attendees!`, type: 'success' });
        }

        // Reset form
        setEmailSubject('');
        setEmailBody('');
        setScheduledDate('');
        setScheduledTime('');
        setIsLoading(false);
    };


    // Delete sent email (request confirmation)
    const handleDeleteEmail = (id: string) => {
        const email = sentEmails.find(e => e.id === id);
        if (email) {
            setEmailToDelete(email);
        }
    };

    // Confirm delete
    const confirmDelete = () => {
        if (emailToDelete) {
            setSentEmails(prev => prev.filter(email => email.id !== emailToDelete.id));
            setToast({ message: 'Email deleted', type: 'info' });
            setEmailToDelete(null);
        }
    };

    // Load draft into editor
    const handleLoadDraft = (email: SentEmail) => {
        setEmailSubject(email.subject);
        setEmailBody(email.body);
        setActiveTab('create');
        setToast({ message: 'Draft loaded into editor', type: 'info' });
    };

    // Format date
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            {/* Toast Notification */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <style jsx global>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                /* Hide scrollbar while keeping scroll functionality */
                .scrollbar-hide {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;  /* Chrome, Safari and Opera */
                }
            `}</style>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Navigation Sidebar */}
                <Sidebar activePage="events" disableExpand={true} />

                {/* Event Specific Sidebar */}
                <div className="ml-20 hidden lg:block h-full flex-shrink-0">
                    <EventsSidebar event={event} activePage="email-attendees" />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 ml-20 lg:ml-0 overflow-y-auto scrollbar-hide p-8">
                    <div className="max-w-5xl mx-auto space-y-8">

                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                                    <Mail className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Email to Attendees
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        Send targeted emails to your event attendees
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <Users size={18} className="text-[#3D518C]" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-semibold text-[#3D518C]">{getAttendeesCount()}</span> attendees selected
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-700 inline-flex">
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'create'
                                    ? 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Create Email
                            </button>
                            <button
                                onClick={() => setActiveTab('emails')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'emails'
                                    ? 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Sent Emails
                                {sentEmails.filter(e => e.status !== 'draft').length > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'emails' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                        {sentEmails.filter(e => e.status !== 'draft').length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('drafts')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'drafts'
                                    ? 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Drafts
                                {sentEmails.filter(e => e.status === 'draft').length > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'drafts' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                        {sentEmails.filter(e => e.status === 'draft').length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {activeTab === 'create' ? (
                            <div className="space-y-6">
                                {/* Email Filters Section */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                                    <Filter className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                                        Email Filters
                                                    </h2>
                                                    <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">Select who should receive this email</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                                                className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                                            >
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isFiltersExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {isFiltersExpanded && (
                                        <div className="p-6 animate-slide-up">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Select Ticket Type */}
                                                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                        Ticket Type
                                                    </h3>
                                                    <div className="space-y-1">
                                                        <Checkbox label="Select All" checked={ticketTypes.selectAll} onChange={handleTicketSelectAll} />
                                                        <Checkbox label="General Admission" checked={ticketTypes.generalAdmission} onChange={() => setTicketTypes(prev => ({ ...prev, generalAdmission: !prev.generalAdmission, selectAll: false }))} />
                                                        <Checkbox label="Premium Admission" checked={ticketTypes.premiumAdmission} onChange={() => setTicketTypes(prev => ({ ...prev, premiumAdmission: !prev.premiumAdmission, selectAll: false }))} />
                                                    </div>
                                                </div>

                                                {/* Select Status */}
                                                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                        Status
                                                    </h3>
                                                    <div className="space-y-1">
                                                        <Checkbox label="Select All" checked={statuses.selectAll} onChange={handleStatusSelectAll} />
                                                        <Checkbox label="Pending" checked={statuses.pending} onChange={() => setStatuses(prev => ({ ...prev, pending: !prev.pending, selectAll: false }))} />
                                                        <Checkbox label="Confirmed" checked={statuses.confirmed} onChange={() => setStatuses(prev => ({ ...prev, confirmed: !prev.confirmed, selectAll: false }))} />
                                                        <Checkbox label="Attended" checked={statuses.attended} onChange={() => setStatuses(prev => ({ ...prev, attended: !prev.attended, selectAll: false }))} />
                                                        <Checkbox label="Not Attended" checked={statuses.notAttended} onChange={() => setStatuses(prev => ({ ...prev, notAttended: !prev.notAttended, selectAll: false }))} />
                                                        <Checkbox label="Waitlisted" checked={statuses.waitlisted} onChange={() => setStatuses(prev => ({ ...prev, waitlisted: !prev.waitlisted, selectAll: false }))} />
                                                    </div>
                                                </div>

                                                {/* Select Attendance Type */}
                                                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                                        Attendance Type
                                                    </h3>
                                                    <div className="space-y-1">
                                                        <Checkbox label="Select All" checked={attendanceTypes.selectAll} onChange={handleAttendanceSelectAll} />
                                                        <Checkbox label="Main Event" checked={attendanceTypes.mainEvent} onChange={() => setAttendanceTypes(prev => ({ ...prev, mainEvent: !prev.mainEvent, selectAll: false }))} />
                                                        <Checkbox label="Breakout Session" checked={attendanceTypes.breakoutSession} onChange={() => setAttendanceTypes(prev => ({ ...prev, breakoutSession: !prev.breakoutSession, selectAll: false }))} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Email Composer Section */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                                    Compose Email
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">Write your message to attendees</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        {/* Email Subject */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject Line <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Enter a compelling subject line..."
                                                value={emailSubject}
                                                onChange={(e) => setEmailSubject(e.target.value)}
                                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all duration-200"
                                            />
                                        </div>

                                        {/* Rich Text Editor */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Body <span className="text-red-500">*</span></label>
                                            <RichTextEditor
                                                content={emailBody}
                                                onChange={setEmailBody}
                                                placeholder="Start typing your email content here..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Save Options Section */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-md">
                                    <div className="p-6 rounded-t-2xl border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                                                <Send className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                                    Send Options
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">Choose when and how to send your email</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Schedule Send */}
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Schedule
                                                </h3>
                                                <div className="space-y-2">
                                                    <RadioButton label="Send Immediately" checked={scheduleOption === 'immediately'} onChange={() => setScheduleOption('immediately')} icon={Send} />
                                                    <RadioButton label="Schedule for Later" checked={scheduleOption === 'later'} onChange={() => setScheduleOption('later')} icon={Clock} />
                                                </div>

                                                {/* Date/Time picker for scheduled send */}
                                                {scheduleOption === 'later' && (
                                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3 animate-slide-up">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Date</label>
                                                                <DateInput
                                                                    value={scheduledDate ? new Date(scheduledDate) : null}
                                                                    onChange={(date) => setScheduledDate(date ? date.toISOString().split('T')[0] : '')}
                                                                    placeholder="Select date"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Time</label>
                                                                <TimeInput
                                                                    value={scheduledTime}
                                                                    onChange={setScheduledTime}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Send Options */}
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Delivery Mode
                                                </h3>
                                                <div className="space-y-2">
                                                    <RadioButton label="Send Preview to My Email" checked={sendOption === 'preview'} onChange={() => setSendOption('preview')} icon={Eye} />
                                                    <RadioButton label="Send to All Attendees" checked={sendOption === 'attendees'} onChange={() => setSendOption('attendees')} icon={Users} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p>
                                            Ready to send to <span className="font-semibold text-[#3D518C]">{getAttendeesCount()}</span> attendees based on your filters
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleSaveAsDraft}
                                            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                                        >
                                            Save as Draft
                                        </button>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={isLoading}
                                            className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <RefreshCw size={16} className="animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} />
                                                    {sendOption === 'preview' ? 'Send Preview' : 'Send Email'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'emails' ? (
                            /* Emails Tab - List of sent emails */
                            <div className="space-y-4">
                                {sentEmails.filter(e => e.status !== 'draft').length === 0 ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No emails sent yet</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start by creating your first email campaign</p>
                                        <button
                                            onClick={() => setActiveTab('create')}
                                            className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200"
                                        >
                                            Create Your First Email
                                        </button>
                                    </div>
                                ) : (
                                    sentEmails.filter(e => e.status !== 'draft').map((email) => (
                                        <div key={email.id}
                                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                                            onClick={() => setSelectedEmail(email)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{email.subject}</h3>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${email.status === 'sent' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                                            {email.status === 'sent' ? 'Sent' : 'Scheduled'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" dangerouslySetInnerHTML={{ __html: email.body.replace(/<[^>]*>/g, ' ').substring(0, 150) + '...' }} />
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Users size={12} />
                                                            {email.recipientCount} recipients
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {email.status === 'scheduled' && email.scheduledFor
                                                                ? `Scheduled for ${formatDate(email.scheduledFor)}`
                                                                : formatDate(email.sentAt)
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEmail(email.id);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* Drafts Tab */
                            <div className="space-y-4">
                                {sentEmails.filter(e => e.status === 'draft').length === 0 ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No drafts found</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a new email and save it as a draft</p>
                                        <button
                                            onClick={() => setActiveTab('create')}
                                            className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200"
                                        >
                                            Create New Draft
                                        </button>
                                    </div>
                                ) : (
                                    sentEmails.filter(e => e.status === 'draft').map((email) => (
                                        <div key={email.id}
                                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                                            onClick={() => handleLoadDraft(email)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{email.subject}</h3>
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                            Draft
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" dangerouslySetInnerHTML={{ __html: email.body.replace(/<[^>]*>/g, ' ').substring(0, 150) + '...' }} />
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Users size={12} />
                                                            {email.recipientCount} (Planned)
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            Last edited {formatDate(email.sentAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleLoadDraft(email)}
                                                        className="p-2 text-[#3D518C] hover:bg-[#3D518C]/10 rounded-lg transition-colors"
                                                        title="Continue Editing"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEmail(email.id);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Email Preview Modal */}
            <Modal
                isOpen={!!selectedEmail}
                onClose={() => setSelectedEmail(null)}
                title={selectedEmail?.subject || 'Email Preview'}
                subtitle={selectedEmail ? `Sent to ${selectedEmail.recipientCount} recipients • ${formatDate(selectedEmail.sentAt)}` : ''}
                size="lg"
            >
                <div className="space-y-6">
                    <div className="prose dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: selectedEmail?.body || '' }} />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setSelectedEmail(null)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            Close Preview
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!emailToDelete}
                onClose={() => setEmailToDelete(null)}
                title="Delete Email?"
                size="sm"
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{emailToDelete?.subject}"</span>?
                        This action cannot be undone.
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setEmailToDelete(null)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
