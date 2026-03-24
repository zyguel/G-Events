"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Check, Mail, Lock, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#020617]"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [authSuccess, setAuthSuccess] = useState('');

    const [currentSlide, setCurrentSlide] = useState(0);

    const nextPath = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/dashboard';

    const slides: { title: React.ReactNode; description: string }[] = [
        {
            title: (
                <>
                    Experience the <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400 animate-gradient-x">
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
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-gradient-x">
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
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-pink-500 to-red-500 animate-gradient-x">
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

    React.useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                router.replace(nextPath);
            }
        };
        checkSession();
    }, [router, nextPath]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError('');
        setEmailError('');
        setPasswordError('');
        setAuthSuccess('');

        if (!email && !password) {
            setGeneralError('Email and password are required.');
            return;
        }
        if (!email) {
            setEmailError('Email is required.');
            return;
        }
        if (!password) {
            setPasswordError('Password is required.');
            return;
        }

        setIsSubmitting(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            // Route Supabase errors to the most relevant field
            const msg = error.message.toLowerCase();
            if (msg.includes('email') || msg.includes('user not found')) {
                setEmailError(error.message);
            } else {
                setPasswordError(error.message);
            }
            setIsSubmitting(false);
            return;
        }

        router.replace(nextPath);
        router.refresh();
    };

    const handleGoogleLogin = async () => {
        setGeneralError('');
        setEmailError('');
        setPasswordError('');
        const supabase = createClient();
        let redirectTo = '';
        if (typeof window !== 'undefined') {
            redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
        });
        if (error) setGeneralError(error.message);
    };

    return (
        <div className="h-screen w-full flex flex-col md:flex-row bg-[#020617] font-sans overflow-hidden relative">
            {/* Animated Background Blobs (Global Backdrop) */}
            <div className="absolute top-[-20%] left-[-10%] w-150 h-150 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[40%] w-125 h-125 bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            <div className="absolute top-[30%] left-[20%] w-100 h-100 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse delay-700" />

            {/* Left Side - Branding */}
            <div className="hidden md:flex w-full md:w-[50%] relative flex-col justify-center items-start z-10 p-12 lg:p-20">

                <div className="relative z-10 w-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
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

                    <div className="min-h-70 transition-all duration-500 ease-in-out">
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
                                    ? 'w-24 bg-linear-to-r from-blue-500 to-indigo-600'
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

                    {/* Headers */}
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="text-slate-500 font-medium text-lg">
                            Sign in to continue to G Events
                        </p>
                    </div>

                    {authSuccess && (
                        <div className="mb-6 rounded-xl border px-4 py-3 text-sm border-green-200 bg-green-50 text-green-700">
                            {authSuccess}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSignIn}>
                        {generalError && (
                            <p className="text-xs text-red-500 mb-1">{generalError}</p>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                                <div className="relative bg-white rounded-2xl shadow-sm">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            {emailError && <p className="mt-1.5 ml-1 text-xs text-red-500">{emailError}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1" htmlFor="password">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                                <div className="relative bg-white rounded-2xl shadow-sm">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300"
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
                            {passwordError && <p className="mt-1.5 ml-1 text-xs text-red-500">{passwordError}</p>}
                        </div>

                        {/* Remember Me + Forgot Password */}
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
                                        {rememberMe && <Check size={12} className="text-white stroke-4" />}
                                    </div>
                                </div>
                                <span className="ml-2.5 text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors select-none">Remember Me</span>
                            </label>
                            <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-indigo-600 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full group relative overflow-hidden bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isSubmitting ? 'Please wait...' : 'Sign In'}
                                {!isSubmitting && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                            <div className="absolute inset-0 bg-linear-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                                <span className="px-3 bg-white text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group"
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

                    <div className="text-center mt-8">
                        <p className="text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-bold text-blue-600 hover:text-indigo-600 transition-colors">
                                Sign up now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
