"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Check, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans">
            {/* Left Side - Branding */}
            <div className="hidden md:flex w-full md:w-[45%] relative flex-col justify-center items-start min-h-[500px] md:h-auto p-4
             bg-white shrink-0 overflow-hidden">
                {/* Blob Container */}
                <div className="relative w-full h-full flex items-center justify-start">
                    {/* Background Blob */}
                    <div className="absolute inset-0 w-full h-full">
                        <Image
                            src="/images/content.svg"
                            alt="Background Shape"
                            fill
                            className="object-contain object-left origin-left scale-x-115"
                            priority
                        />
                    </div>

                    {/* Content tailored to fit inside the blob */}
                    <div className="relative z-10 w-full h-full flex flex-col justify-center items-start pl-[8%] pr-[10%] pb-60 text-left">
                        {/* Logo Section */}
                        <div className="flex items-center gap-5 mb-6">
                            <Image
                                src="/images/company-logo.svg"
                                alt="G Events Logo"
                                width={80}
                                height={80}
                                className="w-10 h-10 md:w-16 md:h-16"
                            />
                            <span className="text-3xl md:text-5xl font-bold text-white tracking-wide">G Events</span>
                        </div>

                        <h1 className="text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-4">
                            Start Your <br />
                            Journey <br />
                            with Us
                        </h1>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-[55%] bg-white p-6 md:p-12 lg:p-16 flex flex-col justify-center flex-1 relative z-20">
                <div className="w-full max-w-lg mx-auto">
                    {/* Mobile Logo */}
                    <div className="flex md:hidden items-center gap-3 mb-8">
                        <Image
                            src="/images/company-logo.svg"
                            alt="G Events Logo"
                            width={40}
                            height={40}
                            className="w-10 h-10"
                        />
                        <span className="text-2xl font-bold text-gray-900 tracking-wide">G Events</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                        <p className="text-gray-500 text-sm">Sign in to your account</p>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="domat@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe(!rememberMe)}
                                    />
                                    <div className={`w-5 h-5 border rounded transition-colors flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                        {rememberMe && <Check size={12} className="text-white" />}
                                    </div>
                                </div>
                                <span className="ml-2 text-sm text-gray-600 select-none">Remember Me</span>
                            </label>
                            <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                Forgot Password
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            className="w-full bg-[#4361EE] hover:bg-[#3651d4] text-white font-medium py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
                        >
                            Sign in
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        {/* Social Login */}
                        <button
                            type="button"
                            className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                            Sign in with Google
                        </button>

                        {/* Sign Up Link */}
                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link href="#" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </div>

                    </form>
                </div>
            </div>

        </div>
    );
}
