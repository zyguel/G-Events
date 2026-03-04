"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Check, ArrowLeft, AlertCircle } from 'lucide-react';

type Step = 'email' | 'otp' | 'new-password' | 'success';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [hasOtpError, setHasOtpError] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [countdown, setCountdown] = useState(59);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
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
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // OTP countdown timer
    useEffect(() => {
        if (step !== 'otp') return;
        setCountdown(59);
        setCanResend(false);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [step]);

    // --- OTP Handlers ---
    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]*$/.test(value)) return;
        const formatted = value.slice(0, 1);
        const newOtp = [...otp];
        newOtp[index] = formatted;
        setOtp(newOtp);
        setHasOtpError(false);
        if (formatted && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = () => {
        if (!canResend) return;
        setOtp(['', '', '', '', '', '']);
        setHasOtpError(false);
        setCountdown(59);
        setCanResend(false);
        // trigger re-mount of timer via step re-set trick
        setStep('email');
        setTimeout(() => setStep('otp'), 0);
    };

    // --- Form Submits ---
    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStep('otp');
    };

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.join('').length < 6) { setHasOtpError(true); return; }
        if (otp.join('') === '000000') { setHasOtpError(true); return; }
        setStep('new-password');
    };

    const handleNewPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords don't match.");
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters.");
            return;
        }
        setPasswordError('');
        setStep('success');
    };

    const stepBack = () => {
        if (step === 'otp') setStep('email');
        else if (step === 'new-password') setStep('otp');
        else if (step === 'email') router.push('/login');
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

                {/* Back Arrow */}
                {step !== 'success' && (
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
                                <p className="text-slate-500 font-medium text-base">Enter your email to reset your password</p>
                            </div>

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
                                                placeholder="joemama@example.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">Submit</span>
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

                    {/* ── STEP 2: OTP ── */}
                    {step === 'otp' && (
                        <div className="w-full">
                            {/* Icon */}
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-5 shadow-sm ring-4 ring-white">
                                <Mail size={24} className="text-blue-500" strokeWidth={1.5} />
                            </div>

                            <div className="mb-6 text-left">
                                <h2 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">OTP Verification</h2>
                                <p className="text-slate-500 font-medium text-base">Check your email to see the verification code</p>
                            </div>

                            <form onSubmit={handleOtpSubmit}>
                                {/* OTP Inputs */}
                                <div className="flex justify-between w-full mb-2 gap-2 md:gap-3">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-[1.5px] text-center text-xl font-medium focus:outline-none transition-colors ${hasOtpError
                                                ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                : 'border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Error */}
                                <div className={`flex items-center gap-1.5 text-red-500 text-[13px] font-medium mt-3 mb-5 transition-opacity duration-300 ${hasOtpError ? 'opacity-100' : 'opacity-0 select-none'}`}>
                                    <AlertCircle size={14} className="fill-red-500 text-white" />
                                    <span>Invalid OTP. Please enter a valid OTP.</span>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.99]"
                                >
                                    Verify
                                </button>
                            </form>

                            {/* Resend */}
                            <div className="mt-5 text-center w-full">
                                <p className="text-[15px] text-slate-500 font-medium">
                                    {canResend ? (
                                        <>
                                            Didn&apos;t receive the code?{' '}
                                            <button type="button" onClick={handleResend} className="text-blue-600 font-semibold hover:text-indigo-600 transition-colors">
                                                Resend code
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            Resend code in{' '}
                                            <span className="text-blue-600 font-semibold">
                                                00:{countdown.toString().padStart(2, '0')}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: New Password ── */}
                    {step === 'new-password' && (
                        <>
                            {/* Icon */}
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-5 shadow-sm ring-4 ring-white">
                                <Lock size={24} className="text-blue-500" strokeWidth={1.5} />
                            </div>

                            <div className="mb-5 text-left">
                                <h2 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">Set New Password</h2>
                                <p className="text-slate-500 font-medium text-base">Enter your new password to complete the reset process</p>
                            </div>

                            <form className="space-y-4" onSubmit={handleNewPasswordSubmit}>
                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1" htmlFor="new-password">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                                        <div className="relative bg-white rounded-2xl shadow-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                id="new-password"
                                                value={newPassword}
                                                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                                                className="w-full pl-12 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300"
                                                placeholder="Enter new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                            >
                                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1" htmlFor="confirm-new-password">
                                        Confirm New Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                                        <div className="relative bg-white rounded-2xl shadow-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                id="confirm-new-password"
                                                value={confirmPassword}
                                                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                                                className="w-full pl-12 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300"
                                                placeholder="Confirm new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                            >
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Password Error */}
                                {passwordError && (
                                    <div className="flex items-center gap-1.5 text-red-500 text-[13px] font-medium">
                                        <AlertCircle size={14} className="fill-red-500 text-white" />
                                        <span>{passwordError}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">Save New Password</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                                </button>

                                <div className="text-center mt-3">
                                    <p className="text-[15px] text-slate-500 font-medium">
                                        Remember old password?{' '}
                                        <Link href="/login" className="font-bold text-blue-600 hover:text-indigo-600 transition-colors">
                                            Sign in
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </>
                    )}

                    {/* ── STEP 4: Success ── */}
                    {step === 'success' && (
                        <div className="flex flex-col items-start text-left animate-fade-in w-full">
                            {/* Success Icon */}
                            <div className="w-16 h-16 bg-[#18a020] rounded-full flex items-center justify-center mb-6 shadow-md shadow-green-500/20">
                                <Check size={32} className="text-white" strokeWidth={3} />
                            </div>

                            <div className="w-full mb-6">
                                <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight leading-snug">
                                    Your Password Successfully<br />Changed
                                </h2>
                                <p className="text-slate-500 font-medium text-base">Sign in to your account with your new password</p>
                            </div>

                            <button
                                onClick={() => router.push('/login')}
                                className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.98]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">Sign in</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
