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
        setError(null);
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

            // Refresh to ensure full sync
            router.refresh();

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
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                                Breakout Sessions
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
                                Select and manage the smaller interactive sessions you want to attend during <span className="font-semibold text-gray-900 dark:text-gray-200">{event.title}</span>.
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm w-fit">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'all'
                                    ? 'bg-[#3D518C] text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                All Sessions
                            </button>
                            <button
                                onClick={() => setActiveTab('joined')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'joined'
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
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#3D518C] dark:bg-blue-900 px-6 py-2.5 rounded-full shadow-md shadow-[#3D518C]/20 text-white">
                                        <h2 className="text-xl font-black tracking-wide">{displayDate}</h2>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-[#3D518C]/40 to-transparent flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {groupSessions.map(session => {
                                        const isFull = session.maxCapacity > 0 && session.currentAttendees >= session.maxCapacity;
                                        const isUnavailable = session.status === "Completed" || session.status === "Cancelled";
                                        const canJoin = !session.isJoined && !isFull && !isUnavailable;
                                        const progressPercentage = session.maxCapacity > 0 ? Math.min(100, Math.round((session.currentAttendees / session.maxCapacity) * 100)) : 0;

                                        return (
                                            <div
                                                key={session.id}
                                                className={`bg-white dark:bg-gray-800/70 rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 relative overflow-hidden group
                                                    ${session.isJoined
                                                        ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-900/20 bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-800 dark:to-emerald-900/10'
                                                        : 'border-transparent shadow-lg shadow-gray-200/40 dark:shadow-black/20 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80'
                                                    }
                                                `}
                                            >
                                                {/* Joined Indicator Banner */}
                                                {session.isJoined && (
                                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5">
                                                        <CheckCircle2 size={14} /> Joined
                                                    </div>
                                                )}

                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-start justify-between gap-4 mb-6">
                                                        <h3 className="text-2xl font-black text-[#2e3e6b] dark:text-white leading-tight line-clamp-2">
                                                            {session.title || "Untitled Session"}
                                                        </h3>
                                                    </div>

                                                    {/* Details Grid */}
                                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-gray-600 dark:text-gray-300 mb-6 flex-1">
                                                        {session.time ? (
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                                                    <Clock size={16} className="text-[#3D518C] dark:text-blue-400" />
                                                                </div>
                                                                <span dangerouslySetInnerHTML={{ __html: session.time.replace('–', '<br/>') }} className="leading-snug font-medium text-gray-700 dark:text-gray-200" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                                                    <Clock size={16} className="text-gray-400" />
                                                                </div>
                                                                <span className="leading-snug text-gray-400 font-medium italic">Time TBD</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-start gap-2.5">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${session.type === 'Online' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                                                                {session.type === 'Online' ? (
                                                                    <Video size={16} className="text-emerald-600 dark:text-emerald-400" />
                                                                ) : (
                                                                    <Building2 size={16} className="text-purple-600 dark:text-purple-400" />
                                                                )}
                                                            </div>
                                                            <span className="leading-snug flex-1">
                                                                <span className="font-bold text-gray-900 dark:text-white block">{session.type}</span>
                                                                {session.type === 'In-Person' && (
                                                                    <span className="text-sm text-gray-500 max-w-full truncate block">{session.location || <span className="italic opacity-60">Location TBD</span>}</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        {session.speakers.length > 0 && (
                                                            <div className="col-span-2 flex items-start gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 mt-2">
                                                                <UserRound size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-0.5">Speakers</span>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {session.speakers.map((s, i) => (
                                                                            <span key={i} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-800 dark:text-gray-200 text-xs font-medium">
                                                                                {s.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer Actions & Capacity */}
                                                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">

                                                        {/* Capacity */}
                                                        <div className="w-full sm:w-1/2">
                                                            <div className="flex justify-between text-xs font-semibold mb-1.5">
                                                                <span className={isFull && !session.isJoined ? 'text-red-500' : 'text-gray-500'}>
                                                                    {session.currentAttendees} / {session.maxCapacity > 0 ? session.maxCapacity : 'Unlimited'} attending
                                                                </span>
                                                                {isFull && !session.isJoined && <span className="text-red-500">Full</span>}
                                                            </div>
                                                            {session.maxCapacity > 0 && (
                                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${isFull && !session.isJoined ? 'bg-red-500' : 'bg-blue-500'
                                                                            }`}
                                                                        style={{ width: `${progressPercentage}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="w-full sm:w-auto flex flex-col gap-2 shrink-0">

                                                            {session.isJoined && session.type === 'Online' && session.joinLink && (
                                                                <a
                                                                    href={session.joinLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#ABD2FA] text-[#3D518C] hover:bg-[#9AC2EA] px-6 py-3 rounded-full text-sm font-bold transition-all shadow-sm group-hover:shadow"
                                                                >
                                                                    Join Meeting <ExternalLink size={16} />
                                                                </a>
                                                            )}

                                                            <button
                                                                onClick={() => handleToggleJoin(session)}
                                                                disabled={loadingSessionId === session.id || (isUnavailable && !session.isJoined) || (!session.isJoined && (isFull || hasJoinedSession))}
                                                                className={`w-full sm:w-auto px-8 py-3 rounded-full text-sm font-extrabold transition-all duration-300 flex items-center justify-center gap-2
                                                                    ${loadingSessionId === session.id ? 'opacity-70 cursor-not-allowed' : ''}
                                                                    ${session.isJoined
                                                                        ? 'bg-white text-rose-500 hover:bg-rose-50 dark:bg-gray-800 dark:hover:bg-rose-900/20 border-2 border-rose-500 shadow-md'
                                                                        : isFull || isUnavailable || hasJoinedSession
                                                                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed border-2 border-transparent'
                                                                            : 'bg-[#3D518C] text-white hover:bg-[#2b3a66] shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 border-2 border-[#3D518C]'
                                                                    }
                                                                `}
                                                            >
                                                                {loadingSessionId === session.id && <Loader2 size={16} className="animate-spin" />}
                                                                {!session.isJoined && hasJoinedSession && !isFull && !isUnavailable && <Lock size={16} />}
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
        </div>
    );
}
