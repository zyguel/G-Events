"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    Calendar, MapPin, Clock, Target, Palette,
    ChevronLeft, ArrowRight, Loader2, AlertTriangle, Ticket, Users, User, Check,
    Presentation, Video, Building2, UserRound, MessageSquareDot
} from 'lucide-react';
import ClientHeader from '@/components/client/ClientHeader';
import { BreakoutSessionPicker } from '@/components/public/BreakoutSessionPicker';
import { getPublishedEventById, getPublicBreakoutSessions } from '@/lib/actions/events';
import { getTickets, Ticket as TicketType } from '@/lib/eventManagement';
import { createClient } from '@/lib/supabase-browser';

interface BreakoutSessionItem {
    id: string;
    name: string;
    type: 'Online' | 'In-Person';
    status: 'Not Started' | 'Ongoing' | 'Completed' | 'Cancelled';
    date: string;
    time: string;
    location: string;
    joinLink: string;
    currentAttendees: number;
    maxCapacity: number;
    speakers: string[];
}

interface AgendaSlot {
    id: number;
    title: string;
    description?: string;
    speaker_name?: string;
    start_time?: string;
    end_time?: string;
}

interface EventDetail {
    id: number;
    title: string;
    description?: string;
    location?: string;
    banner_image?: string;
    event_start_at?: string;
    event_end_at?: string;
    theme?: string;
    objectives?: string[];
    allow_breakout_sessions?: boolean;
    AgendaSlot?: AgendaSlot[];
}

