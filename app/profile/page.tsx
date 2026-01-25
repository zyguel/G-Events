"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Camera, Mail, Phone, MapPin, Calendar, Briefcase, Edit3, Shield, Award } from 'lucide-react';

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);

    const user = {
        name: 'Karylle Bernate',
        email: 'notestobunny@gmail.com',
        phone: '+63 912 345 6789',
        location: 'Cebu City, Philippines',
        role: 'Admin',
        department: 'Event Management',
        joinedDate: 'January 2024',
        eventsManaged: 24,
        totalAttendees: 5840,
    };

    const recentEvents = [
        { id: 1, name: 'DevFest Cebu 2024', role: 'Lead Organizer', date: 'November 2024' },
        { id: 2, name: 'Google I/O Extended', role: 'Co-Organizer', date: 'July 2024' },
        { id: 3, name: 'Women Techmakers', role: 'Volunteer Lead', date: 'March 2024' },
    ];

    const achievements = [
        { id: 1, title: 'Top Organizer', description: 'Managed 20+ events', icon: Award, color: 'from-amber-500 to-orange-500' },
        { id: 2, title: 'Verified Member', description: 'Account verified', icon: Shield, color: 'from-emerald-500 to-green-600' },
        { id: 3, title: 'Early Adopter', description: 'Joined in 2024', icon: Calendar, color: 'from-purple-500 to-pink-500' },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="profile" />

                <main className="flex-1 ml-20 overflow-y-auto p-8">
                    <div className="space-y-6 max-w-5xl mx-auto">

                        {/* Profile Header Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
                            {/* Cover Image */}
                            <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                                <button className="absolute bottom-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm">
                                    <Camera size={18} className="text-white" />
                                </button>
                            </div>

                            {/* Profile Info */}
                            <div className="px-6 pb-6 -mt-12 relative">
                                <div className="flex flex-col md:flex-row md:items-end gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-700 p-1 shadow-lg">
                                            <img
                                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karylle"
                                                alt="Profile"
                                                className="w-full h-full rounded-xl object-cover"
                                            />
                                        </div>
                                        <button className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors">
                                            <Camera size={14} />
                                        </button>
                                    </div>

                                    {/* Name and Role */}
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                                {user.role}
                                            </span>
                                            <span className="text-sm">{user.department}</span>
                                        </p>
                                    </div>

                                    {/* Edit Button */}
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm"
                                    >
                                        <Edit3 size={16} />
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Events Managed</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{user.eventsManaged}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <Calendar size={22} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Attendees</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{user.totalAttendees.toLocaleString()}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <Briefcase size={22} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{user.joinedDate}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Award size={22} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Contact Information */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Contact Information</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your personal contact details</p>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Mail size={14} /> Email Address
                                        </label>
                                        <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Phone size={14} /> Phone Number
                                        </label>
                                        <p className="font-medium text-gray-900 dark:text-white">{user.phone}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <MapPin size={14} /> Location
                                        </label>
                                        <p className="font-medium text-gray-900 dark:text-white">{user.location}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Briefcase size={14} /> Department
                                        </label>
                                        <p className="font-medium text-gray-900 dark:text-white">{user.department}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Achievements</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your earned badges</p>
                                </div>
                                <div className="p-4 space-y-3">
                                    {achievements.map((achievement) => {
                                        const IconComponent = achievement.icon;
                                        return (
                                            <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-white`}>
                                                    <IconComponent size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{achievement.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Recent Events */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Recent Events</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Events you've been involved in</p>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {recentEvents.map((event) => (
                                    <div key={event.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {event.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:text-white">{event.name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{event.role}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{event.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
