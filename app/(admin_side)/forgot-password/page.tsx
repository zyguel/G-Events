"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Check, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

type Step = 'email' | 'sent';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [currentSlide, setCurrentSlide] = useState(0);

    const slides: { title: React.ReactNode; description: string }[] = [
        {
            title: (
                <>
                    Experience the <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-gradient-x">
                        Extraordinary
                    </span>
                </>
            ),
            description: "Manage your events with style and precision. Welcome to the next generation of event administration."
        },
        {
            title: (
                <>
                    Seamlessly <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-gradient-x">
                        Connected
                    </span>
                </>
            ),
            description: "Stay in sync with your team and attendees. Real-time updates and effortless communication at your fingertips."
        },
        {
            title: (
                <>
                    Powerful <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 animate-gradient-x">
                        Insights
                    </span>
                </>
            ),
            description: "Gain deep visibility into your event performance with our advanced analytics and reporting tools."
        }
    ];

    // Slide auto-advance
    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) return;

        const supabase = createClient();
        setIsSubmitting(true);

        const redirectTo = typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=/reset-password`
            : '/auth/callback?next=/reset-password';

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        setIsSubmitting(false);

        if (resetError) {
            setError(resetError.message);
            return;
        }

        setStep('sent');
    };

    const stepBack = () => {
        if (step === 'sent') setStep('email');
        else router.push('/login');
    };

    return (
        <div className="h-screen w-full flex flex-col md:flex-row bg-[#020617] font-sans overflow-hidden relative">
            {/* Animated Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[40%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse delay-700" />

            {/* Left Side - Branding */}
            <div className="hidden md:flex w-full md:w-[50%] relative flex-col justify-center items-start z-10 p-12 lg:p-20">
                <div className="relative z-10 w-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative bg-slate-900/50 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                                <Image
                                    src="/icons/company-logo.svg"
                                    alt="G Events Logo"
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 invert brightness-0"
                                />
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-white tracking-wide drop-shadow-lg">G Events</span>
                    </div>

                    <div className="min-h-[280px] transition-all duration-500 ease-in-out">
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-white mb-8 drop-shadow-md animate-fade-in transition-opacity duration-500" key={`title-${currentSlide}`}>
                            {slides[currentSlide].title}
                        </h1>
                        <p className="text-gray-300 text-xl leading-relaxed mb-12 font-light max-w-2xl animate-fade-in transition-opacity duration-500" key={`desc-${currentSlide}`}>
                            {slides[currentSlide].description}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all duration-500 ${currentSlide === index
                                    ? 'w-24 bg-gradient-to-r from-blue-500 to-indigo-600'
                                    : 'w-6 bg-white/20 hover:bg-white/40'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-[50%] bg-white relative z-20 flex flex-col justify-center pt-0 p-6 md:p-10 lg:p-16 items-center transition-all duration-500 ease-in-out shadow-[-50px_0_100px_rgba(0,0,0,0.5)]">

                {/* Back Arrow — only on email step */}
                {step === 'email' && (
                    <button
                        onClick={stepBack}
                        className="absolute top-10 left-10 text-slate-400 hover:text-slate-600 transition-colors p-2 z-50"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={28} />
                    </button>
                )}

                {/* Wave Separator */}
                <div className="absolute top-0 bottom-0 left-0 -translate-x-[99%] w-24 hidden md:block z-30 pointer-events-none text-white overflow-hidden">
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="w-full h-full fill-current"
                    >
                        <path d="M100 0 C 50 0 50 100 100 100 Z" />
                    </svg>
                </div>

                <div className="w-full max-w-md mx-auto relative z-10">

                    {/* ── STEP 1: Email ── */}
                    {step === 'email' && (
                        <>
                            {/* Icon */}
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-5 shadow-sm ring-4 ring-white">
                                <Lock size={24} className="text-blue-500" strokeWidth={1.5} />
                            </div>

                            <div className="mb-5 text-left">
                                <h2 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">Forgot Password?</h2>
                                <p className="text-slate-500 font-medium text-base">Enter your email and we&apos;ll send you a reset link</p>
                            </div>

                            {error && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={handleEmailSubmit}>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1" htmlFor="fp-email">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                                        <div className="relative bg-white rounded-2xl shadow-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                type="email"
                                                id="fp-email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300"
                                                placeholder="your@email.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                                </button>

                                <div className="text-center mt-4">
                                    <p className="text-sm text-gray-500">
                                        Remember your password?{' '}
                                        <Link href="/login" className="font-bold text-blue-600 hover:text-indigo-600 transition-colors">
                                            Sign in
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </>
                    )}

                    {/* ── STEP 2: Email Sent ── */}
                    {step === 'sent' && (
                        <div className="flex flex-col items-start text-left animate-fade-in w-full">
                            {/* Success Icon */}
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-white">
                                <Mail size={28} className="text-blue-500" strokeWidth={1.5} />
                            </div>

                            <div className="w-full mb-6">
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight leading-snug">
                                    Check Your Email
                                </h2>
                                <p className="text-slate-500 font-medium text-base">
                                    We&apos;ve sent a password reset link to <span className="font-semibold text-slate-700">{email}</span>. Click the link in the email to reset your password.
                                </p>
                            </div>

                            <div className="w-full p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
                                <div className="flex items-start gap-3">
                                    <Check size={18} className="text-blue-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                                    <p className="text-sm text-blue-700 font-medium">
                                        Didn&apos;t receive it? Check your spam folder or{' '}
                                        <button
                                            type="button"
                                            onClick={() => setStep('email')}
                                            className="underline font-semibold hover:text-blue-900 transition-colors"
                                        >
                                            try again
                                        </button>.
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/login"
                                className="w-full text-center group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.98]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">Back to Sign In</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
