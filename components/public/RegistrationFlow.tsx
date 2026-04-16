'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Users, Plus, X, ChevronRight, ChevronLeft,
    Mail, AlertCircle, CheckCircle, Loader, ArrowRight,
    Check, Ticket, QrCode, Copy
} from 'lucide-react';
import { OrderFormData } from '@/lib/types';
import { useOrderFormSubmit } from '@/lib/hooks/useOrderFormSubmit';
import { PublicOrderForm } from '@/components/public/PublicOrderForm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormAnswers {
    [inputId: string]: string | string[] | null;
}

interface RegistrationFlowProps {
    eventId: number;
    eventTitle: string;
    eventSlug: string;
    orderFormId: number;
    formData: OrderFormData;
    userEmail?: string;
    tickets: {
        id: number;
        name: string;
        price: number;
        available_quantity: number;
        used_quantity: number;
        is_sold_out: boolean;
    }[];
    breakoutSessions?: {
        id: string;
        name: string;
        type: 'Online' | 'In-Person';
        status: 'Not Started' | 'Ongoing' | 'Completed' | 'Cancelled';
        date: string;
        time: string;
        location: string;
        currentAttendees: number;
        maxCapacity: number;
    }[];
    existingCheckInPasses?: CheckInPass[];
    existingTicketNames?: string[];
    hasPromotions?: boolean;
    allowGroupRegistration?: boolean;
    allowWaitlist?: boolean;
    waitlistInviteToken?: string;
    waitlistInviteTicketId?: number | null;
    waitlistInviteEmail?: string;
}

type CheckInPass = {
    email: string;
    registrationId: number;
    token: string;
    qrPayload: string;
    expiresAt: string;
};

type RegistrationType = 'individual' | 'group';
type Step = 'identify' | 'choose-ticket' | 'choose-type' | 'group-members' | 'fill-form';

