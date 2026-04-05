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
    existingCheckInPasses?: CheckInPass[];
    existingTicketNames?: string[];
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

            <div className="mt-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 min-h-[180px]">
                {qrDataUrl ? (
                    <img src={qrDataUrl} alt={`Check-in QR for ${pass.email}`} className="w-44 h-44" />
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

function StepIndicator({ currentStep, type, userEmail }: { currentStep: Step; type: RegistrationType; userEmail?: string }) {
    const steps = type === 'group'
        ? (userEmail ? ['Tickets', 'Type', 'Members', 'Form'] : ['Identify', 'Tickets', 'Type', 'Members', 'Form'])
        : (userEmail ? ['Tickets', 'Type', 'Form'] : ['Identify', 'Tickets', 'Type', 'Form']);

    const stepKeys: Step[] = type === 'group'
        ? (userEmail ? ['choose-ticket', 'choose-type', 'group-members', 'fill-form'] : ['identify', 'choose-ticket', 'choose-type', 'group-members', 'fill-form'])
        : (userEmail ? ['choose-ticket', 'choose-type', 'fill-form'] : ['identify', 'choose-ticket', 'choose-type', 'fill-form']);

    const currentIndex = stepKeys.indexOf(currentStep);

    return (
        <div className="flex items-center justify-center gap-0 mb-10 overflow-x-auto pb-4 no-scrollbar">
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
                    className="w-full flex items-center justify-center gap-2 py-5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white font-black rounded-2xl shadow-xl shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
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
    tickets,
    onSelect,
}: {
    tickets: RegistrationFlowProps['tickets'];
    onSelect: (ticketId: number) => void;
}) {
    const [hovered, setHovered] = useState<number | null>(null);

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
                        onClick={() => !ticket.is_sold_out && onSelect(ticket.id)}
                        onMouseEnter={() => setHovered(ticket.id)}
                        onMouseLeave={() => setHovered(null)}
                        disabled={ticket.is_sold_out}
                        className={`
                            relative group flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300
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
                            <p className="text-lg font-black text-[#3D518C] dark:text-blue-400">
                                {ticket.price === 0 ? 'FREE' : `$${ticket.price}`}
                            </p>
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
            <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                    How are you registering?
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose whether you're signing up alone or with a group.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                {/* Individual */}
                <button
                    id="reg-type-individual"
                    onClick={() => onSelect('individual')}
                    onMouseEnter={() => setHovered('individual')}
                    onMouseLeave={() => setHovered(null)}
                    className={`
                        relative group flex flex-col items-center text-center gap-5 p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer
                        ${hovered === 'individual'
                            ? 'border-[#3D518C] bg-gradient-to-br from-[#3D518C]/5 to-[#5C6BC0]/10 shadow-xl shadow-blue-100 dark:shadow-blue-900/20 scale-[1.02]'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:shadow-lg'}
                    `}
                >
                    <div className={`
                        w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${hovered === 'individual'
                            ? 'bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] shadow-lg shadow-blue-300/40'
                            : 'bg-blue-50 dark:bg-blue-900/20'}
                    `}>
                        <User size={36} className={hovered === 'individual' ? 'text-white' : 'text-[#3D518C] dark:text-blue-400'} />
                    </div>
                    <div>
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white mb-1.5">Individual</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Register just for yourself. Fill out the form with your own details.
                        </p>
                    </div>
                    <div className={`
                        flex items-center gap-1.5 text-sm font-bold transition-all duration-300
                        ${hovered === 'individual' ? 'text-[#3D518C] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                    `}>
                        Continue <ChevronRight size={16} />
                    </div>
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                        <div className={`absolute inset-0 bg-gradient-to-br from-white/40 to-transparent transition-opacity duration-300 ${hovered === 'individual' ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                </button>

                {/* Group */}
                <button
                    id="reg-type-group"
                    onClick={() => onSelect('group')}
                    onMouseEnter={() => setHovered('group')}
                    onMouseLeave={() => setHovered(null)}
                    className={`
                        relative group flex flex-col items-center text-center gap-5 p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer
                        ${hovered === 'group'
                            ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 scale-[1.02]'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:shadow-lg'}
                    `}
                >
                    <div className={`
                        w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${hovered === 'group'
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-300/40'
                            : 'bg-indigo-50 dark:bg-indigo-900/20'}
                    `}>
                        <Users size={36} className={hovered === 'group' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'} />
                    </div>
                    <div>
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white mb-1.5">Group</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Register with friends or colleagues. Add their emails to include them.
                        </p>
                    </div>
                    <div className={`
                        flex items-center gap-1.5 text-sm font-bold transition-all duration-300
                        ${hovered === 'group' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
                    `}>
                        Continue <ChevronRight size={16} />
                    </div>
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                        <div className={`absolute inset-0 bg-gradient-to-br from-white/40 to-transparent transition-opacity duration-300 ${hovered === 'group' ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                </button>
            </div>

            {/* Back button */}
            <div className="flex justify-center border-t border-gray-100 dark:border-gray-800 pt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
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
                    Enter the email addresses of everyone in your group. Each member will be registered under this submission.
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
                className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-[#3D518C] hover:text-[#3D518C] dark:hover:border-blue-500 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 flex items-center justify-center gap-2 mb-6"
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
            <div className="flex gap-3">
                <button
                    type="button"
                    id="group-back-btn"
                    onClick={onBack}
                    className="flex items-center gap-2 px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>
                <button
                    type="button"
                    id="group-continue-btn"
                    onClick={handleContinue}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] hover:from-[#2e3d6e] hover:to-[#4a57a1] text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
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
}) {
    const router = useRouter();
    const [answers, setAnswers] = useState<FormAnswers>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

        await submit(formData, answers, ticketId, registrationType === 'group' ? groupEmails : []);
    }, [formData, answers, submit, ticketId, registrationType, groupEmails]);

    const renderInput = (input: { id: string; question: string; type: string; required: boolean; options?: string[] }) => {
        const base = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3D518C]/30 focus:border-[#3D518C] dark:focus:border-blue-500 transition-all duration-200";
        const hasError = touched.has(input.id) && !!validationErrors[input.id];
        const errorClass = hasError ? 'border-red-300 dark:border-red-700 ring-2 ring-red-100 dark:ring-red-900/30 focus:border-red-400' : '';
        const val = answers[input.id];

        switch (input.type) {
            case 'short_answer':
                return (
                    <input
                        id={`field-${input.id}`}
                        type="text"
                        className={`${base} ${errorClass}`}
                        placeholder={`Enter your response`}
                        value={(val as string) || ''}
                        onChange={e => handleInputChange(input.id, e.target.value)}
                    />
                );
            case 'paragraph':
                return (
                    <textarea
                        id={`field-${input.id}`}
                        className={`${base} ${errorClass} resize-none`}
                        rows={4}
                        placeholder="Enter your response..."
                        value={(val as string) || ''}
                        onChange={e => handleInputChange(input.id, e.target.value)}
                    />
                );
            case 'dropdown':
                return (
                    <select
                        id={`field-${input.id}`}
                        className={`${base} ${errorClass}`}
                        value={(val as string) || ''}
                        onChange={e => handleInputChange(input.id, e.target.value)}
                    >
                        <option value="">Select an option</option>
                        {input.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'multiple_choice':
                return (
                    <div className="space-y-2.5">
                        {input.options?.map((opt, i) => (
                            <label key={i} className={`
                                flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200
                                ${val === opt
                                    ? 'border-[#3D518C] bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60'}
                            `}>
                                <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${val === opt ? 'border-[#3D518C] dark:border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {val === opt && <div className="w-2 h-2 rounded-full bg-[#3D518C] dark:bg-blue-500" />}
                                </div>
                                <input
                                    type="radio"
                                    name={input.id}
                                    value={opt}
                                    checked={val === opt}
                                    onChange={e => handleInputChange(input.id, e.target.value)}
                                    className="sr-only"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'checkboxes':
                return (
                    <div className="space-y-2.5">
                        {input.options?.map((opt, i) => {
                            const selected = Array.isArray(val) ? val : [];
                            const isChecked = selected.includes(opt);
                            return (
                                <label key={i} className={`
                                    flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200
                                    ${isChecked
                                        ? 'border-[#3D518C] bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60'}
                                `}>
                                    <div className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'border-[#3D518C] bg-[#3D518C] dark:border-blue-500 dark:bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        value={opt}
                                        checked={isChecked}
                                        onChange={() => {
                                            const next = isChecked ? selected.filter(v => v !== opt) : [...selected, opt];
                                            handleInputChange(input.id, next);
                                        }}
                                        className="sr-only"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                );
            case 'file_upload':
                return (
                    <label className={`flex items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 py-8 hover:border-[#3D518C] ${hasError ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700/30`}>
                        <div className="flex flex-col items-center gap-2 text-center px-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div>
                                {val ? (
                                    <p className="text-sm font-semibold text-[#3D518C] dark:text-blue-400">{val as string}</p>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">or drag and drop your file here</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <input type="file" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleInputChange(input.id, file.name);
                        }} />
                    </label>
                );
            case 'date':
                return (
                    <input
                        id={`field-${input.id}`}
                        type="date"
                        className={`${base} ${errorClass}`}
                        value={(val as string) || ''}
                        onChange={e => handleInputChange(input.id, e.target.value)}
                    />
                );
            case 'time':
                return (
                    <input
                        id={`field-${input.id}`}
                        type="time"
                        className={`${base} ${errorClass}`}
                        value={(val as string) || ''}
                        onChange={e => handleInputChange(input.id, e.target.value)}
                    />
                );
            default:
                return null;
        }
    };

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
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Group Members Registered</p>
                        <ul className="space-y-1">
                            {groupEmails.map((email, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <Check size={13} className="text-green-500 shrink-0" />
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
            <div className="flex items-center gap-3 mb-6">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
                    registrationType === 'group'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/40'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-[#3D518C] dark:text-blue-400 border-blue-100 dark:border-blue-800/40'
                }`}>
                    {registrationType === 'group' ? <Users size={14} /> : <User size={14} />}
                    {registrationType === 'group' ? `Group Registration · ${groupEmails.length} member${groupEmails.length !== 1 ? 's' : ''}` : 'Individual Registration'}
                </div>
                {registrationType === 'group' && (
                    <button type="button" onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors">
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
                {formData.sections.map((section, sIdx) => (
                    <div key={section.id} className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-sm">
                        {/* Section header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/60 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/40 dark:to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] flex items-center justify-center shrink-0 shadow-md">
                                    <span className="text-white text-xs font-bold">{sIdx + 1}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{section.title}</h3>
                                    {section.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section inputs */}
                        <div className="p-6 space-y-6">
                            {section.inputs.map(input => (
                                <div key={input.id} className="space-y-2">
                                    <label htmlFor={`field-${input.id}`} className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {input.question}
                                        {input.required && (
                                            <span className="text-red-500 text-base leading-none">*</span>
                                        )}
                                    </label>
                                    {renderInput(input)}
                                    {touched.has(input.id) && validationErrors[input.id] && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                            <AlertCircle size={11} />
                                            {validationErrors[input.id]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        id="form-back-btn"
                        onClick={onBack}
                        className="flex items-center gap-2 px-5 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    <button
                        type="submit"
                        id="submit-registration-btn"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] hover:from-[#2e3d6e] hover:to-[#4a57a1] disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
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
    existingCheckInPasses = [],
    existingTicketNames = [],
}: RegistrationFlowProps) {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string | undefined>(initialUserEmail);
    const [step, setStep] = useState<Step>(initialUserEmail ? 'choose-ticket' : 'identify');
    const [registrationType, setRegistrationType] = useState<RegistrationType>('individual');
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [groupEmails, setGroupEmails] = useState<string[]>([]);

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

    const handleTicketSelect = (ticketId: number) => {
        setSelectedTicketId(ticketId);
        setStep('choose-type');
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
                setStep('choose-type');
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

            <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 sm:py-14">

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
                <StepIndicator currentStep={step} type={registrationType} userEmail={userEmail} />

                {/* Card */}
                <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl dark:shadow-black/20 p-6 sm:p-10">
                    {step === 'identify' && (
                        <IdentifyStep
                            onVerified={(email) => {
                                setUserEmail(email);
                                setStep('choose-ticket');
                            }}
                        />
                    )}
                    {step === 'choose-ticket' && (
                        <ChooseTicketStep tickets={tickets} onSelect={handleTicketSelect} />
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
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
