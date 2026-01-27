"use client";
import React from 'react';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Header = () => {
    return (
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 h-16 flex items-center justify-between px-8 shadow-sm z-10 border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Image
                        src="/icons/company-logo.svg"
                        alt="G Events Logo"
                        width={40}
                        height={40}
                        className="drop-shadow-sm"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-xl tracking-tight text-[#3D518C] dark:text-white leading-none">
                        G Events
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase">
                        Event Management
                    </span>
                </div>
            </div>

            {/* Right Side Profile */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notification Bell */}
                <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 group">
                    <Bell size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-[#3D518C] dark:group-hover:text-white transition-colors" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] overflow-hidden relative ring-2 ring-gray-200 dark:ring-gray-700 shadow-sm">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karylle"
                            alt="Profile"
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-800 dark:text-white leading-tight">Karylle Bernate</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">notestobunny@gmail.com</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;