function formatDate(iso?: string) {
    if (!iso) return 'TBD';
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(iso?: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function ClientEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.eventId as string;
    const eventId = parseInt(slug?.split('-').pop() ?? '');

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [breakoutSessions, setBreakoutSessions] = useState<BreakoutSessionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        if (isNaN(eventId)) { setLoading(false); return; }
        Promise.all([
            getPublishedEventById(eventId),
            getTickets(String(eventId)).catch(() => []),
            getPublicBreakoutSessions(eventId).catch(() => []),
        ]).then(([eventData, ticketData, breakoutData]) => {
            setEvent(eventData ?? null);
            setTickets(ticketData.filter(t => t.visibility === 'visible'));
            setBreakoutSessions(breakoutData as BreakoutSessionItem[]);
            setLoading(false);
        }).catch(() => setLoading(false));

        const checkReg = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                const { data: userRow } = await supabase.from('User').select('id').ilike('email', user.email).limit(1).maybeSingle();
                if (userRow?.id) {
                    const { data: reg } = await supabase.from('Registration')
                        .select('id')
                        .eq('event_id', eventId)
                        .eq('user_id', userRow.id)
                        .not('status', 'in', '("cancelled","rejected")')
                        .limit(1);
                    if (reg && reg.length > 0) setIsRegistered(true);
                }
            }
        };
        checkReg();
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex flex-col h-screen bg-[#F4F7FC] dark:bg-[#0f111a] font-sans">
                <ClientHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col h-screen bg-[#F4F7FC] dark:bg-[#0f111a] font-sans">
                <ClientHeader />
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
                    <AlertTriangle size={48} className="text-gray-300" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Not Found</h1>
                    <p className="text-gray-500 dark:text-gray-400">This event doesn't exist or may have been removed.</p>
                    <Link href="/home" className="text-sm font-semibold text-blue-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <ChevronLeft size={16} /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const sortedAgenda = [...(event.AgendaSlot ?? [])].sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

    const isEventEnded = event.event_end_at ? new Date() > new Date(event.event_end_at) : false;

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
            {/* Ambient glows */}
            <div className="pointer-events-none fixed left-[-10%] top-[-10%] z-0 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[100px] dark:bg-blue-600/10" />
            <div className="pointer-events-none fixed bottom-[-10%] right-[-5%] z-0 h-[560px] w-[560px] rounded-full bg-indigo-400/10 blur-[120px] dark:bg-purple-600/10" />

            <ClientHeader />

            <main className="flex-1 overflow-y-auto relative z-10">

                {/* ── Hero Banner ───────────────────────────────── */}
                <div className="relative h-56 w-full overflow-hidden bg-[#161a2b] sm:h-64 md:h-96">
                    {event.banner_image ? (
                        <Image
                            src={event.banner_image}
                            alt={event.title}
                            fill
                            sizes="100vw"
                            className="object-cover opacity-80"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3D518C] via-[#5C6BC0] to-[#1a1c2e] flex items-center justify-center">
                            <span className="text-8xl font-black text-white/20 select-none">
                                {event.title.charAt(0)}
                            </span>
                        </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Back button */}
                    <Link
                        href="/home"
                        className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-2 rounded-xl transition-all duration-200"
                    >
                        <ChevronLeft size={16} /> Back
                    </Link>

                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
                        <h1 className="text-pretty text-2xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-3xl md:text-5xl">
                            {event.title}
                        </h1>
                    </div>
                </div>

                {/* ── Content ───────────────────────────────────── */}
                <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:space-y-10 sm:py-10 md:px-8">

                    {/* Quick Info Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800/60 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                <Calendar size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Date</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatDate(event.event_start_at)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800/60 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                                <Clock size={20} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Time</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    {event.event_start_at && event.event_end_at
                                        ? `${formatTime(event.event_start_at)} – ${formatTime(event.event_end_at)}`
                                        : 'TBD'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800/60 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                                <MapPin size={20} className="text-rose-500" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Location</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{event.location || 'TBD'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                        <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About this Event</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p>
                        </section>
                    )}

                    {/* Theme & Objectives */}
                    {(event.theme || (event.objectives && event.objectives.length > 0)) && (
                        <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Overview</h2>

                            {event.theme && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Palette size={16} className="text-indigo-500" />
                                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Theme</span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-200 font-medium text-[15px] pl-6">{event.theme}</p>
                                </div>
                            )}

                            {event.objectives && event.objectives.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Target size={16} className="text-blue-500" />
                                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Objectives</span>
                                    </div>
                                    <ul className="space-y-2 pl-6">
                                        {event.objectives.map((obj, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-[15px] text-gray-700 dark:text-gray-200">
                                                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Agenda */}
                    {sortedAgenda.length > 0 && (
                        <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Agenda</h2>
                            <ol className="relative border-l-2 border-blue-100 dark:border-blue-900/40 space-y-0">
                                {sortedAgenda.map((slot, i) => (
                                    <li key={slot.id} className="ml-5 pb-8 last:pb-0 relative">
                                        {/* Timeline dot */}
                                        <span className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white dark:ring-gray-800 shrink-0" />

                                        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                                            {/* Time */}
                                            {(slot.start_time || slot.end_time) && (
                                                <span className="text-xs font-bold text-blue-500 dark:text-blue-400 whitespace-nowrap mt-0.5 mb-1 sm:mb-0 sm:w-36 shrink-0">
                                                    {slot.start_time ? formatTime(slot.start_time) : ''}
                                                    {slot.end_time ? ` – ${formatTime(slot.end_time)}` : ''}
                                                </span>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-[15px]">{slot.title}</p>
                                                {slot.speaker_name && (
                                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-0.5">{slot.speaker_name}</p>
                                                )}
                                                {slot.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{slot.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}

                    {/* Breakout Sessions (public catalog) */}
                    {breakoutSessions.length > 0 && (
                        <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Presentation size={20} className="text-indigo-500" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Breakout Sessions</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {breakoutSessions.map((session) => {
                                    const isFull = session.maxCapacity > 0 && session.currentAttendees >= session.maxCapacity;
                                    const statusColors: Record<string, string> = {
                                        'Not Started': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                                        'Ongoing': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                                        'Completed': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                                        'Cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                                    };
                                    return (
                                        <div
                                            key={session.id}
                                            className="relative flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-900/40 p-5 hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug">{session.name}</p>
                                                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[session.status] ?? statusColors['Not Started']}`}>
                                                    {session.status}
                                                </span>
                                            </div>

                                            <span className={`w-fit inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                                                session.type === 'Online'
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                            }`}>
                                                {session.type === 'Online'
                                                    ? <><Video size={12} /> Online</>
                                                    : <><Building2 size={12} /> In-Person</>
                                                }
                                            </span>

                                            <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                {session.time && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={13} className="shrink-0" />
                                                        <span>{session.time}{session.date ? ` · ${session.date}` : ''}</span>
                                                    </div>
                                                )}
                                                {session.type === 'In-Person' && session.location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={13} className="shrink-0" />
                                                        <span>{session.location}</span>
                                                    </div>
                                                )}
                                                {session.speakers.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <UserRound size={13} className="shrink-0" />
                                                        <span>{session.speakers.join(', ')}</span>
                                                    </div>
                                                )}
                                                {session.maxCapacity > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <Users size={13} className="shrink-0" />
                                                        <span className={isFull ? 'text-red-500 dark:text-red-400 font-medium' : ''}>
                                                            {isFull ? 'Full' : `${Math.max(0, session.maxCapacity - session.currentAttendees)} slots available`}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Tickets */}
                    {tickets.length > 0 && (
                        <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Ticket size={20} className="text-blue-500" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tickets Available</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tickets.map((ticket) => {
                                    const isFree = ticket.type === 'free' || !ticket.price || ticket.price === 0;
                                    const inclusions = ticket.description
                                        ? ticket.description.split('\n').map(l => l.trim()).filter(Boolean)
                                        : [];
                                    return (
                                        <div
                                            key={ticket.id}
                                            className="relative flex flex-col gap-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-900/40 p-5 hover:border-blue-200 dark:hover:border-blue-700/50 hover:shadow-md transition-all duration-200"
                                        >
                                            {/* Top row: name + price badge */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug">{ticket.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <Users size={13} className="text-gray-400" />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {Math.max(0, ticket.quantity - ticket.usedQuantity)} slots available
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 text-sm font-extrabold px-3 py-1 rounded-full ${isFree
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                                    {isFree ? 'Free' : `₱${Number(ticket.price).toLocaleString()}`}
                                                </span>
                                            </div>

                                            {/* Inclusions */}
                                            {inclusions.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">What's included</p>
                                                    <ul className="space-y-1.5">
                                                        {inclusions.map((line, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                                <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                                                                    <Check size={10} className="text-blue-500" />
                                                                </span>
                                                                {line}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Register CTA */}

                    <div className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] p-6 shadow-xl shadow-blue-500/20 sm:p-8 md:flex-row md:items-center md:justify-between md:p-10">
                        {isRegistered ? (
                            <>
                                <div className="min-w-0 space-y-2 text-center md:text-left">
                                    <h3 className="text-xl font-extrabold text-white sm:text-2xl">You&apos;re in!</h3>
                                    <p className="text-sm text-blue-100/90">
                                        You have secured your spot for <span className="font-semibold text-white">{event.title}</span>.
                                    </p>
                                </div>
                                <Link
                                    href={`/events/${slug}/breakout-sessions`}
                                    className="flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-center text-[15px] font-bold text-[#3D518C] shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-blue-50 hover:shadow-xl active:scale-[0.98] md:w-auto md:px-8 touch-manipulation whitespace-nowrap"
                                >
                                    View breakout sessions
                                    <ArrowRight size={18} />
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="min-w-0 space-y-3 text-center md:text-left">
                                    <h3 className="text-xl font-extrabold text-white sm:text-2xl">Ready to join?</h3>
                                    <p className="text-sm text-blue-100/90">
                                        Secure your spot at <span className="font-semibold text-white">{event.title}</span>.
                                    </p>
                                    <div className="flex flex-col gap-2 text-left text-xs leading-snug text-blue-100/85 sm:text-[13px]">
                                        <span className="flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                                            <User size={15} className="mt-0.5 shrink-0 text-white/95" aria-hidden />
                                            <span><strong className="text-white">Individual</strong> — register yourself only; one form and e-ticket.</span>
                                        </span>
                                        <span className="flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                                            <Users size={15} className="mt-0.5 shrink-0 text-white/95" aria-hidden />
                                            <span><strong className="text-white">Group</strong> — you&apos;re the lead; add member emails on the next screens so each person confirms their profile.</span>
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    href={`/events/${slug}/register`}
                                    className="flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-center text-[15px] font-bold text-[#3D518C] shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-blue-50 hover:shadow-xl active:scale-[0.98] md:w-auto md:px-8 touch-manipulation"
                                >
                                    Register for this event
                                    <ArrowRight size={18} />
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Feedback CTA – shown only after event ends */}
                    {isEventEnded && (
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/20">
                            <div>
                                <h3 className="text-2xl font-extrabold text-white mb-1">How was the event?</h3>
                                <p className="text-amber-100/80 text-sm">Share your experience with <span className="font-semibold text-white">{event.title}</span>. Your feedback matters!</p>
                            </div>
                            <Link
                                href={`/events/${slug}/review`}
                                className="flex items-center gap-2.5 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:bg-orange-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                            >
                                <MessageSquareDot size={18} />
                                Give Feedback
                            </Link>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
