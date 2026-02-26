"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<'login' | 'verification' | 'success'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [currentSlide, setCurrentSlide] = useState(0);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [hasError, setHasError] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]*$/.test(value)) return;

        let formattedValue = value;
        if (formattedValue.length > 1) {
            formattedValue = formattedValue.slice(0, 1);
        }

        const newOtp = [...otp];
        newOtp[index] = formattedValue;
        setOtp(newOtp);
        setHasError(false);

        // Auto focus next input
        if (formattedValue && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Transition to Verification Step
        setStep('verification');
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) {
            setHasError(true);
            return;
        }

        // Mocking verification failure for demo purposes if code is "000000"
        if (code === '000000') {
            setHasError(true);
            return;
        }

        // Transition to success state
        setStep('success');

        // Optional: Redirect to dashboard after a delay
        setTimeout(() => {
            router.push('/dashboard');
        }, 2000);
    };

    return (
        <div className="h-screen w-full flex flex-col md:flex-row bg-[#020617] font-sans overflow-hidden relative">
            {/* Animated Background Blobs (Global Backdrop) */}
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
            <div className="w-full md:w-[50%] bg-white relative z-20 flex flex-col justify-start pt-16 md:pt-20 lg:pt-24 p-6 md:p-12 lg:p-24 items-center transition-all duration-500 ease-in-out shadow-[-50px_0_100px_rgba(0,0,0,0.5)]">

                {/* Back Arrow for Verification */}
                {step === 'verification' && (
                    <button
                        onClick={() => setStep('login')}
                        className="absolute top-10 left-10 text-slate-400 hover:text-slate-600 transition-colors p-2 z-50"
                        aria-label="Back to login"
                    >
                        <ArrowLeft size={28} />
                    </button>
                )}

                {/* Wave Separator (Gentle Curve attached to the left of the white panel) */}
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
                    {/* Decoration */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-50 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

                    {step === 'login' && (
                        <>
                            {/* Headers */}
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome Back</h2>
                                <p className="text-slate-500 font-medium text-lg">Sign in to continue to G Events</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleLoginSubmit}>
                                {/* Email Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1" htmlFor="email">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                                        <div className="relative bg-white rounded-2xl shadow-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1" htmlFor="password">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                                        <div className="relative bg-white rounded-2xl shadow-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between pt-2">
                                    <label className="flex items-center cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={rememberMe}
                                                onChange={() => setRememberMe(!rememberMe)}
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-300 flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600 scale-105' : 'bg-transparent border-gray-300 group-hover:border-blue-400'}`}>
                                                {rememberMe && <Check size={12} className="text-white stroke-[4]" />}
                                            </div>
                                        </div>
                                        <span className="ml-2.5 text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors select-none">Remember Me</span>
                                    </label>
                                    <Link href="#" className="text-sm font-semibold text-blue-600 hover:text-indigo-600 transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>

                                {/* Login Button */}
                                <button
                                    type="submit"
                                    className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition duration-300 transition-opacity"></div>
                                </button>

                                {/* Divider */}
                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                                        <span className="px-3 bg-white text-gray-400">Or continue with</span>
                                    </div>
                                </div>

                                {/* Social Login */}
                                <button
                                    type="button"
                                    className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group"
                                >
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Google
                                </button>
                            </form>

                            {/* Sign Up Link */}
                            <div className="text-center mt-8">
                                <p className="text-sm text-gray-500">
                                    Don't have an account?{' '}
                                    <Link href="#" className="font-bold text-blue-600 hover:text-indigo-600 transition-colors">
                                        Sign up now
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}

                    {step === 'verification' && (
                        <div className="w-full">
                            {/* Icon */}
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-white mx-auto md:mx-0">
                                <Mail size={28} className="text-blue-500" strokeWidth={1.5} />
                            </div>

                            {/* Headers */}
                            <div className="mb-10 w-full text-center md:text-left">
                                <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">2FA Verification</h2>
                                <p className="text-slate-500 font-medium text-lg">Check your email to see the verification code</p>
                            </div>

                            <form className="w-full" onSubmit={handleVerify}>

                                {/* OTP Inputs */}
                                <div className="flex justify-between w-full mb-2 gap-2 md:gap-3">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => {
                                                inputRefs.current[index] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-[1.5px] text-center text-xl font-medium focus:outline-none transition-colors ${hasError
                                                ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                : 'border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Error Message */}
                                <div className={`flex items-center justify-center md:justify-start gap-1.5 text-red-500 text-[13px] font-medium mt-3 mb-8 transition-opacity duration-300 ${hasError ? 'opacity-100' : 'opacity-0 select-none'}`}>
                                    <AlertCircle size={14} className="fill-red-500 text-white" />
                                    <span>Invalid OTP. Please enter a valid OTP.</span>
                                </div>

                                {/* Verify Button */}
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.99] text-base"
                                >
                                    Verify
                                </button>
                            </form>

                            {/* Resend Code Link */}
                            <div className="mt-8 text-center w-full">
                                <p className="text-[15px] text-slate-500 font-medium">
                                    Didn't receive the code?{' '}
                                    <button type="button" className="text-blue-600 font-semibold hover:text-indigo-600 transition-colors">
                                        Resend code
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center md:items-start text-center md:text-left animate-fade-in w-full">
                            {/* Success Icon */}
                            <div className="w-16 h-16 bg-[#18a020] rounded-full flex items-center justify-center mb-8 shadow-md shadow-green-500/20 mx-auto md:mx-0">
                                <Check size={32} className="text-white" strokeWidth={3} />
                            </div>

                            {/* Success Headers */}
                            <div className="w-full">
                                <h2 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight leading-snug">
                                    Your Log in Session<br />
                                    Successfully Verified
                                </h2>
                                <p className="text-[#516181] font-medium text-lg mt-2">Let's continue where we left.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
