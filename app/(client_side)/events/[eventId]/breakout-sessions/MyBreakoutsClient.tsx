"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Calendar, Clock, MapPin, Video, Users, UserRound,
    CheckCircle2, AlertCircle, ChevronLeft, Building2, ExternalLink, Loader2, Lock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import ClientHeader from '@/components/client/ClientHeader';

interface Speaker {
    name: string;
}

interface BreakoutSession {
    id: string;
    title: string;
    type: 'Online' | 'In-Person';
    status: string;
    date: string;
    time: string;
    location: string;
    joinLink: string;
    currentAttendees: number;
    maxCapacity: number;
    speakers: Speaker[];
    isJoined: boolean;
}

interface MyBreakoutsClientProps {
    event: {
        id: number;
        slug: string;
        title: string;
    };
    initialSessions: BreakoutSession[];
}

export default function MyBreakoutsClient({ event, initialSessions }: MyBreakoutsClientProps) {
    const router = useRouter();
    const [sessions, setSessions] = useState<BreakoutSession[]>(initialSessions);
    const [activeTab, setActiveTab] = useState<'all' | 'joined'>('all');
    const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmSession, setConfirmSession] = useState<BreakoutSession | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const filteredSessions = useMemo(() => {
        if (activeTab === 'joined') {
            return sessions.filter(s => s.isJoined);
        }
        return sessions;
    }, [sessions, activeTab]);

    // Group by Date for better visual organization
    const groupedSessions = useMemo(() => {
        const groups: Record<string, BreakoutSession[]> = {};
        filteredSessions.forEach(session => {
            const d = session.date || 'TBD';
            if (!groups[d]) groups[d] = [];
            groups[d].push(session);
        });

        // Sort by time within groups
        for (const date in groups) {
            groups[date].sort((a, b) => {
                const parseTime = (t: string) => {
                    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!match) return 0;
                    let hrs = parseInt(match[1]);
                    const mins = parseInt(match[2]);
                    if (match[3].toUpperCase() === 'PM' && hrs < 12) hrs += 12;
                    if (match[3].toUpperCase() === 'AM' && hrs === 12) hrs = 0;
                    return hrs * 60 + mins;
                };
                return parseTime(a.time) - parseTime(b.time);
            });
        }
        return groups;
    }, [filteredSessions]);

    const hasJoinedSession = useMemo(() => sessions.some(s => s.isJoined), [sessions]);

    const handleToggleJoin = async (session: BreakoutSession) => {
        setConfirmSession(session);
    };

    const executeToggle = async (session: BreakoutSession) => {
        setError(null);
        setConfirmSession(null);
        setLoadingSessionId(session.id);
        const action = session.isJoined ? 'leave' : 'join';

        try {
            const res = await fetch(`/api/events/${event.id}/my-breakouts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, sessionId: session.id })
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || `Failed to ${action} session`);
            }

            // Optimistic update
            setSessions(prev => prev.map(s => {
                if (s.id === session.id) {
                    return {
                        ...s,
                        isJoined: !s.isJoined,
                        currentAttendees: s.isJoined ? Math.max(0, s.currentAttendees - 1) : s.currentAttendees + 1
                    };
                }
                return s;
            }));

            if (action === 'join') {
                setShowSuccessModal(true);
            } else {
                // Refresh to ensure full sync on leave
                router.refresh();
            }

        } catch (err: any) {
            console.error('Error toggling join status:', err);
            setError(err.message);
            // Hide error after 5s
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoadingSessionId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] font-sans selection:bg-[#3D518C] selection:text-white pb-20">
            <ClientHeader />

            {/* Error Toast */}
            {error && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-5">
                    <AlertCircle size={20} />
                    <p className="font-medium text-sm">{error}</p>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

                {/* Back button & Header */}
                <div className="mb-8">
                    <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#3D518C] dark:hover:text-[#ABD2FA] transition-colors mb-6 group"
                    >
                        <span className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-gray-100 dark:border-gray-800">
                            <ChevronLeft size={16} />
                        </span>
                        Back to Event
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                                Breakout Sessions
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl">
                                Select and manage the smaller interactive sessions you want to attend during <span className="font-semibold text-gray-900 dark:text-gray-200">{event.title}</span>.
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-fit">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'all'
                                    ? 'bg-[#3D518C] text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                All Sessions
                            </button>
                            <button
                                onClick={() => setActiveTab('joined')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'joined'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                My Schedule
                            </button>
                        </div>
                    </div>
                </div>

                {/* Session List */}
                {Object.keys(groupedSessions).length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No sessions found</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            {activeTab === 'joined'
                                ? "You haven't joined any breakout sessions yet. Browse all sessions to build your schedule!"
                                : "There are currently no breakout sessions available for this event."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(groupedSessions).map(([date, groupSessions]) => {
                            let displayDate = date;
                            try {
                                if (date !== 'TBD' && date !== '') {
                                    displayDate = format(parseISO(date), 'EEEE, MMMM do, yyyy');
                                }
                            } catch (e) {
                                // ignore
                            }

                            return (
                            <div key={date} className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#3D518C] dark:bg-blue-900 px-4 py-1.5 rounded-full shadow-sm shadow-[#3D518C]/20 text-white">
                                        <h2 className="text-sm font-bold tracking-wide">{displayDate}</h2>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-[#3D518C]/40 to-transparent flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {groupSessions.map(session => {
                                        const isFull = session.maxCapacity > 0 && session.currentAttendees >= session.maxCapacity;
                                        const isUnavailable = session.status === "Completed" || session.status === "Cancelled";
                                        const canJoin = !session.isJoined && !isFull && !isUnavailable;
                                        const progressPercentage = session.maxCapacity > 0 ? Math.min(100, Math.round((session.currentAttendees / session.maxCapacity) * 100)) : 0;

                                        return (
                                            <div
                                                key={session.id}
                                                className={`bg-white dark:bg-gray-800/70 rounded-2xl p-4 border-2 transition-all duration-300 relative overflow-hidden group
                                                    ${session.isJoined
                                                        ? 'border-emerald-500 shadow-md shadow-emerald-500/10 dark:shadow-emerald-900/20 bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-800 dark:to-emerald-900/10'
                                                        : 'border-transparent shadow-md shadow-gray-200/40 dark:shadow-black/20 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80'
                                                    }
                                                `}
                                            >
                                                {/* Joined Indicator Banner */}
                                                {session.isJoined && (
                                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                                        <CheckCircle2 size={11} /> Joined
                                                    </div>
                                                )}

                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <h3 className="text-base font-bold text-[#2e3e6b] dark:text-white leading-tight line-clamp-2">
                                                            {session.title || "Untitled Session"}
                                                        </h3>
                                                    </div>

                                                    {/* Details Grid */}
                                                    <div className="flex flex-col gap-1.5 text-xs text-gray-600 dark:text-gray-300 mb-3 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={12} className="text-[#3D518C] dark:text-blue-400 shrink-0" />
                                                            {session.time
                                                                ? <span className="font-medium text-gray-700 dark:text-gray-200">{session.time}</span>
                                                                : <span className="text-gray-400 italic">Time TBD</span>
                                                            }
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {session.type === 'Online'
                                                                ? <Video size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                : <Building2 size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
                                                            }
                                                            <span className="font-semibold text-gray-800 dark:text-white">{session.type}</span>
                                                            {session.type === 'In-Person' && session.location && (
                                                                <span className="text-gray-400 truncate">· {session.location}</span>
                                                            )}
                                                        </div>
                                                        {session.speakers.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <UserRound size={12} className="text-gray-400 shrink-0" />
                                                                <span>{session.speakers.map(s => s.name).join(', ')}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer Actions & Capacity */}
                                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-3 mt-auto">
                                                        {/* Capacity */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between text-[11px] font-semibold mb-1">
                                                                <span className={isFull && !session.isJoined ? 'text-red-500' : 'text-gray-400'}>
                                                                    {session.currentAttendees} / {session.maxCapacity > 0 ? session.maxCapacity : '∞'} attending
                                                                </span>
                                                                {isFull && !session.isJoined && <span className="text-red-500">Full</span>}
                                                            </div>
                                                            {session.maxCapacity > 0 && (
                                                                <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${isFull && !session.isJoined ? 'bg-red-500' : 'bg-blue-500'}`}
                                                                        style={{ width: `${progressPercentage}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-1.5 shrink-0">
                                                            {session.isJoined && session.type === 'Online' && session.joinLink && (
                                                                <a
                                                                    href={session.joinLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1.5 bg-[#ABD2FA] text-[#3D518C] hover:bg-[#9AC2EA] px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                                                >
                                                                    Join Meeting <ExternalLink size={12} />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => handleToggleJoin(session)}
                                                                disabled={loadingSessionId === session.id || (isUnavailable && !session.isJoined) || (!session.isJoined && (isFull || hasJoinedSession))}
                                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5
                                                                    ${loadingSessionId === session.id ? 'opacity-70 cursor-not-allowed' : ''}
                                                                    ${session.isJoined
                                                                        ? 'bg-white text-rose-500 hover:bg-rose-50 dark:bg-gray-800 dark:hover:bg-rose-900/20 border border-rose-400'
                                                                        : isFull || isUnavailable || hasJoinedSession
                                                                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed border border-transparent'
                                                                            : 'bg-[#3D518C] text-white hover:bg-[#2b3a66] border border-[#3D518C]'
                                                                    }
                                                                `}
                                                            >
                                                                {loadingSessionId === session.id && <Loader2 size={12} className="animate-spin" />}
                                                                {!session.isJoined && hasJoinedSession && !isFull && !isUnavailable && <Lock size={12} />}
                                                                {session.isJoined ? 'Leave Session' : isFull ? 'Session Full' : isUnavailable ? 'Unavailable' : hasJoinedSession ? 'Max 1 Session' : 'Join Session'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </main>

            {/* Confirmation Modal (Join / Leave) */}
            {confirmSession && (() => {
                const isLeaving = confirmSession.isJoined;
                return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setConfirmSession(null)}
                    />
                    {/* Modal */}
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
                        {/* Accent bar */}
                        <div className={`h-1 bg-gradient-to-r ${isLeaving ? 'from-rose-500 to-red-400' : 'from-[#3D518C] to-[#5C6BC0]'}`} />

                        <div className="p-6 sm:p-8">
                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg ${
                                isLeaving
                                    ? 'bg-gradient-to-br from-rose-500 to-red-400 shadow-rose-500/20'
                                    : 'bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] shadow-[#3D518C]/20'
                            }`}>
                                {isLeaving
                                    ? <AlertCircle size={26} className="text-white" />
                                    : <Users size={26} className="text-white" />
                                }
                            </div>

                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white text-center mb-2 tracking-tight">
                                {isLeaving ? 'Leave this session?' : 'Join this session?'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                                {isLeaving
                                    ? 'Are you sure you want to leave the following breakout session?'
                                    : 'Are you sure you want to join the following breakout session?'}
                            </p>

                            {/* Session Info Card */}
                            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
                                <h4 className="text-base font-bold text-[#2e3e6b] dark:text-white mb-2">
                                    {confirmSession.title}
                                </h4>
                                <div className="flex flex-col gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                    {confirmSession.time && (
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-[#3D518C] dark:text-blue-400 shrink-0" />
                                            <span className="font-medium">{confirmSession.time}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {confirmSession.type === 'Online'
                                            ? <Video size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            : <Building2 size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
                                        }
                                        <span className="font-semibold">{confirmSession.type}</span>
                                        {confirmSession.location && (
                                            <span className="text-gray-400">· {confirmSession.location}</span>
                                        )}
                                    </div>
                                    {confirmSession.speakers.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <UserRound size={12} className="text-gray-400 shrink-0" />
                                            <span>{confirmSession.speakers.map(s => s.name).join(', ')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Users size={12} className="text-gray-400 shrink-0" />
                                        <span>{confirmSession.currentAttendees} / {confirmSession.maxCapacity > 0 ? confirmSession.maxCapacity : '∞'} attending</span>
                                    </div>
                                </div>
                            </div>

                            {/* Note */}
                            <div className={`rounded-xl px-4 py-2.5 mb-6 border ${
                                isLeaving
                                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40'
                                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'
                            }`}>
                                <p className={`text-xs font-medium ${
                                    isLeaving
                                        ? 'text-rose-700 dark:text-rose-300'
                                        : 'text-amber-700 dark:text-amber-300'
                                }`}>
                                    {isLeaving
                                        ? 'Your spot will be freed for other attendees. You can rejoin later if there’s still capacity.'
                                        : 'You can only join one breakout session per event. You may leave and switch sessions later.'}
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setConfirmSession(null)}
                                    className="flex-1 px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => executeToggle(confirmSession)}
                                    disabled={loadingSessionId === confirmSession.id}
                                    className={`flex-1 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
                                        isLeaving
                                            ? 'bg-gradient-to-r from-rose-500 to-red-400 shadow-rose-500/20 hover:from-rose-600 hover:to-red-500'
                                            : 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] shadow-[#3D518C]/20 hover:from-[#2e3d6e] hover:to-[#4a57a1]'
                                    }`}
                                >
                                    {loadingSessionId === confirmSession.id ? (
                                        <><Loader2 size={15} className="animate-spin" /> {isLeaving ? 'Leaving...' : 'Joining...'}</>
                                    ) : isLeaving ? (
                                        <><AlertCircle size={15} /> Confirm Leave</>
                                    ) : (
                                        <><CheckCircle2 size={15} /> Confirm Join</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                    />
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden text-center p-8">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3">Success!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            You have successfully registered for the breakout session. You can find your e-ticket in email and the tickets tab.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push('/home')}
                            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Okay
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