// ─── Email validation helper ──────────────────────────────────────────────────

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function CheckInPassCard({ pass }: { pass: CheckInPass }) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

    useEffect(() => {
        let active = true;

        const generateQr = async () => {
            try {
                const qrcode = await import('qrcode');
                const dataUrl = await qrcode.toDataURL(pass.qrPayload, {
                    width: 240,
                    margin: 1,
                    errorCorrectionLevel: 'M'
                });

                if (active) {
                    setQrDataUrl(dataUrl);
                }
            } catch {
                if (active) {
                    setQrDataUrl('');
                }
            }
        };

        generateQr();
        return () => {
            active = false;
        };
    }, [pass.qrPayload]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(pass.qrPayload);
            setCopyStatus('copied');
        } catch {
            setCopyStatus('failed');
        }

        window.setTimeout(() => setCopyStatus('idle'), 1800);
    }, [pass.qrPayload]);

    return (
        <div className="bg-white dark:bg-gray-800/70 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Check-In Pass</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{pass.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Registration #{pass.registrationId}</p>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Copy size={13} />
                    {copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy Failed' : 'Copy QR Data'}
                </button>
            </div>

            <div className="mt-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 min-h-45 overflow-hidden p-2">
                {qrDataUrl ? (
                    <img
                        src={qrDataUrl}
                        alt={`Check-in QR for ${pass.email}`}
                        className="w-full max-w-44 sm:max-w-48 h-auto aspect-square object-contain"
                    />
                ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <QrCode size={14} />
                        Generating QR...
                    </div>
                )}
            </div>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Valid until {new Date(pass.expiresAt).toLocaleString()}
            </p>
        </div>
    );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep, type, userEmail, allowGroupRegistration = true }: { currentStep: Step; type: RegistrationType; userEmail?: string; allowGroupRegistration?: boolean }) {
    const steps: string[] = [];
    const stepKeys: Step[] = [];

    if (!userEmail) {
        steps.push('Identify');
        stepKeys.push('identify' as Step);
    }

    steps.push('Tickets');
    stepKeys.push('choose-ticket' as Step);

    if (allowGroupRegistration) {
        steps.push('Mode');
        stepKeys.push('choose-type' as Step);

        if (type === 'group') {
            steps.push('Members');
            stepKeys.push('group-members' as Step);
        }
    }

    steps.push('Form');
    stepKeys.push('fill-form' as Step);

    const currentIndex = stepKeys.indexOf(currentStep);

    return (
        <div className="flex items-center justify-center gap-0 mb-8 sm:mb-10 overflow-x-auto pb-4 no-scrollbar px-1">
            {steps.map((label, i) => {
                const isDone = i < currentIndex;
                const isActive = i === currentIndex;
                return (
                    <div key={label} className="flex items-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`
                                w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300
                                ${isDone
                                    ? 'bg-[#3D518C] text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                                    : isActive
                                    ? 'bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40 ring-4 ring-blue-100 dark:ring-blue-900/30'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                }
                            `}>
                                {isDone ? <Check size={14} strokeWidth={3} /> : <span>{i + 1}</span>}
                            </div>
                            <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                                isActive ? 'text-[#3D518C] dark:text-blue-400' : isDone ? 'text-[#3D518C]/70 dark:text-blue-500/70' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`w-8 sm:w-16 h-0.5 mt-[-18px] mx-1 sm:mx-2 transition-all duration-500 ${
                                i < currentIndex ? 'bg-[#3D518C]' : 'bg-gray-200 dark:bg-gray-700'
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function RegistrationModeBanner({
    step,
    registrationType,
}: {
    step: Step;
    registrationType: RegistrationType;
}) {
    if (step === 'group-members') {
        return (
            <div className="mb-5 flex justify-center px-0 sm:px-1">
                <div
                    role="status"
                    className="flex w-full max-w-xl items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/95 px-4 py-3 text-left shadow-sm dark:border-indigo-800/50 dark:bg-indigo-900/25"
                >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                        <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Group registration
                        </p>
                        <p className="mt-1 text-[13px] leading-snug text-indigo-900 dark:text-indigo-100/95">
                            You&apos;re the lead registrant. Add each member&apos;s email; they&apos;ll confirm their own details after you submit (no payment fields for them).
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    if (step === 'fill-form') {
        if (registrationType === 'group') {
            return (
                <div className="mb-5 flex justify-center px-0 sm:px-1">
                    <div
                        role="status"
                        className="flex w-full max-w-xl items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/95 px-4 py-3 text-left shadow-sm dark:border-indigo-800/50 dark:bg-indigo-900/25"
                    >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                            <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Group — your form
                            </p>
                            <p className="mt-1 text-[13px] leading-snug text-indigo-900 dark:text-indigo-100/95">
                                Complete this form as the main registrant (including payment if required). Members you listed will get their own link to finish their profiles.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="mb-5 flex justify-center px-0 sm:px-1">
                <div
                    role="status"
                    className="flex w-full max-w-xl items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/95 px-4 py-3 text-left shadow-sm dark:border-blue-900/40 dark:bg-blue-950/40"
                >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                        <User size={18} className="text-[#3D518C] dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#3D518C] dark:text-blue-400">
                            Individual registration
                        </p>
                        <p className="mt-1 text-[13px] leading-snug text-blue-950/90 dark:text-blue-100/90">
                            You&apos;re registering only yourself. One form, one e-ticket — payment fields apply to you if the event requires them.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    return null;
}

// ─── Step 00: Identify (Guest) ──────────────────────────────────────────────────
function IdentifyStep({
    onVerified
}: {
    onVerified: (email: string) => void;
}) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            setErrorMsg('Please enter a valid email');
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/users/check-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: [email] })
            });
            const data = await res.json();
            
            if (data.data?.[email]) {
                onVerified(email);
            } else {
                setErrorMsg('This email is not registered. Registration is restricted to members.');
                setStatus('error');
            }
        } catch (err) {
            setErrorMsg('Verification failed. Please try again.');
            setStatus('error');
        }
    };

    return (
        <div className="animate-fade-in py-4">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Mail size={32} className="text-[#3D518C] dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    Verify Your Account
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Event registration is restricted to existing members. Please enter your registered email to continue.
                </p>
            </div>

            <form onSubmit={handleVerify} className="max-w-sm mx-auto space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                        Email Address
                    </label>
                    <div className={`
                        flex items-center gap-3 bg-white dark:bg-gray-800 border-2 rounded-2xl px-5 py-4 transition-all duration-200
                        ${status === 'error'
                            ? 'border-red-300 dark:border-red-700 ring-4 ring-red-50 dark:ring-red-900/10'
                            : 'border-gray-100 dark:border-gray-800 focus-within:border-[#3D518C] focus-within:ring-4 focus-within:ring-blue-50 dark:focus-within:ring-blue-900/10'}
                    `}>
                        <Mail size={18} className="text-gray-300" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                            placeholder="your@email.com"
                            className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none placeholder-gray-300"
                            autoFocus
                        />
                    </div>
                    {status === 'error' && (
                        <div className="flex items-center gap-2 px-1 text-red-500 animate-slide-up">
                            <AlertCircle size={14} />
                            <p className="text-xs font-semibold">{errorMsg}</p>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="min-h-[52px] w-full flex items-center justify-center gap-2 py-4 sm:py-5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white font-black rounded-2xl shadow-xl shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation"
                >
                    {status === 'loading' ? (
                        <Loader size={20} className="animate-spin" />
                    ) : (
                        <>
                            Verify & Continue
                            <ChevronRight size={20} className="mt-0.5" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

// ─── Step 0: Choose Ticket Type ────────────────────────────────────────────────
function ChooseTicketStep({
    eventId,
    eventTitle,
    userEmail,
    tickets,
    hasPromotions,
    allowWaitlist = false,
    onSelect,
}: {
    eventId: number;
    eventTitle: string;
    userEmail?: string;
    tickets: RegistrationFlowProps['tickets'];
    hasPromotions?: boolean;
    allowWaitlist?: boolean;
    onSelect: (ticketId: number, appliedPromoCode?: string) => void;
}) {
    const [hovered, setHovered] = useState<number | null>(null);
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [isCheckingPromo, setIsCheckingPromo] = useState(false);
    const [promoError, setPromoError] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_type: string; discount_value: number; ticket_ids: number[] } | null>(null);
    const [isJoiningWaitlist, setIsJoiningWaitlist] = useState<number | null>(null);
    const [waitlistFeedback, setWaitlistFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const allTicketsUnavailable = tickets.length === 0 || tickets.every((ticket) => ticket.is_sold_out);

    const handleJoinWaitlist = async (ticketId?: number) => {
        if (!userEmail) {
            setWaitlistFeedback({ type: 'error', message: 'Please verify your email first.' });
            return;
        }

        setWaitlistFeedback(null);
        setIsJoiningWaitlist(ticketId ?? -1);
        try {
            const res = await fetch(`/api/events/${eventId}/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, ticketId }),
            });
            const data = await res.json();
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || 'Failed to join waitlist');
            }

            setWaitlistFeedback({
                type: 'success',
                message: 'You were added to the waitlist. Watch your email for invitation updates.',
            });
        } catch (error) {
            setWaitlistFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to join waitlist',
            });
        } finally {
            setIsJoiningWaitlist(null);
        }
    };

    if (allTicketsUnavailable) {
        return (
            <div className="animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                        Tickets Are Currently Unavailable
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {allowWaitlist
                            ? `All tickets for ${eventTitle} are sold out. Join the waitlist to get invited when a slot opens.`
                            : 'All tickets are sold out right now.'}
                    </p>
                </div>

                {allowWaitlist ? (
                    <div className="space-y-4">
                        {tickets.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{ticket.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sold out</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleJoinWaitlist(ticket.id)}
                                            disabled={isJoiningWaitlist !== null}
                                            className="min-h-11 px-4 py-2 rounded-xl bg-linear-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isJoiningWaitlist === ticket.id ? 'Joining...' : 'Join Waitlist'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-5 text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">No active ticket tiers are available right now.</p>
                                <button
                                    type="button"
                                    onClick={() => handleJoinWaitlist(undefined)}
                                    disabled={isJoiningWaitlist !== null}
                                    className="min-h-11 px-5 py-2 rounded-xl bg-linear-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                >
                                    {isJoiningWaitlist === -1 ? 'Joining...' : 'Join Event Waitlist'}
                                </button>
                            </div>
                        )}

                        {waitlistFeedback && (
                            <div className={`rounded-xl border px-4 py-3 text-sm ${waitlistFeedback.type === 'success'
                                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-300'
                                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300'
                                }`}>
                                {waitlistFeedback.message}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-5 text-center text-sm text-gray-600 dark:text-gray-300">
                        Waitlist is not enabled for this event. Please check again later.
                    </div>
                )}
            </div>
        );
    }

    const handleApplyPromo = async () => {
        if (!promoCodeInput.trim()) return;
        setIsCheckingPromo(true);
        setPromoError('');
        try {
            const res = await fetch(`/api/events/${eventId}/promotions/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCodeInput.trim() })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setPromoError(data.error || 'Invalid promo code');
                setAppliedPromo(null);
            } else {
                setAppliedPromo(data.data);
                setPromoCodeInput('');
            }
        } catch (e) {
            setPromoError('Failed to validate promo code');
        } finally {
            setIsCheckingPromo(false);
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCodeInput('');
        setPromoError('');
    };

    const getDiscountedPrice = (ticket: any) => {
        if (!appliedPromo) return ticket.price;
        if (appliedPromo.ticket_ids.length > 0 && !appliedPromo.ticket_ids.includes(ticket.id)) return ticket.price;
        
        const val = Number(appliedPromo.discount_value);
        if (appliedPromo.discount_type === 'percentage') {
            return Math.max(0, ticket.price * (100 - val) / 100);
        } else {
            return Math.max(0, ticket.price - val);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                    Select Your Ticket
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose the ticket type that best fits your needs.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {tickets.map((ticket) => (
                    <button
                        key={ticket.id}
                        onClick={() => !ticket.is_sold_out && onSelect(ticket.id, appliedPromo?.code)}
                        onMouseEnter={() => setHovered(ticket.id)}
                        onMouseLeave={() => setHovered(null)}
                        disabled={ticket.is_sold_out}
                        className={`
                            relative group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 text-left w-full min-h-[52px]
                            ${ticket.is_sold_out 
                                ? 'opacity-60 grayscale border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 cursor-not-allowed' 
                                : hovered === ticket.id
                                    ? 'border-[#3D518C] bg-gradient-to-r from-[#3D518C]/5 to-[#5C6BC0]/5 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 scale-[1.01]'
                                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/60 hover:shadow-md'}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                ${ticket.is_sold_out 
                                    ? 'bg-gray-200 dark:bg-gray-700' 
                                    : hovered === ticket.id 
                                        ? 'bg-[#3D518C] text-white shadow-md' 
                                        : 'bg-blue-50 dark:bg-blue-900/20 text-[#3D518C] dark:text-blue-400'}
                            `}>
                                <Ticket size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-base font-bold text-gray-900 dark:text-white">{ticket.name}</p>
                                {ticket.is_sold_out ? (
                                    <p className="text-xs font-semibold text-red-500 dark:text-red-400">Sold out</p>
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {ticket.available_quantity > 0 ? `${ticket.available_quantity - ticket.used_quantity} remaining` : 'Unlimited'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            {appliedPromo && getDiscountedPrice(ticket) < ticket.price ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-sm line-through text-gray-400 dark:text-gray-500">
                                        {ticket.price === 0 ? 'FREE' : `$${ticket.price}`}
                                    </span>
                                    <p className="text-lg font-black text-green-600 dark:text-green-400">
                                        {getDiscountedPrice(ticket) === 0 ? 'FREE' : `$${getDiscountedPrice(ticket).toFixed(2)}`}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-lg font-black text-[#3D518C] dark:text-blue-400">
                                    {ticket.price === 0 ? 'FREE' : `$${ticket.price}`}
                                </p>
                            )}
                            {!ticket.is_sold_out && (
                                <div className={`
                                    flex items-center gap-1 text-xs font-bold transition-all duration-300
                                    ${hovered === ticket.id ? 'text-[#3D518C] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                                `}>
                                    Select <ChevronRight size={14} />
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {hasPromotions && (
                <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="w-full max-w-[260px] mx-auto sm:mx-0">
                    <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 text-left">
                        Promo Code
                    </label>
                    
                    {appliedPromo ? (
                        <div className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                                <div>
                                    <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">{appliedPromo.code}</p>
                                    <p className="text-[10px] font-medium text-green-600 dark:text-green-500">
                                        {appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}% off` : `$${appliedPromo.discount_value} off`} applied
                                    </p>
                                </div>
                            </div>
                            <button onClick={removePromo} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Remove promo code">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoCodeInput}
                                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                                    placeholder="ENTER CODE"
                                    className="flex-1 bg-white dark:bg-gray-800/80 border-2 border-[#3D518C]/80 dark:border-blue-500/50 focus:border-[#3D518C] dark:focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                                    disabled={isCheckingPromo}
                                />
                                <button
                                    onClick={handleApplyPromo}
                                    disabled={!promoCodeInput.trim() || isCheckingPromo}
                                    className="px-4 py-1.5 bg-[#8C939A] hover:bg-[#727981] dark:bg-gray-600 dark:hover:bg-gray-500 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isCheckingPromo ? <Loader size={12} className="animate-spin" /> : 'Apply'}
                                </button>
                            </div>
                            {promoError && (
                                <p className="mt-1.5 text-[10px] font-semibold text-red-500 flex items-center gap-1 justify-start">
                                    <AlertCircle size={12} />
                                    {promoError}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}

// ─── Step 1: Choose Registration Type ────────────────────────────────────────

function ChooseTypeStep({
    onSelect,
    onBack,
}: {
    onSelect: (type: RegistrationType) => void;
    onBack: () => void;
}) {
    const [hovered, setHovered] = useState<RegistrationType | null>(null);

    return (
        <div className="animate-fade-in">
            <div className="mb-8 text-center px-1">
                <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                    Individual or group?
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    Pick how you&apos;re attending. You can go back and change this before you submit.
                </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {/* Individual */}
                <button
                    id="reg-type-individual"
                    type="button"
                    onClick={() => onSelect('individual')}
                    onMouseEnter={() => setHovered('individual')}
                    onMouseLeave={() => setHovered(null)}
                    className={`
                        relative flex min-h-[168px] touch-manipulation flex-col items-center gap-4 rounded-3xl border-2 p-6 text-center transition-all duration-300 sm:min-h-[188px] sm:p-8
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D518C] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
                        ${hovered === 'individual'
                            ? 'border-[#3D518C] bg-gradient-to-br from-[#3D518C]/5 to-[#5C6BC0]/10 shadow-xl shadow-blue-100 dark:shadow-blue-900/20 sm:scale-[1.02]'
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/60 hover:shadow-lg'}
                        active:scale-[0.99] sm:active:scale-100
                    `}
                >
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#3D518C] dark:bg-blue-900/40 dark:text-blue-300">
                        Solo attendee
                    </span>
                    <div className={`
                        flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 sm:h-20 sm:w-20
                        ${hovered === 'individual'
                            ? 'bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] shadow-lg shadow-blue-300/40'
                            : 'bg-blue-50 dark:bg-blue-900/20'}
                    `}>
                        <User className={hovered === 'individual' ? 'text-white' : 'text-[#3D518C] dark:text-blue-400'} size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white">Just me</p>
                        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            One person, one form, one e-ticket. Fastest if you&apos;re only registering yourself.
                        </p>
                    </div>
                    <div className={`
                        flex items-center gap-1.5 text-sm font-bold transition-all duration-300
                        ${hovered === 'individual' ? 'text-[#3D518C] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                    `}>
                        Continue <ChevronRight size={16} />
                    </div>
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                        <div className={`absolute inset-0 bg-gradient-to-br from-white/40 to-transparent transition-opacity duration-300 ${hovered === 'individual' ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                </button>

                {/* Group */}
                <button
                    id="reg-type-group"
                    type="button"
                    onClick={() => onSelect('group')}
                    onMouseEnter={() => setHovered('group')}
                    onMouseLeave={() => setHovered(null)}
                    className={`
                        relative flex min-h-[168px] touch-manipulation flex-col items-center gap-4 rounded-3xl border-2 p-6 text-center transition-all duration-300 sm:min-h-[188px] sm:p-8
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
                        ${hovered === 'group'
                            ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 sm:scale-[1.02]'
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/60 hover:shadow-lg'}
                        active:scale-[0.99] sm:active:scale-100
                    `}
                >
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        You + others
                    </span>
                    <div className={`
                        flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 sm:h-20 sm:w-20
                        ${hovered === 'group'
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-300/40'
                            : 'bg-indigo-50 dark:bg-indigo-900/20'}
                    `}>
                        <Users className={hovered === 'group' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'} size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white">Group</p>
                        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            You register as the lead; add member emails so each person can confirm their own profile.
                        </p>
                    </div>
                    <div className={`
                        flex items-center gap-1.5 text-sm font-bold transition-all duration-300
                        ${hovered === 'group' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
                    `}>
                        Continue <ChevronRight size={16} />
                    </div>
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                        <div className={`absolute inset-0 bg-gradient-to-br from-white/40 to-transparent transition-opacity duration-300 ${hovered === 'group' ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                </button>
            </div>

            {/* Back button */}
            <div className="flex justify-center border-t border-gray-100 dark:border-gray-800 pt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex min-h-[48px] items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white touch-manipulation"
                >
                    <ChevronLeft size={16} />
                    Back to ticket selection
                </button>
            </div>
        </div>
    );
}

// ─── Step 2: Group Members ────────────────────────────────────────────────────

function GroupMembersStep({
    initialEmails,
    onBack,
    onContinue,
}: {
    initialEmails: string[];
    onBack: () => void;
    onContinue: (emails: string[]) => void;
}) {
    const [emails, setEmails] = useState<string[]>(initialEmails.length > 0 ? initialEmails : ['']);
    const [errors, setErrors] = useState<string[]>(new Array(initialEmails.length > 0 ? initialEmails.length : 1).fill(''));
    const [verificationStatus, setVerificationStatus] = useState<Record<string, 'loading' | 'verified' | 'unverified' | 'idle'>>({});

    const checkEmails = async (emailsToCheck: string[]) => {
        const validEmails = emailsToCheck.filter(e => isValidEmail(e.trim()));
        if (validEmails.length === 0) return;

        // Set status to loading for target emails
        const nextStatus = { ...verificationStatus };
        validEmails.forEach(e => nextStatus[e.toLowerCase()] = 'loading');
        setVerificationStatus(nextStatus);

        try {
            const res = await fetch('/api/users/check-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: validEmails })
            });
            const data = await res.json();
            
            setVerificationStatus(prev => {
                const updated = { ...prev };
                validEmails.forEach(e => {
                    updated[e.toLowerCase()] = data.data?.[e] ? 'verified' : 'unverified';
                });
                return updated;
            });
        } catch (error) {
            console.error('Failed to verify emails:', error);
            // Revert loading if failed
            setVerificationStatus(prev => {
                const updated = { ...prev };
                validEmails.forEach(e => {
                    if (updated[e.toLowerCase()] === 'loading') updated[e.toLowerCase()] = 'idle';
                });
                return updated;
            });
        }
    };

    const handleEmailChange = (index: number, value: string) => {
        const updated = [...emails];
        updated[index] = value;
        setEmails(updated);
        const updatedErrors = [...errors];
        updatedErrors[index] = '';
        setErrors(updatedErrors);

        // Reset status for this email
        setVerificationStatus(prev => {
            const next = { ...prev };
            delete next[value.toLowerCase()];
            return next;
        });
    };

    const handleBlur = (index: number) => {
        const email = emails[index].trim();
        if (isValidEmail(email)) {
            checkEmails([email]);
        }
    };

    const addEmail = () => {
        setEmails([...emails, '']);
        setErrors([...errors, '']);
    };

    const removeEmail = (index: number) => {
        if (emails.length <= 1) return;
        setEmails(emails.filter((_, i) => i !== index));
        setErrors(errors.filter((_, i) => i !== index));
    };

    const handleContinue = () => {
        const newErrors: string[] = emails.map(e => {
            if (!e.trim()) return 'Email is required';
            if (!isValidEmail(e.trim())) return 'Please enter a valid email address';
            return '';
        });

        // Check for duplicates
        const seen = new Set<string>();
        emails.forEach((e, i) => {
            if (seen.has(e.toLowerCase())) {
                newErrors[i] = 'Duplicate email address';
            }
            seen.add(e.toLowerCase());
        });

        setErrors(newErrors);
        
        // Final verification check
        const allVerified = emails.every(e => verificationStatus[e.toLowerCase()] === 'verified');
        if (!allVerified) {
            const finalErrors = [...newErrors];
            emails.forEach((e, i) => {
                if (verificationStatus[e.toLowerCase()] === 'unverified') {
                    finalErrors[i] = 'Email is not registered in the system';
                } else if (verificationStatus[e.toLowerCase()] === 'loading') {
                    finalErrors[i] = 'Checking...';
                }
            });
            setErrors(finalErrors);
            return;
        }

        if (newErrors.some(e => e !== '')) return;

        onContinue(emails.map(e => e.trim()));
    };

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                    <Users size={26} className="text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                    Add Group Members
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Enter each member&apos;s account email. After you submit, they&apos;ll get a link to sign in and complete their own details (without payment fields).
                </p>
            </div>

            <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
                {emails.map((email, index) => (
                    <div key={index} className="group">
                        <div className={`
                            flex items-center gap-3 bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3 transition-all duration-200
                            ${errors[index]
                                ? 'border-red-300 dark:border-red-700 ring-2 ring-red-100 dark:ring-red-900/30'
                                : 'border-gray-200 dark:border-gray-700 focus-within:border-[#3D518C] dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 hover:border-gray-300 dark:hover:border-gray-600'}
                        `}>
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                                <Mail size={15} className="text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <input
                                id={`group-email-${index}`}
                                type="email"
                                value={email}
                                onChange={(e) => handleEmailChange(index, e.target.value)}
                                onBlur={() => handleBlur(index)}
                                placeholder={`Member ${index + 1} email address`}
                                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                            />
                            <div className="flex items-center gap-1.5">
                                {verificationStatus[email.toLowerCase()] === 'loading' && (
                                    <Loader size={15} className="text-blue-500 animate-spin" />
                                )}
                                {verificationStatus[email.toLowerCase()] === 'verified' && (
                                    <div className="flex items-center gap-1 text-green-500">
                                        <Check size={14} className="stroke-[3]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Known</span>
                                    </div>
                                )}
                                {verificationStatus[email.toLowerCase()] === 'unverified' && (
                                    <div className="flex items-center gap-1 text-red-500">
                                        <AlertCircle size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Unknown</span>
                                    </div>
                                )}
                                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full shrink-0">
                                    #{index + 1}
                                </span>
                                {emails.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEmail(index)}
                                        className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {errors[index] && (
                            <p className="mt-1 ml-3 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={11} />
                                {errors[index]}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Add member button */}
            <button
                type="button"
                id="add-group-member-btn"
                onClick={addEmail}
                className="mb-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-3 text-sm font-semibold text-gray-500 transition-all duration-200 hover:border-[#3D518C] hover:bg-blue-50/50 hover:text-[#3D518C] dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 dark:hover:text-blue-400 touch-manipulation"
            >
                <Plus size={16} />
                Add Another Member
            </button>

            {/* Summary badge */}
            <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-4 py-3 border border-indigo-100 dark:border-indigo-800/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-indigo-500" />
                </div>
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    <span className="font-extrabold">{emails.length}</span> member{emails.length !== 1 ? 's' : ''} will be registered in this group.
                </p>
            </div>

            {/* Navigation */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                    type="button"
                    id="group-back-btn"
                    onClick={onBack}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 touch-manipulation sm:min-w-0 sm:justify-start"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>
                <button
                    type="button"
                    id="group-continue-btn"
                    onClick={handleContinue}
                    className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:from-[#2e3d6e] hover:to-[#4a57a1] hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] dark:shadow-blue-900/30 touch-manipulation"
                >
                    Continue to Form
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Order Form ──────────────────────────────────────────────────────

function OrderFormStep({
    formData,
    eventId,
    orderFormId,
    registrationType,
    groupEmails,
    onBack,
    eventSlug,
    userEmail,
    ticketId,
    tickets,
    promotionCode,
    waitlistInviteToken,
}: {
    formData: OrderFormData;
    eventId: number;
    orderFormId: number;
    registrationType: RegistrationType;
    groupEmails: string[];
    onBack: () => void;
    eventSlug: string;
    userEmail?: string;
    ticketId: number | null;
    tickets: RegistrationFlowProps['tickets'];
    promotionCode?: string;
    waitlistInviteToken?: string;
}) {
    const router = useRouter();
    const [answers, setAnswers] = useState<FormAnswers>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [capacityPrecheckError, setCapacityPrecheckError] = useState<string | null>(null);

    const { isSubmitting, error, success, successMessage, submissionResult, submit } = useOrderFormSubmit({
        eventId,
        orderFormId,
        userEmail,
        registrationId: undefined, // Will be created on server or passed if we had it
    });

    const checkInPasses: CheckInPass[] = Array.isArray(submissionResult?.checkInPasses)
        ? (submissionResult?.checkInPasses as CheckInPass[])
        : [];

    const handleInputChange = useCallback((inputId: string, value: string | string[]) => {
        setAnswers(prev => ({ ...prev, [inputId]: value }));
        setValidationErrors(prev => {
            const next = { ...prev };
            delete next[inputId];
            return next;
        });
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setCapacityPrecheckError(null);

        const requestedSeats = registrationType === 'group' ? groupEmails.length + 1 : 1;
        if (ticketId && requestedSeats > 0) {
            const selectedTicket = tickets.find((t) => t.id === ticketId) || null;
            if (selectedTicket && selectedTicket.available_quantity > 0) {
                const remaining = Math.max(0, selectedTicket.available_quantity - selectedTicket.used_quantity);
                if (requestedSeats > remaining) {
                    setCapacityPrecheckError(
                        `This group needs ${requestedSeats} seat(s), but only ${remaining} seat(s) remain for ${selectedTicket.name}.`
                    );
                    return;
                }
            }
        }

        // Mark all as touched
        const allIds = new Set<string>();
        formData.sections.forEach(s => s.inputs.forEach(i => allIds.add(i.id)));
        setTouched(allIds);

        // Validate required
        const newErrors: Record<string, string> = {};
        formData.sections.forEach(s => {
            s.inputs.filter(i => i.required).forEach(i => {
                const val = answers[i.id];
                const empty = !val || (Array.isArray(val) && val.length === 0);
                if (empty) newErrors[i.id] = 'This field is required';
            });
        });
        setValidationErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        await submit(formData, answers, ticketId, registrationType === 'group' ? groupEmails : [], null, promotionCode, waitlistInviteToken || null);
    }, [formData, answers, submit, ticketId, tickets, registrationType, groupEmails, promotionCode, waitlistInviteToken]);

    if (success) {
        return (
            <div className="text-center py-10 animate-fade-in">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200 dark:shadow-green-900/30">
                    <CheckCircle size={38} className="text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
                    You're Registered! 🎉
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-2">
                    {successMessage || 'Your registration has been submitted successfully.'}
                </p>

                {registrationType === 'group' && groupEmails.length > 0 && (
                    <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 text-left max-w-sm mx-auto border border-indigo-100 dark:border-indigo-800/40">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Group members</p>
                        <p className="text-xs text-indigo-800/90 dark:text-indigo-200/90 mb-3 leading-relaxed">
                            Each person below will get an email with a link to complete their details. They must sign in before submitting (payment fields are not required for them).
                        </p>
                        <ul className="space-y-1">
                            {groupEmails.map((email, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 break-all">
                                    <Mail size={13} className="text-indigo-500 shrink-0" />
                                    {email}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {checkInPasses.length > 0 && (
                    <div className="mt-6 max-w-3xl mx-auto text-left">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">
                            Save your check-in QR pass{checkInPasses.length > 1 ? 'es' : ''}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {checkInPasses.map((pass) => (
                                <CheckInPassCard
                                    key={`${pass.registrationId}-${pass.email}`}
                                    pass={pass}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <button
                    id="back-to-event-btn"
                    onClick={() => router.push(`/events/${eventSlug}`)}
                    className="mt-8 px-8 py-3 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                    Back to Event
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Registration type badge */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <div className={`inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold sm:text-sm ${
                    registrationType === 'group'
                        ? 'border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-800/40 dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'border-blue-100 bg-blue-50 text-[#3D518C] dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                    {registrationType === 'group' ? <Users size={14} className="shrink-0" /> : <User size={14} className="shrink-0" />}
                    <span className="min-w-0">
                        {registrationType === 'group'
                            ? `Group · ${groupEmails.length} member${groupEmails.length !== 1 ? 's' : ''}`
                            : 'Individual · solo'}
                    </span>
                </div>
                {registrationType === 'group' && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="min-h-[44px] self-start text-left text-xs text-gray-400 underline transition-colors hover:text-gray-600 sm:min-h-0 dark:hover:text-gray-300 touch-manipulation"
                    >
                        Edit members
                    </button>
                )}
            </div>

            {/* Group members summary */}
            {registrationType === 'group' && groupEmails.length > 0 && (
                <div className="mb-6 bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/60">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Registering these members</p>
                    <div className="flex flex-wrap gap-2">
                        {groupEmails.map((email, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                                <Mail size={10} className="text-gray-400" />
                                {email}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Error banner */}
            {capacityPrecheckError && (
                <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex gap-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{capacityPrecheckError}</p>
                </div>
            )}

            {error && (
                <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex gap-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Validation summary */}
            {Object.keys(validationErrors).length > 0 && touched.size > 0 && (
                <div className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
                    <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Please fill in all required fields before submitting.
                    </p>
                </div>
            )}

            <form id="event-order-form" onSubmit={handleSubmit} className="space-y-6">
                <PublicOrderForm
                    formData={formData}
                    answers={answers}
                    onAnswerChange={handleInputChange}
                    touched={touched}
                    validationErrors={validationErrors}
                />

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button
                        type="button"
                        id="form-back-btn"
                        onClick={onBack}
                        className="flex min-h-[48px] items-center justify-center gap-2 px-5 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 sm:flex-initial"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    <button
                        type="submit"
                        id="submit-registration-btn"
                        disabled={isSubmitting}
                        className="flex min-h-[48px] flex-1 touch-manipulation items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:scale-[1.01] hover:from-[#2e3d6e] hover:to-[#4a57a1] hover:shadow-xl active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-70 dark:shadow-blue-900/30"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader size={16} className="animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Registration
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ─── Main Registration Flow ──────────────────────────────────────────────────

export default function RegistrationFlow({
    eventId,
    eventTitle,
    eventSlug,
    orderFormId,
    formData,
    userEmail: initialUserEmail,
    tickets,
    breakoutSessions = [],
    existingCheckInPasses = [],
    existingTicketNames = [],
    hasPromotions = false,
    allowGroupRegistration = true,
    allowWaitlist = false,
    waitlistInviteToken,
    waitlistInviteTicketId = null,
    waitlistInviteEmail,
}: RegistrationFlowProps) {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string | undefined>(waitlistInviteEmail || initialUserEmail);
    const [step, setStep] = useState<Step>(
        waitlistInviteToken
            ? 'fill-form'
            : (waitlistInviteEmail || initialUserEmail)
                ? 'choose-ticket'
                : 'identify'
    );
    const [registrationType, setRegistrationType] = useState<RegistrationType>('individual');
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(waitlistInviteTicketId ?? null);
    const [groupEmails, setGroupEmails] = useState<string[]>([]);
    const [promotionCode, setPromotionCode] = useState<string | undefined>(undefined);

    if (existingCheckInPasses.length > 0) {
        return (
            <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] relative overflow-x-hidden">
                <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
                <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-400/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

                <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 sm:py-14">
                    <div className="text-center mb-8">
                        <span className="inline-block px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 shadow-sm">
                            Event Registration
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {eventTitle}
                        </h1>
                    </div>

                    <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl dark:shadow-black/20 p-6 sm:p-10">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/30">
                                <CheckCircle size={38} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                                You are already registered
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                                This account already has an active registration for this event, so duplicate self-registration is disabled.
                            </p>
                            {existingTicketNames.length > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Ticket{existingTicketNames.length > 1 ? 's' : ''}: {existingTicketNames.join(', ')}
                                </p>
                            )}
                        </div>

                        <div className="mt-7">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">
                                Your check-in QR pass{existingCheckInPasses.length > 1 ? 'es' : ''}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {existingCheckInPasses.map((pass) => (
                                    <CheckInPassCard
                                        key={`${pass.registrationId}-${pass.email}`}
                                        pass={pass}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                type="button"
                                onClick={() => router.push(`/events/${eventSlug}`)}
                                className="px-8 py-3 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                Back to Event
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleTicketSelect = (ticketId: number, appliedPromoCode?: string) => {
        setSelectedTicketId(ticketId);
        setPromotionCode(appliedPromoCode);
        if (!allowGroupRegistration) {
            setRegistrationType('individual');
            setStep('fill-form');
        } else {
            setStep('choose-type');
        }
    };

    const handleTypeSelect = (type: RegistrationType) => {
        setRegistrationType(type);
        if (type === 'individual') {
            setStep('fill-form');
        } else {
            setStep('group-members');
        }
    };

    const handleGroupContinue = (emails: string[]) => {
        setGroupEmails(emails);
        setStep('fill-form');
    };

    const handleBack = () => {
        if (step === 'fill-form') {
            if (registrationType === 'group') {
                setStep('group-members');
            } else {
                setStep(allowGroupRegistration ? 'choose-type' : 'choose-ticket');
            }
        } else if (step === 'group-members') {
            setStep('choose-type');
        } else if (step === 'choose-type') {
            setStep('choose-ticket');
        } else if (step === 'choose-ticket' && !initialUserEmail) {
            setStep('identify');
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] relative overflow-x-hidden">
            {/* Ambient glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-400/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-5 sm:py-14">

                {/* Event title header */}
                <div className="text-center mb-8">
                    <span className="inline-block px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 shadow-sm">
                        Event Registration
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {eventTitle}
                    </h1>
                </div>

                {/* Step indicator */}
                <StepIndicator currentStep={step} type={registrationType} userEmail={userEmail} allowGroupRegistration={allowGroupRegistration} />

                <RegistrationModeBanner step={step} registrationType={registrationType} />

                {/* Card */}
                <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-xl backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-black/20 sm:p-8 md:p-10">
                    {step === 'identify' && (
                        <IdentifyStep
                            onVerified={(email) => {
                                setUserEmail(email);
                                setStep('choose-ticket');
                            }}
                        />
                    )}
                    {step === 'choose-ticket' && (
                        <ChooseTicketStep
                            eventId={eventId}
                            eventTitle={eventTitle}
                            userEmail={userEmail}
                            tickets={tickets}
                            hasPromotions={hasPromotions}
                            allowWaitlist={allowWaitlist}
                            onSelect={handleTicketSelect}
                        />
                    )}
                    {step === 'choose-type' && (
                        <ChooseTypeStep onSelect={handleTypeSelect} onBack={handleBack} />
                    )}
                    {step === 'group-members' && (
                        <GroupMembersStep
                            initialEmails={groupEmails}
                            onBack={handleBack}
                            onContinue={handleGroupContinue}
                        />
                    )}
                    {step === 'fill-form' && (
                        <OrderFormStep
                            formData={formData}
                            eventId={eventId}
                            orderFormId={orderFormId}
                            registrationType={registrationType}
                            groupEmails={groupEmails}
                            onBack={handleBack}
                            eventSlug={eventSlug}
                            userEmail={userEmail}
                            ticketId={selectedTicketId}
                            tickets={tickets}
                            promotionCode={promotionCode}
                            waitlistInviteToken={waitlistInviteToken}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
