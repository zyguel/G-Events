"use client";

import React, { useCallback, useEffect, useState } from 'react';

import { Search, Filter, MoreVertical, CheckCircle, Clock, ChevronDown, UserCheck, UserX, Eye, Presentation } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { CheckInScanPanel } from '@/components/admin/checkin/CheckInScanPanel';
import { EventSummary } from '@/lib/types';
import TablePaginationControls from '@/components/admin/TablePaginationControls';

// --- Types ---
interface Attendee {
    registrationId: string;
    name: string;
    email: string;
    ticketType: string;
    status: 'Checked-In' | 'Not Yet Checked-In';
    checkInTime?: string;
    totalAddOnQty?: number;
    claimableAddOnQty?: number;
    addOnClaimStatus?: 'None' | 'Claimed' | 'Unclaimed';
    claimableAddOns?: Array<{
        entitlementId: number;
        variantId: number;
        addOnName: string;
        variantLabel: string;
        remainingQty: number;
    }>;
}

interface CheckInClientProps {
    event: EventSummary;
}

interface BreakoutRosterRow {
    breakoutRegistrationId: number;
    registrationId: string;
    name: string;
    email: string;
    ticketType: string;
    sessionId: number;
    sessionTitle: string;
    registrationStatus: string;
    breakoutCheckedIn: boolean;
    breakoutCheckInTime: string | null;
}

const FILTER_OPTIONS: Array<'All' | 'Checked-In' | 'Not Yet Checked-In'> = [
    'All',
    'Checked-In',
    'Not Yet Checked-In',
];

