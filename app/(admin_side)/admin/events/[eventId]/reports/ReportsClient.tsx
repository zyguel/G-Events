"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    FileText, Download, Search, ChevronDown, Filter, X, Info,
    FileSpreadsheet, FileType, Table2, Check, BarChart3, List, PieChart as PieChartIcon
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { usePermissions } from '@/contexts/PermissionContext';
import TablePaginationControls from '@/components/admin/TablePaginationControls';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// Types
interface Registrant {
    id: string;
    name: string;
    email: string;
    gender: string;
    age: number;
    birthdate: string;
    ticketType: string;
    registrationType: 'Individual' | 'Group';
    status: 'Confirmed' | 'Pending' | 'Rejected';
    paymentStatus: 'Paid' | 'Pending' | 'Refunded';
    registrationDate: string;
    checkedIn: boolean;
}

interface BreakoutSession {
    id: string;
    name: string;
    speaker: string;
    room: string;
    capacity: number;
    registered: number;
    checkedIn: number;
    attendanceRate: number;
}

interface FeedbackResponse {
    id: string;
    submitterName: string;
    submitterEmail: string;
    submittedAt: string;
    answers: {
        question: string;
        answer: string;
        inputFormat: string;
    }[];
}

// (mock data removed — real data comes from getEventReports() server action)




// Custom Dropdown Component with color-coded options
interface DropdownOption {
    value: string;
    label: string;
    color?: string;
}

