"use client";
import React from 'react';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Header = () => {
    return (
        <header className="bg-[#F8F9FA] dark:bg-gray-800 text-gray-800 dark:text-gray-100 h-16 flex items-center justify-between px-6 shadow-md z-10 border-b border-gray-200 dark:border-gray-700 transition-colors">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
                <Image
                    src="/icons/Logo.png"
                    alt="G Events Logo"
                    width={50}
                    height={50}
                    className="rounded-md"
                />
                <span className="font-bold text-3xl tracking-wide text-[#3D518C] dark:text-white">G Events</span>
            </div>

            {/* Right Side Profile */}
            <div className="flex items-center gap-6">
                {/* Theme Toggle */}
                <ThemeToggle />

                <button className="relative p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                    <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                    <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-300 dark:border-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden relative">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karylle"
                            alt="Profile"
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div className="flex flex-col text-xs">
                        <span className="font-semibold text-gray-800 dark:text-white">Karylle Bernate</span>
                        <span className="text-gray-500 dark:text-gray-400 font-light">notestobunny@gmail.com</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;