// --- Mock Data ---
const INITIAL_ATTENDEES: Attendee[] = [
    { registrationId: "20240502000002", name: "Karylle Bernate", email: "karyllebernate8@gmail.com", ticketType: "General Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000001", name: "Vinz Villarin", email: "vinzvillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In" },
    { registrationId: "20240502000003", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000004", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000005", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000006", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000007", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In", checkInTime: "2025-06-01 09:20 AM" },
];

export default function CheckInClient({ event }: CheckInClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    // Use mock attendees only for local draft events.
    const [attendees, setAttendees] = useState<Attendee[]>(event.id.startsWith('evt-') ? INITIAL_ATTENDEES : []);
    const [isLoading, setIsLoading] = useState(!event.id.startsWith('evt-'));
    const [error, setError] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'All' | 'Checked-In' | 'Not Yet Checked-In'>('All');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    // Action Menu State
    const [openActionId, setOpenActionId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [listTab, setListTab] = useState<'main' | 'breakout' | 'addons'>('main');
    const [breakoutRoster, setBreakoutRoster] = useState<BreakoutRosterRow[]>([]);
    const [breakoutLoading, setBreakoutLoading] = useState(false);
    const [breakoutError, setBreakoutError] = useState<string | null>(null);

    const loadAttendees = useCallback(async () => {
        if (event.id.startsWith('evt-')) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch(`/api/events/${event.id}/checkin`);
            if (!res.ok) {
                throw new Error(`Failed to load attendees (${res.status})`);
            }
            const json = await res.json();
            if (json?.success && Array.isArray(json.data)) {
                setAttendees(
                    json.data.map((row: unknown) => {
                        const candidate = (row && typeof row === 'object'
                            ? row
                            : {}) as Partial<Attendee> & {
                                totalAddOnQty?: unknown;
                                claimableAddOnQty?: unknown;
                                addOnClaimStatus?: unknown;
                                claimableAddOns?: unknown;
                            };

                        const totalAddOnQty = Number(candidate.totalAddOnQty || 0);
                        const claimableAddOnQty = Number(candidate.claimableAddOnQty || 0);
                        const addOnClaimStatus =
                            candidate.addOnClaimStatus === 'Claimed' || candidate.addOnClaimStatus === 'Unclaimed' || candidate.addOnClaimStatus === 'None'
                                ? candidate.addOnClaimStatus
                                : totalAddOnQty <= 0
                                    ? 'None'
                                    : claimableAddOnQty > 0
                                        ? 'Unclaimed'
                                        : 'Claimed';
                        return {
                            registrationId: String(candidate.registrationId || ''),
                            name: String(candidate.name || 'Unknown'),
                            email: String(candidate.email || ''),
                            ticketType: String(candidate.ticketType || 'General Admission'),
                            status: candidate.status === 'Checked-In' ? 'Checked-In' : 'Not Yet Checked-In',
                            checkInTime: typeof candidate.checkInTime === 'string' ? candidate.checkInTime : undefined,
                            totalAddOnQty,
                            claimableAddOnQty,
                            addOnClaimStatus,
                            claimableAddOns: Array.isArray(candidate.claimableAddOns)
                                ? (candidate.claimableAddOns as NonNullable<Attendee['claimableAddOns']>)
                                : [],
                        };
                    })
                );
            } else {
                throw new Error(json?.error || "Unexpected response format");
            }
        } catch (e) {
            console.error("Error loading check-in attendees:", e);
            setError(e instanceof Error ? e.message : "Failed to load attendees");
        } finally {
            setIsLoading(false);
        }
    }, [event.id]);

    const loadBreakoutRoster = useCallback(async () => {
        if (event.id.startsWith('evt-')) {
            setBreakoutRoster([]);
            return;
        }
        try {
            setBreakoutLoading(true);
            setBreakoutError(null);
            const res = await fetch(`/api/events/${event.id}/checkin/breakout-roster`);
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed to load breakout roster (${res.status})`);
            }
            setBreakoutRoster(Array.isArray(json.data) ? json.data : []);
        } catch (e) {
            console.error(e);
            setBreakoutError(e instanceof Error ? e.message : 'Failed to load breakout roster');
            setBreakoutRoster([]);
        } finally {
            setBreakoutLoading(false);
        }
    }, [event.id]);

    const refreshAttendance = useCallback(async () => {
        await loadAttendees();

        if (!event.id.startsWith('evt-') && listTab === 'breakout') {
            await loadBreakoutRoster();
        }
    }, [event.id, listTab, loadAttendees, loadBreakoutRoster]);

    useEffect(() => {
        void loadAttendees();
    }, [loadAttendees]);

    useEffect(() => {
        if (event.id.startsWith('evt-')) {
            return;
        }

        if (listTab !== 'breakout') {
            return;
        }

        void loadBreakoutRoster();
    }, [event.id, listTab, loadBreakoutRoster]);

    // --- Actions ---
    const handleCheckInToggle = async (registrationId: string) => {
        const target = attendees.find(att => att.registrationId === registrationId);
        if (!target) return;

        const nextStatus = target.status === 'Checked-In' ? 'Not Yet Checked-In' : 'Checked-In';
        const nextTime = nextStatus === 'Checked-In' ? new Date().toLocaleString() : undefined;

        setAttendees(prev => prev.map(att =>
            att.registrationId === registrationId
                ? { ...att, status: nextStatus, checkInTime: nextTime }
                : att
        ));
        setOpenActionId(null);

        if (event.id.startsWith('evt-')) return;

        try {
            setUpdatingId(registrationId);
            const res = await fetch(`/api/events/${event.id}/checkin/${registrationId}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ checkedIn: nextStatus === 'Checked-In' }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed to update check-in (${res.status})`);
            }
        } catch (e) {
            console.error("Error updating check-in:", e);
            // Roll back optimistic update
            setAttendees(prev => prev.map(att =>
                att.registrationId === registrationId
                    ? { ...att, status: target.status, checkInTime: target.checkInTime }
                    : att
            ));
            setError(e instanceof Error ? e.message : "Failed to update check-in");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleClaimAddOns = async (registrationId: string) => {
        const target = attendees.find(att => att.registrationId === registrationId);
        if (!target) return;

        const claimableQty = Number(target.claimableAddOnQty || 0);
        if (claimableQty <= 0) {
            setOpenActionId(null);
            return;
        }

        const claimableItems = (target.claimableAddOns || []).filter(
            (item) => Number(item.remainingQty || 0) > 0
        );

        if (claimableItems.length !== 1) {
            setError('Multiple add-ons are pending for this ticket. Use the scanner to claim each add-on variant separately.');
            setOpenActionId(null);
            return;
        }

        const variantId = Number(claimableItems[0].variantId);

        if (event.id.startsWith('evt-')) {
            setAttendees(prev => prev.map(att =>
                att.registrationId === registrationId
                    ? {
                        ...att,
                        claimableAddOnQty: 0,
                        addOnClaimStatus: 'Claimed',
                        claimableAddOns: [],
                    }
                    : att
            ));
            setOpenActionId(null);
            return;
        }

        try {
            setClaimingId(registrationId);
            const res = await fetch(`/api/events/${event.id}/checkin/${registrationId}/claim-addon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station: 'checkin_list', variantId }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed to claim add-ons (${res.status})`);
            }

            setAttendees(prev => prev.map(att =>
                att.registrationId === registrationId
                    ? {
                        ...att,
                        claimableAddOnQty: 0,
                        addOnClaimStatus: 'Claimed',
                        claimableAddOns: [],
                    }
                    : att
            ));
            setOpenActionId(null);
        } catch (e) {
            console.error('Error claiming add-ons:', e);
            setError(e instanceof Error ? e.message : 'Failed to claim add-ons');
        } finally {
            setClaimingId(null);
        }
    };

    // --- Filtering ---
    const filteredAttendees = attendees.filter(attendee => {
        const matchesSearch =
            attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.registrationId.includes(searchQuery);

        const matchesFilter = activeFilter === 'All' || attendee.status === activeFilter;

        return matchesSearch && matchesFilter;
    });

    const filteredClaimableAttendees = attendees.filter((attendee) => {
        const matchesSearch =
            attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.registrationId.includes(searchQuery);

        return matchesSearch && Number(attendee.claimableAddOnQty || 0) > 0;
    });

    const paginatedAttendees = filteredAttendees.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const paginatedClaimableAttendees = filteredClaimableAttendees.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter, listTab]);

    useEffect(() => {
        const activeCount = listTab === 'addons' ? filteredClaimableAttendees.length : filteredAttendees.length;
        const totalPages = Math.max(1, Math.ceil(activeCount / rowsPerPage));
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, filteredAttendees.length, filteredClaimableAttendees.length, listTab, rowsPerPage]);

    const stats = {
        total: attendees.length,
        checkedIn: attendees.filter(a => a.status === 'Checked-In').length,
        pending: attendees.filter(a => a.status === 'Not Yet Checked-In').length
    };

    const claimableVariantCount = (attendee: Attendee): number =>
        (attendee.claimableAddOns || []).filter((item) => Number(item.remainingQty || 0) > 0).length;

    const addOnLabel = (attendee: Attendee): string => {
        const total = Number(attendee.totalAddOnQty || 0);
        const claimable = Number(attendee.claimableAddOnQty || 0);

        if (total <= 0) return 'No add-ons';
        if (claimable > 0) return `${claimable} to claim`;
        return 'Claimed';
    };

    const addOnLabelStyle = (attendee: Attendee): string => {
        const total = Number(attendee.totalAddOnQty || 0);
        const claimable = Number(attendee.claimableAddOnQty || 0);

        if (total <= 0) {
            return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/20';
        }

        if (claimable > 0) {
            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
        }

        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
    };

    // --- UI Components ---

    return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30 transition-colors duration-300 relative">

            {/* Background Glow Effects (Dark Mode Only) - Adjusted to blend with gray theme */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-0 dark:opacity-50 transition-opacity duration-500">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="p-4 sm:p-6 lg:p-8 relative z-10 pb-24 lg:pb-8">
                <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500">
                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                <UserCheck className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                    Check-In
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    Scan QR on mobile or manage the attendee list below
                                </p>
                            </div>
                        </div>
                    </div>

                    {!event.id.startsWith('evt-') && (
                        <CheckInScanPanel
                            eventId={event.id}
                            onAttendanceChanged={refreshAttendance}
                            workflow={listTab === 'addons' ? 'addon_claims' : 'checkin'}
                        />
                    )}

                    {/* Stats Section */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{stats.checkedIn}</span> Checked In
                        </div>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{stats.pending}</span> Pending
                        </div>
                    </div>

                    {!event.id.startsWith('evt-') ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setListTab('main')}
                                className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold transition touch-manipulation ${
                                    listTab === 'main'
                                        ? 'bg-[#3D518C] text-white shadow-md'
                                        : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                                }`}
                            >
                                Main event attendees
                            </button>
                            <button
                                type="button"
                                onClick={() => setListTab('breakout')}
                                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition touch-manipulation ${
                                    listTab === 'breakout'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                                }`}
                            >
                                <Presentation size={16} />
                                Breakout seats
                            </button>
                            <button
                                type="button"
                                onClick={() => setListTab('addons')}
                                className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold transition touch-manipulation ${
                                    listTab === 'addons'
                                        ? 'bg-amber-500 text-gray-900 shadow-md'
                                        : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                                }`}
                            >
                                Add-on claims
                            </button>
                        </div>
                    ) : (
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 pt-2">
                            Attendee list
                        </h2>
                    )}

                    {event.id.startsWith('evt-') ? null : listTab === 'breakout' ? (
                        <div className="space-y-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 sm:p-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                Breakout session roster
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Everyone who chose a breakout seat. Use <strong>Breakout only</strong> scan mode above to check them in with their breakout QR.
                            </p>
                            {breakoutError ? (
                                <p className="text-sm text-red-600 dark:text-red-300">{breakoutError}</p>
                            ) : null}
                            {breakoutLoading ? (
                                <p className="text-sm text-gray-500 py-6 text-center">Loading breakout roster…</p>
                            ) : breakoutRoster.length === 0 ? (
                                <p className="text-sm text-gray-500 py-6 text-center">No breakout seat assignments yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-[min(70vh,520px)] overflow-y-auto pr-1">
                                    {breakoutRoster.map((row) => (
                                        <div
                                            key={`${row.breakoutRegistrationId}-${row.registrationId}`}
                                            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 p-3 sm:p-4"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{row.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{row.email}</p>
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                                                        {row.sessionTitle}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        Reg #{row.registrationId} · {row.ticketType}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 self-start text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                                        row.breakoutCheckedIn
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                    }`}
                                                >
                                                    {row.breakoutCheckedIn ? 'Breakout in' : 'Breakout pending'}
                                                </span>
                                            </div>
                                            {row.breakoutCheckInTime ? (
                                                <p className="text-[11px] text-gray-500 mt-2">{row.breakoutCheckInTime}</p>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {listTab === 'main' || event.id.startsWith('evt-') ? (
                    <>
                    {!event.id.startsWith('evt-') ? (
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 pt-2">
                            Main event list
                        </h2>
                    ) : null}

                    {/* Controls Bar */}
                    <div className="glass-panel p-1.5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 backdrop-blur-xl shadow-sm transition-all duration-300 relative z-30">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Name, or Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none rounded-xl"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto p-1">
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${isFilterOpen || activeFilter !== 'All'
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-gray-100/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Filter size={16} />
                                    <span>{activeFilter === 'All' ? 'Filter' : activeFilter}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Filter Dropdown */}
                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1.5 z-20 flex flex-col gap-1 backdrop-blur-3xl origin-top-right ring-1 ring-black/5"
                                            >
                                                {FILTER_OPTIONS.map((filter) => (
                                                    <button
                                                        key={filter}
                                                        onClick={() => {
                                                            setActiveFilter(filter);
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === filter
                                                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        {filter}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-4 py-2.5 bg-gray-100/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-all"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Data Table + mobile cards */}
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden shadow-sm transition-colors duration-300">
                        {error && (
                            <div className="px-4 sm:px-6 pt-4 sm:pt-6 text-sm text-red-600 dark:text-red-300">{error}</div>
                        )}

                        {/* Mobile list */}
                        <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700 p-2 space-y-2">
                            {isLoading ? (
                                <p className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">Loading attendees…</p>
                            ) : filteredAttendees.length === 0 ? (
                                <p className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">No attendees match</p>
                            ) : (
                                filteredAttendees.map((attendee) => (
                                    <div
                                        key={attendee.registrationId}
                                        className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-4 space-y-2"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-white truncate">{attendee.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{attendee.email}</p>
                                            </div>
                                            <span
                                                className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                                    attendee.status === 'Checked-In'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                }`}
                                            >
                                                {attendee.status === 'Checked-In' ? 'In' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            #{attendee.registrationId} · {attendee.ticketType}
                                        </p>
                                        <p className={`text-[11px] font-semibold ${Number(attendee.claimableAddOnQty || 0) > 0
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : Number(attendee.totalAddOnQty || 0) > 0
                                                ? 'text-emerald-700 dark:text-emerald-300'
                                                : 'text-gray-600 dark:text-gray-300'
                                            }`}>
                                            {Number(attendee.totalAddOnQty || 0) <= 0
                                                ? 'No add-ons purchased'
                                                : Number(attendee.claimableAddOnQty || 0) > 0
                                                    ? `${attendee.claimableAddOnQty} add-on${Number(attendee.claimableAddOnQty || 0) > 1 ? 's' : ''} ready to claim`
                                                    : 'Add-ons claimed'}
                                        </p>
                                        <button
                                            type="button"
                                            disabled={updatingId === attendee.registrationId || claimingId === attendee.registrationId}
                                            onClick={() => handleCheckInToggle(attendee.registrationId)}
                                            className="w-full min-h-[44px] rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                                        >
                                            {attendee.status === 'Checked-In' ? 'Undo check-in' : 'Check in'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 transition-colors">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                                    <tr>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Registration ID</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Name</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Email</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Ticket Type</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Status</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Add-Ons</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Time</th>
                                        <th className="px-6 py-5 text-center text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-20 text-center text-gray-500 dark:text-gray-400">
                                                Loading attendees...
                                            </td>
                                        </tr>
                                    ) : filteredAttendees.length > 0 ? (
                                        paginatedAttendees.map((attendee) => (
                                            <tr
                                                key={attendee.registrationId}
                                                className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                                            >
                                                <td className="px-6 py-4 font-mono text-indigo-700 dark:text-indigo-300/80 whitespace-nowrap">{attendee.registrationId}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{attendee.name}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{attendee.email}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{attendee.ticketType}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md ${attendee.status === 'Checked-In'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                        }`}>
                                                        {attendee.status === 'Checked-In' ? (
                                                            <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-500" />
                                                        ) : (
                                                            <Clock size={12} className="text-amber-600 dark:text-amber-500" />
                                                        )}
                                                        {attendee.status}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${addOnLabelStyle(attendee)}`}>
                                                        {addOnLabel(attendee)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-500 text-xs whitespace-nowrap">
                                                    {attendee.checkInTime || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex justify-center relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionId(openActionId === attendee.registrationId ? null : attendee.registrationId);
                                                            }}
                                                            className={`p-2 rounded-lg transition-colors ${openActionId === attendee.registrationId
                                                                ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                                                                : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                                }`}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>

                                                        {/* Actions Dropdown */}
                                                        <AnimatePresence>
                                                            {openActionId === attendee.registrationId && (
                                                                <>
                                                                    <div className="fixed inset-0 z-30" onClick={() => setOpenActionId(null)} />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                                                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="absolute right-8 top-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1 z-40 flex flex-col backdrop-blur-3xl origin-top-right ring-1 ring-black/5"
                                                                    >
                                                                        <button
                                                                            onClick={() => handleCheckInToggle(attendee.registrationId)}
                                                                            disabled={updatingId === attendee.registrationId || claimingId === attendee.registrationId}
                                                                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                                                                        >
                                                                            {attendee.status === 'Checked-In' ? (
                                                                                <>
                                                                                    <UserX size={16} className="text-rose-500 dark:text-rose-400" />
                                                                                    Undo Check-In
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <UserCheck size={16} className="text-emerald-500 dark:text-emerald-400" />
                                                                                    Check In User
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                        <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                                                                            <Eye size={16} className="text-blue-500 dark:text-blue-400" />
                                                                            View Details
                                                                        </button>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                                                    <Search size={40} strokeWidth={1.5} className="opacity-50" />
                                                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No attendees found</p>
                                                    <p className="text-sm">Try adjusting your search or filter</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <TablePaginationControls
                            totalItems={filteredAttendees.length}
                            currentPage={currentPage}
                            rowsPerPage={rowsPerPage}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={(rows) => {
                                setRowsPerPage(rows);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    </>
                    ) : null}

                    {!event.id.startsWith('evt-') && listTab === 'addons' ? (
                        <>
                            <div className="space-y-2 pt-2">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                                    Add-on claims queue
                                </h2>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Use the scanner above to claim from the attendee ticket QR, or claim manually from this list.
                                </p>
                            </div>

                            <div className="glass-panel p-1.5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 backdrop-blur-xl shadow-sm transition-all duration-300 relative z-30">
                                <div className="relative flex-1 w-full group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-amber-600 transition-colors w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search claim queue by ID, name, or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none rounded-xl"
                                    />
                                </div>
                                {searchQuery ? (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="px-4 py-2.5 bg-gray-100/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-all"
                                    >
                                        Clear
                                    </button>
                                ) : null}
                            </div>

                            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden shadow-sm transition-colors duration-300">
                                {error ? (
                                    <div className="px-4 sm:px-6 pt-4 sm:pt-6 text-sm text-red-600 dark:text-red-300">{error}</div>
                                ) : null}

                                <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700 p-2 space-y-2">
                                    {isLoading ? (
                                        <p className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">Loading claim queue…</p>
                                    ) : filteredClaimableAttendees.length === 0 ? (
                                        <p className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">No claimable add-ons found</p>
                                    ) : (
                                        paginatedClaimableAttendees.map((attendee) => (
                                            <div
                                                key={attendee.registrationId}
                                                className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-800/60 p-4 space-y-2"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{attendee.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{attendee.email}</p>
                                                    </div>
                                                    <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                        {attendee.claimableAddOnQty} to claim
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    #{attendee.registrationId} · {attendee.ticketType}
                                                </p>
                                                {claimableVariantCount(attendee) > 1 ? (
                                                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                                        Multiple variants pending. Use scanner to claim each variant separately.
                                                    </p>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    disabled={
                                                        claimingId === attendee.registrationId ||
                                                        updatingId === attendee.registrationId ||
                                                        claimableVariantCount(attendee) > 1
                                                    }
                                                    onClick={() => void handleClaimAddOns(attendee.registrationId)}
                                                    className="w-full min-h-[44px] rounded-xl text-sm font-bold bg-amber-400 text-gray-900 hover:bg-amber-300 disabled:opacity-50"
                                                >
                                                    {claimingId === attendee.registrationId
                                                        ? 'Claiming add-ons...'
                                                        : claimableVariantCount(attendee) > 1
                                                            ? 'Use scanner for variant claims'
                                                            : `Claim add-on${Number(attendee.claimableAddOnQty || 0) > 1 ? 's' : ''}`}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-amber-300 dark:[&::-webkit-scrollbar-thumb]:bg-amber-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-amber-600 transition-colors">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-800/60 transition-colors duration-300">
                                            <tr>
                                                <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Registration ID</th>
                                                <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Name</th>
                                                <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Email</th>
                                                <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Ticket Type</th>
                                                <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Claimable</th>
                                                <th className="px-6 py-5 text-center text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500 dark:text-gray-400">
                                                        Loading claim queue...
                                                    </td>
                                                </tr>
                                            ) : filteredClaimableAttendees.length > 0 ? (
                                                paginatedClaimableAttendees.map((attendee) => (
                                                    <tr
                                                        key={attendee.registrationId}
                                                        className="group hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors duration-200"
                                                    >
                                                        <td className="px-6 py-4 font-mono text-amber-700 dark:text-amber-300 whitespace-nowrap">{attendee.registrationId}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{attendee.name}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{attendee.email}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{attendee.ticketType}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                                                                {attendee.claimableAddOnQty} to claim
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    claimingId === attendee.registrationId ||
                                                                    updatingId === attendee.registrationId ||
                                                                    claimableVariantCount(attendee) > 1
                                                                }
                                                                onClick={() => void handleClaimAddOns(attendee.registrationId)}
                                                                className="min-h-[40px] px-4 rounded-lg bg-amber-400 text-gray-900 hover:bg-amber-300 text-sm font-bold disabled:opacity-50"
                                                            >
                                                                {claimingId === attendee.registrationId
                                                                    ? 'Claiming...'
                                                                    : claimableVariantCount(attendee) > 1
                                                                        ? 'Use scanner'
                                                                        : `Claim add-on${Number(attendee.claimableAddOnQty || 0) > 1 ? 's' : ''}`}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                                                            <Search size={40} strokeWidth={1.5} className="opacity-50" />
                                                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No add-on claims pending</p>
                                                            <p className="text-sm">Everyone is already claimed or no add-ons were purchased</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <TablePaginationControls
                                    totalItems={filteredClaimableAttendees.length}
                                    currentPage={currentPage}
                                    rowsPerPage={rowsPerPage}
                                    onPageChange={setCurrentPage}
                                    onRowsPerPageChange={(rows) => {
                                        setRowsPerPage(rows);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