const ColorDropdown = ({
    value,
    options,
    onChange,
    placeholder = 'Select...'
}: {
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-left flex items-center justify-between text-gray-900 dark:text-white"
            >
                <span className="flex items-center gap-2">
                    {selectedOption?.color && (
                        <span className={`w-2 h-2 rounded-full ${selectedOption.color}`} />
                    )}
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                            className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#ABD2FA]/50 dark:hover:bg-[#3D518C]/50 transition-colors ${value === option.value ? 'bg-[#ABD2FA]/30 dark:bg-[#3D518C]/30' : ''
                                }`}
                        >
                            {option.color && (
                                <span className={`w-2 h-2 rounded-full ${option.color}`} />
                            )}
                            <span className="text-gray-900 dark:text-white">{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Filter Modal Component
const FilterModal = ({
    isOpen,
    onClose,
    activeTab,
    filters,
    setFilters
}: {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    filters: Record<string, string>;
    setFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) => {
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters, isOpen]);

    const handleApply = () => {
        setFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({});
    };

    const activeFilterCount = Object.values(localFilters).filter(v => v && v !== '').length;

    // Dropdown options with colors
    const ticketTypeOptions: DropdownOption[] = [
        { value: '', label: 'All', color: '' },
        { value: 'General Admission', label: 'General Admission', color: 'bg-emerald-500' },
        { value: 'Premium', label: 'Premium', color: 'bg-purple-500' },
    ];

    const registrationStatusOptions: DropdownOption[] = [
        { value: '', label: 'All', color: '' },
        { value: 'Confirmed', label: 'Confirmed', color: 'bg-emerald-500' },
        { value: 'Pending', label: 'Pending', color: 'bg-amber-500' },
        { value: 'Rejected', label: 'Rejected', color: 'bg-red-500' },
    ];

    const attendanceStatusOptions: DropdownOption[] = [
        { value: '', label: 'All', color: '' },
        { value: 'Checked-In', label: 'Checked-In', color: 'bg-emerald-500' },
        { value: 'No-show', label: 'No-show', color: 'bg-red-500' },
    ];

    const registrationTypeOptions: DropdownOption[] = [
        { value: '', label: 'All', color: '' },
        { value: 'Individual', label: 'Individual', color: 'bg-blue-500' },
        { value: 'Group', label: 'Group', color: 'bg-indigo-500' },
    ];

    const paymentStatusOptions: DropdownOption[] = [
        { value: '', label: 'All', color: '' },
        { value: 'Paid', label: 'Paid', color: 'bg-emerald-500' },
        { value: 'Pending', label: 'Pending', color: 'bg-amber-500' },
        { value: 'Refunded', label: 'Refunded', color: 'bg-gray-500' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filter by</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date:</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-xs text-gray-500">From</span>
                                <input
                                    type="date"
                                    value={localFilters.dateFrom || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">To</span>
                                <input
                                    type="date"
                                    value={localFilters.dateTo || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ticket Type */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ticket Type</label>
                            <button onClick={() => setLocalFilters({ ...localFilters, ticketType: '' })} className="text-xs text-[#3D518C] dark:text-[#ABD2FA] hover:underline">Reset</button>
                        </div>
                        <ColorDropdown
                            value={localFilters.ticketType || ''}
                            options={ticketTypeOptions}
                            onChange={(v) => setLocalFilters({ ...localFilters, ticketType: v })}
                            placeholder="All"
                        />
                    </div>

                    {/* Registration/Attendance Status */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {activeTab === 'attendance' ? 'Attendance Status' : 'Registration Status'}
                            </label>
                            <button onClick={() => setLocalFilters({ ...localFilters, status: '' })} className="text-xs text-[#3D518C] dark:text-[#ABD2FA] hover:underline">Reset</button>
                        </div>
                        <ColorDropdown
                            value={localFilters.status || ''}
                            options={activeTab === 'attendance' ? attendanceStatusOptions : registrationStatusOptions}
                            onChange={(v) => setLocalFilters({ ...localFilters, status: v })}
                            placeholder="All"
                        />
                    </div>

                    {/* Registration Type */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration Type</label>
                            <button onClick={() => setLocalFilters({ ...localFilters, registrationType: '' })} className="text-xs text-[#3D518C] dark:text-[#ABD2FA] hover:underline">Reset</button>
                        </div>
                        <ColorDropdown
                            value={localFilters.registrationType || ''}
                            options={registrationTypeOptions}
                            onChange={(v) => setLocalFilters({ ...localFilters, registrationType: v })}
                            placeholder="All"
                        />
                    </div>

                    {activeTab === 'registration' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
                                <button onClick={() => setLocalFilters({ ...localFilters, paymentStatus: '' })} className="text-xs text-[#3D518C] dark:text-[#ABD2FA] hover:underline">Reset</button>
                            </div>
                            <ColorDropdown
                                value={localFilters.paymentStatus || ''}
                                options={paymentStatusOptions}
                                onChange={(v) => setLocalFilters({ ...localFilters, paymentStatus: v })}
                                placeholder="All"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleReset}
                        className="px-5 py-2.5 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Reset All
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all"
                    >
                        Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Export Dropdown Component with success feedback
const ExportDropdown = ({ onExport, exportedFormat }: { onExport: (format: string) => void; exportedFormat: string | null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = (format: string) => {
        onExport(format);
        setTimeout(() => setIsOpen(false), 500);
    };

    const exportOptions = [
        { format: 'xlsx', label: 'Excel (.xlsx)', desc: 'Spreadsheet with multiple sheets', icon: FileSpreadsheet, color: 'emerald' },
        { format: 'pdf', label: 'PDF Document', desc: 'Formatted report document', icon: FileType, color: 'red' },
        { format: 'csv', label: 'CSV File', desc: 'Simple comma-separated values', icon: Table2, color: 'blue' },
    ];

    const colorClasses: Record<string, { bg: string; icon: string }> = {
        emerald: {
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            icon: 'text-emerald-600 dark:text-emerald-400',
        },
        red: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            icon: 'text-red-600 dark:text-red-400',
        },
        blue: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            icon: 'text-blue-600 dark:text-blue-400',
        },
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
            >
                <Download size={16} />
                Export
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20 min-w-[240px] overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Export Format</p>
                    </div>
                    <div className="py-1">
                        {exportOptions.map((opt) => {
                            const Icon = opt.icon;
                            const isExported = exportedFormat === opt.format;
                            const classes = colorClasses[opt.color] || colorClasses.blue;
                            return (
                                <button
                                    key={opt.format}
                                    onClick={() => handleExport(opt.format)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExported
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : classes.bg
                                        }`}>
                                        {isExported ? (
                                            <Check size={16} className="text-green-600 dark:text-green-400" />
                                        ) : (
                                            <Icon size={16} className={classes.icon} />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-medium ${isExported
                                            ? 'text-green-700 dark:text-green-400'
                                            : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {isExported ? 'Downloaded!' : opt.label}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value }: { title: string; value: string | number }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            {title}
            <Info size={14} className="opacity-50" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
        </div>
    </div>
);

// Main Page Component
import { EventSummary } from '@/lib/types';
import { EventReportsData } from '@/lib/actions/events';

// Main Page Component
interface ReportsClientProps {
    event: EventSummary;
    reports: EventReportsData;
}

export default function EventReportsPage({ event, reports }: ReportsClientProps) {
    const eventId = event.id;
    const { hasPermission } = usePermissions();

    // Validate eventId
    if (!eventId || eventId === 'undefined') {
        console.error('Invalid eventId in reports page:', eventId);
        return (
            <div className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Event</h1>
                    <p className="text-gray-600 dark:text-gray-400">Unable to load reports. Event ID is invalid.</p>
                </div>
            </div>
        );
    }

    // Use real data from server
    const { registrants, stats, breakoutSessions, feedbackResponses } = reports;
    const generalAttendancePct = stats.attendance.generalTotal > 0
        ? Math.round((stats.attendance.generalAttended / stats.attendance.generalTotal) * 100)
        : 0;
    const premiumAttendancePct = stats.attendance.premiumTotal > 0
        ? Math.round((stats.attendance.premiumAttended / stats.attendance.premiumTotal) * 100)
        : 0;

    const [activeTab, setActiveTab] = useState<'registration' | 'attendance' | 'breakout' | 'feedback'>('registration');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [registrationPage, setRegistrationPage] = useState(1);
    const [registrationRowsPerPage, setRegistrationRowsPerPage] = useState(10);
    const [attendancePage, setAttendancePage] = useState(1);
    const [attendanceRowsPerPage, setAttendanceRowsPerPage] = useState(10);
    const [breakoutPage, setBreakoutPage] = useState(1);
    const [breakoutRowsPerPage, setBreakoutRowsPerPage] = useState(10);
    const [feedbackPage, setFeedbackPage] = useState(1);
    const [feedbackRowsPerPage, setFeedbackRowsPerPage] = useState(10);
    const [feedbackView, setFeedbackView] = useState<'summary' | 'individual'>('summary');
    const [feedbackQuestionFilter, setFeedbackQuestionFilter] = useState('');



    // Filtered data
    const filteredRegistrants = registrants.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.id.includes(searchQuery);
        const matchesTicketType = !filters.ticketType || r.ticketType === filters.ticketType;
        const matchesStatus = !filters.status || r.status === filters.status;
        const matchesRegistrationType = !filters.registrationType || r.registrationType === filters.registrationType;
        const matchesPaymentStatus = !filters.paymentStatus || r.paymentStatus === filters.paymentStatus;
        const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;
        const registrationDate = r.registrationDate ? new Date(r.registrationDate) : null;
        const matchesDateFrom = !dateFrom || !registrationDate || registrationDate >= dateFrom;
        const matchesDateTo = !dateTo || !registrationDate || registrationDate <= dateTo;
        return matchesSearch && matchesTicketType && matchesStatus && matchesRegistrationType && matchesPaymentStatus && matchesDateFrom && matchesDateTo;
    });

    // Filter for attendance tab
    const filteredForAttendance = registrants.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTicketType = !filters.ticketType || r.ticketType === filters.ticketType;
        const matchesStatus = !filters.status ||
            (filters.status === 'Checked-In' ? r.checkedIn : !r.checkedIn);
        const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;
        const registrationDate = r.registrationDate ? new Date(r.registrationDate) : null;
        const matchesDateFrom = !dateFrom || !registrationDate || registrationDate >= dateFrom;
        const matchesDateTo = !dateTo || !registrationDate || registrationDate <= dateTo;
        return matchesSearch && matchesTicketType && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    const filteredBreakoutSessions = breakoutSessions.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedRegistrants = filteredRegistrants.slice(
        (registrationPage - 1) * registrationRowsPerPage,
        registrationPage * registrationRowsPerPage
    );

    const paginatedAttendance = filteredForAttendance.slice(
        (attendancePage - 1) * attendanceRowsPerPage,
        attendancePage * attendanceRowsPerPage
    );

    const paginatedBreakoutSessions = filteredBreakoutSessions.slice(
        (breakoutPage - 1) * breakoutRowsPerPage,
        breakoutPage * breakoutRowsPerPage
    );

    useEffect(() => {
        if (activeTab === 'registration') {
            setRegistrationPage(1);
        }
        if (activeTab === 'attendance') {
            setAttendancePage(1);
        }
        if (activeTab === 'breakout') {
            setBreakoutPage(1);
        }
        if (activeTab === 'feedback') {
            setFeedbackPage(1);
        }
    }, [activeTab, filters, searchQuery]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredRegistrants.length / registrationRowsPerPage));
        if (registrationPage > totalPages) {
            setRegistrationPage(totalPages);
        }
    }, [filteredRegistrants.length, registrationPage, registrationRowsPerPage]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredForAttendance.length / attendanceRowsPerPage));
        if (attendancePage > totalPages) {
            setAttendancePage(totalPages);
        }
    }, [attendancePage, attendanceRowsPerPage, filteredForAttendance.length]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredBreakoutSessions.length / breakoutRowsPerPage));
        if (breakoutPage > totalPages) {
            setBreakoutPage(totalPages);
        }
    }, [breakoutPage, breakoutRowsPerPage, filteredBreakoutSessions.length]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(feedbackResponses.length / feedbackRowsPerPage));
        if (feedbackPage > totalPages) {
            setFeedbackPage(totalPages);
        }
    }, [feedbackPage, feedbackRowsPerPage, feedbackResponses.length]);

    const [exportedFormat, setExportedFormat] = useState<string | null>(null);

    // Clear success indicator after timeout
    useEffect(() => {
        if (exportedFormat) {
            const timer = setTimeout(() => setExportedFormat(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [exportedFormat]);

    // Helper to trigger file download
    const downloadFile = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getTimestamp = () => new Date().toISOString().slice(0, 10);

    const handleExport = useCallback(async (format: string) => {
        const timestamp = getTimestamp();
        const filename = `${event.name.replace(/\s+/g, '_')}_${activeTab}_Report_${timestamp}`;

        try {
            if (format === 'csv') {
                let csv = '';
                if (activeTab === 'registration') {
                    csv += 'Name,Email,Gender,Age,Birthdate,Ticket Type,Registration Type,Status,Payment Status\n';
                    registrants.forEach(r => {
                        csv += `${r.name},${r.email},${r.gender},${r.age},${r.birthdate},${r.ticketType},${r.registrationType},${r.status},${r.paymentStatus}\n`;
                    });
                } else if (activeTab === 'attendance') {
                    csv += 'Name,Email,Gender,Age,Birthdate,Ticket Type,Status\n';
                    registrants.forEach(r => {
                        csv += `${r.name},${r.email},${r.gender},${r.age},${r.birthdate},${r.ticketType},${r.checkedIn ? 'Checked-In' : 'No-show'}\n`;
                    });
                } else if (activeTab === 'breakout') {
                    csv += 'Session Name,Speaker,Room,Capacity,Registered,Checked-in,Attendance Rate\n';
                    breakoutSessions.forEach(s => {
                        csv += `${s.name},${s.speaker},${s.room},${s.capacity},${s.registered},${s.checkedIn},${s.attendanceRate}%\n`;
                    });
                } else if (activeTab === 'feedback') {
                    // Build feedback CSV with dynamic columns based on questions
                    if (feedbackResponses.length > 0) {
                        // Get all unique questions
                        const allQuestions = Array.from(new Set(
                            feedbackResponses.flatMap(f => f.answers.map(a => a.question))
                        ));
                        csv += 'Submitter Name,Email,Submitted At,' + allQuestions.map(q => `"${q.replace(/"/g, '""')}"`).join(',') + '\n';
                        feedbackResponses.forEach(f => {
                            const answerMap = new Map(f.answers.map(a => [a.question, a.answer]));
                            const row = [
                                f.submitterName,
                                f.submitterEmail,
                                new Date(f.submittedAt).toLocaleString(),
                                ...allQuestions.map(q => `"${(answerMap.get(q) || '').replace(/"/g, '""')}"`)
                            ];
                            csv += row.join(',') + '\n';
                        });
                    } else {
                        csv += 'No feedback responses available\n';
                    }
                }
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                downloadFile(blob, `${filename}.csv`);
            } else if (format === 'xlsx') {
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet(activeTab.charAt(0).toUpperCase() + activeTab.slice(1));

                if (activeTab === 'registration') {
                    sheet.columns = [
                        { header: 'Name', key: 'name', width: 20 },
                        { header: 'Email', key: 'email', width: 30 },
                        { header: 'Gender', key: 'gender', width: 10 },
                        { header: 'Age', key: 'age', width: 8 },
                        { header: 'Birthdate', key: 'birthdate', width: 18 },
                        { header: 'Ticket Type', key: 'ticketType', width: 18 },
                        { header: 'Reg. Type', key: 'registrationType', width: 12 },
                        { header: 'Status', key: 'status', width: 12 },
                        { header: 'Payment', key: 'paymentStatus', width: 12 },
                    ];
                    sheet.addRows(registrants);
                } else if (activeTab === 'attendance') {
                    sheet.columns = [
                        { header: 'Name', key: 'name', width: 20 },
                        { header: 'Email', key: 'email', width: 30 },
                        { header: 'Gender', key: 'gender', width: 10 },
                        { header: 'Age', key: 'age', width: 8 },
                        { header: 'Birthdate', key: 'birthdate', width: 18 },
                        { header: 'Ticket Type', key: 'ticketType', width: 18 },
                        { header: 'Status', key: 'status', width: 12 },
                    ];
                    sheet.addRows(registrants.map(r => ({ ...r, status: r.checkedIn ? 'Checked-In' : 'No-show' })));
                } else if (activeTab === 'breakout') {
                    sheet.columns = [
                        { header: 'Session Name', key: 'name', width: 20 },
                        { header: 'Speaker', key: 'speaker', width: 20 },
                        { header: 'Room', key: 'room', width: 12 },
                        { header: 'Capacity', key: 'capacity', width: 12 },
                        { header: 'Registered', key: 'registered', width: 12 },
                        { header: 'Checked-in', key: 'checkedIn', width: 12 },
                        { header: 'Attendance Rate', key: 'attendanceRate', width: 16 },
                    ];
                    sheet.addRows(breakoutSessions.map(s => ({ ...s, attendanceRate: `${s.attendanceRate}%` })));
                } else if (activeTab === 'feedback') {
                    // Build feedback Excel with dynamic columns based on questions
                    if (feedbackResponses.length > 0) {
                        const allQuestions = Array.from(new Set(
                            feedbackResponses.flatMap(f => f.answers.map(a => a.question))
                        ));
                        sheet.columns = [
                            { header: 'Submitter Name', key: 'submitterName', width: 20 },
                            { header: 'Email', key: 'submitterEmail', width: 30 },
                            { header: 'Submitted At', key: 'submittedAt', width: 20 },
                            ...allQuestions.map((q, idx) => ({ header: q, key: `q${idx}`, width: 30 }))
                        ];
                        const rows = feedbackResponses.map(f => {
                            const answerMap = new Map(f.answers.map(a => [a.question, a.answer]));
                            const row: Record<string, string> = {
                                submitterName: f.submitterName,
                                submitterEmail: f.submitterEmail,
                                submittedAt: new Date(f.submittedAt).toLocaleString(),
                            };
                            allQuestions.forEach((q, idx) => {
                                row[`q${idx}`] = answerMap.get(q) || '';
                            });
                            return row;
                        });
                        sheet.addRows(rows);
                    }
                }
                sheet.getRow(1).font = { bold: true };
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                downloadFile(blob, `${filename}.xlsx`);
            } else if (format === 'pdf') {
                const [jsPDFModule, autoTable] = await Promise.all([
                    import('jspdf/dist/jspdf.es.min.js'),
                    import('jspdf-autotable')
                ]);

                const jsPDF = (jsPDFModule as any).jsPDF || (jsPDFModule as any).default;
                const autoTableFn = (autoTable as any).default || autoTable;
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                doc.setFontSize(18);
                doc.setTextColor(55, 65, 81);
                doc.text(`${event.name} - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`, pageWidth / 2, 20, { align: 'center' });
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128);
                doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

                if (activeTab === 'registration') {
                    autoTableFn(doc, {
                        startY: 40,
                        head: [['Name', 'Email', 'Gender', 'Ticket', 'Status']],
                        body: registrants.map(r => [r.name, r.email, r.gender, r.ticketType, r.status]),
                        theme: 'striped',
                        headStyles: { fillColor: [61, 81, 140] },
                    });
                } else if (activeTab === 'attendance') {
                    autoTableFn(doc, {
                        startY: 40,
                        head: [['Name', 'Email', 'Ticket', 'Status']],
                        body: registrants.map(r => [r.name, r.email, r.ticketType, r.checkedIn ? 'Checked-In' : 'No-show']),
                        theme: 'striped',
                        headStyles: { fillColor: [61, 81, 140] },
                    });
                } else if (activeTab === 'breakout') {
                    autoTableFn(doc, {
                        startY: 40,
                        head: [['Session', 'Speaker', 'Room', 'Capacity', 'Registered', 'Checked-in', 'Rate']],
                        body: breakoutSessions.map(s => [s.name, s.speaker, s.room, s.capacity, s.registered, s.checkedIn, `${s.attendanceRate}%`]),
                        theme: 'striped',
                        headStyles: { fillColor: [61, 81, 140] },
                    });
                } else if (activeTab === 'feedback') {
                    // Build feedback PDF with responses table
                    let yPos = 40;
                    feedbackResponses.forEach((response, idx) => {
                        if (yPos > 250) {
                            doc.addPage();
                            yPos = 20;
                        }
                        doc.setFontSize(12);
                        doc.setTextColor(55, 65, 81);
                        doc.text(`${response.submitterName} (${response.submitterEmail})`, 14, yPos);
                        doc.setFontSize(10);
                        doc.setTextColor(107, 114, 128);
                        doc.text(new Date(response.submittedAt).toLocaleString(), 14, yPos + 6);
                        
                        const tableData = response.answers.map(a => [a.question, a.answer]);
                        autoTableFn(doc, {
                            startY: yPos + 10,
                            head: [['Question', 'Answer']],
                            body: tableData,
                            theme: 'striped',
                            headStyles: { fillColor: [61, 81, 140] },
                            styles: { fontSize: 9 },
                            margin: { bottom: 10 },
                        });
                        yPos = (doc as any).lastAutoTable.finalY + 10;
                    });
                }
                doc.save(`${filename}.pdf`);
            }
            setExportedFormat(format);
        } catch (error) {
            console.error('Export failed:', error);
        }
    }, [activeTab, event.name, registrants, breakoutSessions, feedbackResponses]);

    // Colors for charts
    const CHART_COLORS = ['#3D518C', '#5C6BC0', '#ABD2FA', '#FF8A65', '#4DB6AC', '#FFD54F', '#9575CD', '#81C784'];

    // Compute feedback question analysis for visual summaries
    const questionAnalysis = useMemo(() => {
        if (!feedbackResponses || feedbackResponses.length === 0) return [];

        // Get all unique questions grouped by input format
        const questionsMap = new Map<string, { question: string; inputFormat: string; answers: string[] }>();

        feedbackResponses.forEach(response => {
            response.answers.forEach(ans => {
                if (!questionsMap.has(ans.question)) {
                    questionsMap.set(ans.question, {
                        question: ans.question,
                        inputFormat: ans.inputFormat,
                        answers: []
                    });
                }
                questionsMap.get(ans.question)!.answers.push(ans.answer);
            });
        });

        // Analyze each question
        return Array.from(questionsMap.values()).map(q => {
            const answerCounts = new Map<string, number>();
            q.answers.forEach(ans => {
                // Handle multiple answers (comma-separated for checkboxes)
                const individualAnswers = ans.includes(',') ? ans.split(',').map(s => s.trim()) : [ans];
                individualAnswers.forEach(a => {
                    if (a) {
                        answerCounts.set(a, (answerCounts.get(a) || 0) + 1);
                    }
                });
            });

            const total = q.answers.length;
            const distribution = Array.from(answerCounts.entries())
                .map(([answer, count]) => ({
                    answer,
                    count,
                    percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
                }))
                .sort((a, b) => b.count - a.count);

            return {
                question: q.question,
                inputFormat: q.inputFormat,
                total,
                distribution
            };
        });
    }, [feedbackResponses]);

    // Filter questions for search
    const filteredQuestionAnalysis = useMemo(() => {
        if (!feedbackQuestionFilter) return questionAnalysis;
        return questionAnalysis.filter(q =>
            q.question.toLowerCase().includes(feedbackQuestionFilter.toLowerCase())
        );
    }, [questionAnalysis, feedbackQuestionFilter]);

    // Filtered feedback responses for individual view
    const filteredFeedbackResponses = useMemo(() => {
        return feedbackResponses.filter(f =>
            f.submitterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.submitterEmail.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [feedbackResponses, searchQuery]);

    const paginatedFeedback = filteredFeedbackResponses.slice(
        (feedbackPage - 1) * feedbackRowsPerPage,
        feedbackPage * feedbackRowsPerPage
    );

    return (
        <>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Filter Modal */}
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                activeTab={activeTab}
                filters={filters}
                setFilters={setFilters}
            />

            {/* Main Content Area */}
            <div className="p-8">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Event Reports
                                </h1>
                            </div>
                        </div>
                        {hasPermission('Export Order Report') && (
                            <ExportDropdown onExport={handleExport} exportedFormat={exportedFormat} />
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => { setActiveTab('registration'); setFilters({}); setSearchQuery(''); }}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'registration'
                                ? 'text-[#3D518C] dark:text-[#ABD2FA]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Registration
                            {activeTab === 'registration' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3D518C] dark:bg-[#ABD2FA]" />
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('attendance'); setFilters({}); setSearchQuery(''); }}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'attendance'
                                ? 'text-[#3D518C] dark:text-[#ABD2FA]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Attendance
                            {activeTab === 'attendance' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3D518C] dark:bg-[#ABD2FA]" />
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('breakout'); setFilters({}); setSearchQuery(''); }}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'breakout'
                                ? 'text-[#3D518C] dark:text-[#ABD2FA]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Breakout
                            {activeTab === 'breakout' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3D518C] dark:bg-[#ABD2FA]" />
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('feedback'); setFilters({}); setSearchQuery(''); }}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'feedback'
                                ? 'text-[#3D518C] dark:text-[#ABD2FA]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            Feedback
                            {activeTab === 'feedback' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3D518C] dark:bg-[#ABD2FA]" />
                            )}
                        </button>
                    </div>

                    {/* Registration Tab */}
                    {activeTab === 'registration' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Registration by Ticket Type</h3>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <p>General Admission: <span className="font-medium text-gray-900 dark:text-white">{stats.registration.generalAdmission}</span></p>
                                        <p>Premium: <span className="font-medium text-gray-900 dark:text-white">{stats.registration.premium}</span></p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Registration Type</h3>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <p>Group: <span className="font-medium text-gray-900 dark:text-white">{stats.registration.group}</span></p>
                                        <p>Individual: <span className="font-medium text-gray-900 dark:text-white">{stats.registration.individual}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard title="Total Registered" value={stats.registration.total} />
                                <StatCard title="Total Confirmed Registrations" value={`${stats.registration.confirmed} / ${stats.registration.total}`} />
                                <StatCard title="Total Rejected Registrations" value={`${stats.registration.rejected} / ${stats.registration.total}`} />
                            </div>

                            {/* Search and Filter */}
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by Order ID, Name, or Email"
                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Filter size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Row Count */}
                            <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
                                Displaying paginated rows. Use the table controls to navigate.
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#ABD2FA] dark:bg-[#3D518C]">
                                            <tr className="text-xs text-gray-700 dark:text-white font-semibold uppercase tracking-wider">
                                                <th className="px-5 py-4 text-left">Name</th>
                                                <th className="px-5 py-4 text-left">Email</th>
                                                <th className="px-5 py-4 text-left">Gender</th>
                                                <th className="px-5 py-4 text-left">Age</th>
                                                <th className="px-5 py-4 text-left">Birthdate</th>
                                                <th className="px-5 py-4 text-left">Ticket Type</th>
                                                <th className="px-5 py-4 text-left">Reg. Type</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {paginatedRegistrants.map((registrant) => (
                                                <tr key={registrant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{registrant.name}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.email}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.gender}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.age}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.birthdate}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.ticketType}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.registrationType}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <TablePaginationControls
                                    totalItems={filteredRegistrants.length}
                                    currentPage={registrationPage}
                                    rowsPerPage={registrationRowsPerPage}
                                    onPageChange={setRegistrationPage}
                                    onRowsPerPageChange={(rows) => {
                                        setRegistrationRowsPerPage(rows);
                                        setRegistrationPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Attendance Tab */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Attendance by Ticket Type */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Attendance by Ticket Type</h3>
                                <div className="flex gap-4">
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">General Admission</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Attended: {stats.attendance.generalAttended}/{stats.attendance.generalTotal} ({generalAttendancePct}%)
                                        </p>
                                    </div>
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Premium Admission</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Attended: {stats.attendance.premiumAttended}/{stats.attendance.premiumTotal} ({premiumAttendancePct}%)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard title="Total Check-in Participants" value={`${stats.attendance.checkedIn} / ${stats.attendance.totalRegistered}`} />
                                <StatCard title="Total No-show Participants" value={`${stats.attendance.noShow} / ${stats.attendance.totalRegistered}`} />
                                <StatCard title="Attendance Rate" value={`${stats.attendance.attendanceRate} %`} />
                            </div>

                            {/* Search and Filter */}
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by Order ID, Name, or Email"
                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Filter size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Row Count */}
                            <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
                                Displaying paginated rows. Use the table controls to navigate.
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#ABD2FA] dark:bg-[#3D518C]">
                                            <tr className="text-xs text-gray-700 dark:text-white font-semibold uppercase tracking-wider">
                                                <th className="px-5 py-4 text-left">Name</th>
                                                <th className="px-5 py-4 text-left">Email</th>
                                                <th className="px-5 py-4 text-left">Gender</th>
                                                <th className="px-5 py-4 text-left">Age</th>
                                                <th className="px-5 py-4 text-left">Birthdate</th>
                                                <th className="px-5 py-4 text-left">Ticket Type</th>
                                                <th className="px-5 py-4 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {paginatedAttendance.map((registrant) => (
                                                <tr key={registrant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{registrant.name}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.email}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.gender}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.age}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.birthdate}</td>
                                                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{registrant.ticketType}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${registrant.checkedIn
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            }`}>
                                                            {registrant.checkedIn ? 'Checked-In' : 'No-show'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <TablePaginationControls
                                    totalItems={filteredForAttendance.length}
                                    currentPage={attendancePage}
                                    rowsPerPage={attendanceRowsPerPage}
                                    onPageChange={setAttendancePage}
                                    onRowsPerPageChange={(rows) => {
                                        setAttendanceRowsPerPage(rows);
                                        setAttendancePage(1);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Breakout Tab */}
                    {activeTab === 'breakout' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard title="Total Breakout Sessions Created" value={breakoutSessions.length} />
                                <StatCard title="Total Breakout Session Registrations" value={breakoutSessions.reduce((sum, s) => sum + s.registered, 0)} />
                                <StatCard title="Total Attended Breakout Session" value={breakoutSessions.reduce((sum, s) => sum + s.checkedIn, 0)} />
                            </div>

                            {/* Search */}
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by Session Name or Speaker"
                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                    />
                                </div>
                            </div>

                            {/* Row Count */}
                            <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
                                Displaying paginated rows. Use the table controls to navigate.
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#ABD2FA] dark:bg-[#3D518C]">
                                            <tr className="text-xs text-gray-700 dark:text-white font-semibold uppercase tracking-wider">
                                                <th className="px-5 py-4 text-left">Session Name</th>
                                                <th className="px-5 py-4 text-left">Speaker</th>
                                                <th className="px-5 py-4 text-left">Room</th>
                                                <th className="px-5 py-4 text-left">Capacity</th>
                                                <th className="px-5 py-4 text-left">Registered</th>
                                                <th className="px-5 py-4 text-left">Checked-in</th>
                                                <th className="px-5 py-4 text-left">Attendance Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {paginatedBreakoutSessions.map((session) => (
                                                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{session.name}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.speaker}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.room}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.capacity}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.registered}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.checkedIn}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{session.attendanceRate}%</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                <TablePaginationControls
                                    totalItems={filteredBreakoutSessions.length}
                                    currentPage={breakoutPage}
                                    rowsPerPage={breakoutRowsPerPage}
                                    onPageChange={setBreakoutPage}
                                    onRowsPerPageChange={(rows) => {
                                        setBreakoutRowsPerPage(rows);
                                        setBreakoutPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Feedback Tab */}
                    {activeTab === 'feedback' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard title="Total Responses" value={feedbackResponses.length} />
                                <StatCard title="Total Questions" value={questionAnalysis.length} />
                                <StatCard title="Latest Submission" value={feedbackResponses.length > 0 ? new Date(feedbackResponses[0].submittedAt).toLocaleDateString() : 'N/A'} />
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFeedbackView('summary')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            feedbackView === 'summary'
                                                ? 'bg-[#3D518C] text-white'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <BarChart3 size={16} />
                                        Summary
                                    </button>
                                    <button
                                        onClick={() => setFeedbackView('individual')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            feedbackView === 'individual'
                                                ? 'bg-[#3D518C] text-white'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <List size={16} />
                                        Individual
                                    </button>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 px-3">
                                    {feedbackView === 'summary' ? (
                                        <span>Viewing question-by-question analysis</span>
                                    ) : (
                                        <span>Viewing {filteredFeedbackResponses.length} individual responses</span>
                                    )}
                                </div>
                            </div>

                            {/* Summary View */}
                            {feedbackView === 'summary' && (
                                <div className="space-y-6">
                                    {/* Question Filter */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1 max-w-md">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={feedbackQuestionFilter}
                                                onChange={(e) => setFeedbackQuestionFilter(e.target.value)}
                                                placeholder="Search questions..."
                                                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                            />
                                        </div>
                                        {feedbackQuestionFilter && (
                                            <button
                                                onClick={() => setFeedbackQuestionFilter('')}
                                                className="text-sm text-[#3D518C] dark:text-[#ABD2FA] hover:underline"
                                            >
                                                Clear filter
                                            </button>
                                        )}
                                    </div>

                                    {/* Question Cards */}
                                    {filteredQuestionAnalysis.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                            <PieChartIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {feedbackQuestionFilter ? 'No questions match your filter.' : 'No feedback responses yet.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {filteredQuestionAnalysis.map((q, qIdx) => (
                                                <div key={qIdx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-relaxed">
                                                                {q.question}
                                                            </h3>
                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full shrink-0">
                                                                {q.total} responses
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                                                            Type: {q.inputFormat.replace(/_/g, ' ')}
                                                        </p>
                                                    </div>

                                                    <div className="p-5">
                                                        {/* Chart for multiple choice, dropdown, radio */}
                                                        {(q.inputFormat === 'multiple_choice' || q.inputFormat === 'dropdown' || q.inputFormat === 'radio' || q.distribution.length <= 10) && q.distribution.length > 0 && (
                                                            <div className="h-48 mb-4">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={q.distribution} layout="vertical" margin={{ left: 80, right: 30, top: 5, bottom: 5 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                                                        <XAxis type="number" hide />
                                                                        <YAxis
                                                                            dataKey="answer"
                                                                            type="category"
                                                                            width={70}
                                                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                                                            interval={0}
                                                                            tickFormatter={(value: string) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                                                                        />
                                                                        <Tooltip
                                                                            contentStyle={{
                                                                                backgroundColor: 'white',
                                                                                border: '1px solid #e5e7eb',
                                                                                borderRadius: '8px',
                                                                                fontSize: '12px'
                                                                            }}
                                                                            formatter={(value: any, name: any, props: any) => [
                                                                                `${value} (${props.payload.percentage}%)`,
                                                                                'Count'
                                                                            ]}
                                                                        />
                                                                        <Bar dataKey="count" fill="#3D518C" radius={[0, 4, 4, 0]}>
                                                                            {q.distribution.map((entry, index) => (
                                                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                                            ))}
                                                                        </Bar>
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        )}

                                                        {/* Distribution Table */}
                                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                                            {q.distribution.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full shrink-0"
                                                                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={item.answer}>
                                                                                {item.answer}
                                                                            </span>
                                                                            <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">
                                                                                {item.count}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full rounded-full transition-all"
                                                                                    style={{
                                                                                        width: `${item.percentage}%`,
                                                                                        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                                                                                {item.percentage}%
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Individual View */}
                            {feedbackView === 'individual' && (
                                <div className="space-y-4">
                                    {/* Search */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by submitter name or email"
                                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                            />
                                        </div>
                                    </div>

                                    {/* Row Count */}
                                    <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
                                        Displaying paginated rows. Use the table controls to navigate.
                                    </div>

                                    {/* Table */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-[#ABD2FA] dark:bg-[#3D518C]">
                                                    <tr className="text-xs text-gray-700 dark:text-white font-semibold uppercase tracking-wider">
                                                        <th className="px-5 py-4 text-left">Submitter</th>
                                                        <th className="px-5 py-4 text-left">Email</th>
                                                        <th className="px-5 py-4 text-left">Submitted At</th>
                                                        <th className="px-5 py-4 text-left">Responses</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {paginatedFeedback.map((response) => (
                                                        <tr key={response.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{response.submitterName}</td>
                                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{response.submitterEmail}</td>
                                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(response.submittedAt).toLocaleString()}</td>
                                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                                <div className="space-y-1">
                                                                    {response.answers.map((answer, idx) => (
                                                                        <div key={idx} className="text-xs">
                                                                            <span className="font-medium">{answer.question}:</span> {answer.answer}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <TablePaginationControls
                                            totalItems={filteredFeedbackResponses.length}
                                            currentPage={feedbackPage}
                                            rowsPerPage={feedbackRowsPerPage}
                                            onPageChange={setFeedbackPage}
                                            onRowsPerPageChange={(rows) => {
                                                setFeedbackRowsPerPage(rows);
                                                setFeedbackPage(1);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}
