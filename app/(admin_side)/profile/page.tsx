"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { Camera, Mail, Phone, MapPin, Calendar, Briefcase, Edit3, Shield, Award, Check, X, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    location: string;
    role: string;
    department: string;
    joinedDate: string;
    avatarSeed: string;
    eventsManaged: number;
    totalAttendees: number;
    emailConfirmed: boolean;
}

interface RecentEvent {
    id: number;
    name: string;
    date: string;
}

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editData, setEditData] = useState({ phone: '', location: '', department: '' });
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const loadProfile = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch authenticated user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const name = user.user_metadata?.name
                    || user.user_metadata?.full_name
                    || user.email?.split('@')[0]
                    || 'User';

                const phone = user.user_metadata?.phone || '';
                const location = user.user_metadata?.location || '';
                const department = user.user_metadata?.department || 'Event Management';
                const role = user.user_metadata?.role || 'Admin';

                const joinedDate = user.created_at
                    ? format(new Date(user.created_at), 'MMMM yyyy')
                    : '—';

                // 2. Fetch events
                const { data: eventsData, error: eventsError } = await supabase
                    .from('Event')
                    .select('id, title, event_start_at')
                    .order('event_start_at', { ascending: false });

                const events: Array<{ id: number; title: string; event_start_at: string | null }> =
                    (!eventsError && eventsData) ? eventsData : [];
                const eventsManaged = events.length;

                // 3. Fetch total registrations across all events (non-cancelled)
                const { count: totalAttendees } = await supabase
                    .from('Registration')
                    .select('id', { count: 'exact', head: true })
                    .neq('status', 'cancelled');

                // 4. Build recent events list (latest 3)
                const mapped = events.slice(0, 3).map((e) => ({
                    id: e.id,
                    name: e.title,
                    date: e.event_start_at
                        ? format(new Date(e.event_start_at), 'MMMM yyyy')
                        : '—',
                }));

                setRecentEvents(mapped);
                setProfile({
                    name,
                    email: user.email ?? '',
                    phone,
                    location,
                    role,
                    department,
                    joinedDate,
                    avatarSeed: encodeURIComponent(name),
                    eventsManaged,
                    totalAttendees: totalAttendees ?? 0,
                    emailConfirmed: !!user.email_confirmed_at,
                });
                setEditData({ phone, location, department });
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            data: {
                phone: editData.phone,
                location: editData.location,
                department: editData.department,
            },
        });
        if (!error) {
            setProfile(prev => prev ? { ...prev, ...editData } : prev);
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const handleCancelEdit = () => {
        if (profile) setEditData({ phone: profile.phone, location: profile.location, department: profile.department });
        setIsEditing(false);
    };

    // Dynamically compute achievements from real data
    const achievements = profile ? [
        profile.eventsManaged >= 10
            ? { id: 1, title: 'Top Organizer', description: `Managed ${profile.eventsManaged}+ events`, icon: Award, color: 'from-amber-500 to-orange-500', earned: true }
            : { id: 1, title: 'Rising Organizer', description: `${profile.eventsManaged} event${profile.eventsManaged !== 1 ? 's' : ''} managed`, icon: Award, color: 'from-gray-400 to-gray-500', earned: false },
        { id: 2, title: 'Verified Member', description: profile.emailConfirmed ? 'Email verified' : 'Email not verified', icon: Shield, color: profile.emailConfirmed ? 'from-emerald-500 to-green-600' : 'from-gray-400 to-gray-500', earned: profile.emailConfirmed },
        { id: 3, title: 'Early Adopter', description: `Joined ${profile.joinedDate}`, icon: Calendar, color: 'from-purple-500 to-pink-500', earned: true },
    ] : [];

    const SkeletonLine = ({ w }: { w: string }) => (
        <div className={`h-3.5 ${w} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="profile" />

                <main className="flex-1 ml-20 overflow-y-auto p-8">
                    <div className="space-y-6 max-w-5xl mx-auto">

                        {/* Profile Header Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
                            <div className="h-32 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                                <button className="absolute bottom-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm">
                                    <Camera size={18} className="text-white" />
                                </button>
                            </div>

                            <div className="px-6 pb-6 -mt-12 relative">
                                <div className="flex flex-col md:flex-row md:items-end gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-700 p-1 shadow-lg">
                                            {isLoading ? (
                                                <div className="w-full h-full rounded-xl bg-gray-200 dark:bg-gray-600 animate-pulse" />
                                            ) : profile ? (
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}`}
                                                    alt={profile.name}
                                                    className="w-full h-full rounded-xl object-cover"
                                                />
                                            ) : null}
                                        </div>
                                        <button className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors">
                                            <Camera size={14} />
                                        </button>
                                    </div>

                                    {/* Name and Role */}
                                    <div className="flex-1 mt-2">
                                        {isLoading ? (
                                            <div className="space-y-2">
                                                <SkeletonLine w="w-40" />
                                                <SkeletonLine w="w-28" />
                                            </div>
                                        ) : profile ? (
                                            <>
                                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                                                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                                        {profile.role}
                                                    </span>
                                                    <span className="text-sm">{profile.department}</span>
                                                </p>
                                            </>
                                        ) : null}
                                    </div>

                                    {/* Edit / Save / Cancel */}
                                    {!isLoading && profile && (
                                        isEditing ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                                >
                                                    <X size={16} /> Cancel
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-70"
                                                >
                                                    {isSaving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                                                    {isSaving ? 'Saving…' : 'Save'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <form action="/auth/session-role/choose" method="post">
                                                    <input type="hidden" name="role" value="attendee" />
                                                    <input type="hidden" name="next" value="/dashboard" />
                                                    <button
                                                        type="submit"
                                                        className="flex items-center gap-2 px-4 py-2.5 border border-cyan-200 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 rounded-xl text-sm font-medium hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
                                                    >
                                                        <Users size={16} />
                                                        Switch to Attend Mode
                                                    </button>
                                                </form>
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm"
                                                >
                                                    <Edit3 size={16} />
                                                    Edit Profile
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    label: 'Events Managed',
                                    value: isLoading ? null : profile?.eventsManaged ?? 0,
                                    icon: Calendar,
                                    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                                    iconColor: 'text-indigo-600 dark:text-indigo-400',
                                },
                                {
                                    label: 'Total Attendees',
                                    value: isLoading ? null : (profile?.totalAttendees ?? 0).toLocaleString(),
                                    icon: Briefcase,
                                    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                                },
                                {
                                    label: 'Member Since',
                                    value: isLoading ? null : profile?.joinedDate ?? '—',
                                    icon: Award,
                                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                                    iconColor: 'text-amber-600 dark:text-amber-400',
                                },
                            ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
                                <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                                            {value === null ? (
                                                <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
                                            ) : (
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                                            )}
                                        </div>
                                        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                                            <Icon size={22} className={iconColor} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Contact Information */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Contact Information</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your personal contact details</p>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Email — always read-only */}
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Mail size={14} /> Email Address
                                        </label>
                                        {isLoading ? <SkeletonLine w="w-48" /> : (
                                            <p className="font-medium text-gray-900 dark:text-white">{profile?.email ?? '—'}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Phone size={14} /> Phone Number
                                        </label>
                                        {isLoading ? <SkeletonLine w="w-36" /> : isEditing ? (
                                            <input
                                                type="tel"
                                                value={editData.phone}
                                                onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))}
                                                placeholder="+63 912 345 6789"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        ) : (
                                            <p className="font-medium text-gray-900 dark:text-white">{profile?.phone || <span className="text-gray-400 italic text-sm">Not set</span>}</p>
                                        )}
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <MapPin size={14} /> Location
                                        </label>
                                        {isLoading ? <SkeletonLine w="w-40" /> : isEditing ? (
                                            <input
                                                type="text"
                                                value={editData.location}
                                                onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                                                placeholder="City, Country"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        ) : (
                                            <p className="font-medium text-gray-900 dark:text-white">{profile?.location || <span className="text-gray-400 italic text-sm">Not set</span>}</p>
                                        )}
                                    </div>

                                    {/* Department */}
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Briefcase size={14} /> Department
                                        </label>
                                        {isLoading ? <SkeletonLine w="w-32" /> : isEditing ? (
                                            <input
                                                type="text"
                                                value={editData.department}
                                                onChange={e => setEditData(d => ({ ...d, department: e.target.value }))}
                                                placeholder="e.g. Event Management"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        ) : (
                                            <p className="font-medium text-gray-900 dark:text-white">{profile?.department || <span className="text-gray-400 italic text-sm">Not set</span>}</p>
                                        )}
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
                                    {isLoading ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center gap-3 p-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                                                <div className="space-y-2 flex-1">
                                                    <SkeletonLine w="w-24" />
                                                    <SkeletonLine w="w-32" />
                                                </div>
                                            </div>
                                        ))
                                    ) : achievements.map((achievement) => {
                                        const IconComponent = achievement.icon;
                                        return (
                                            <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${achievement.color} flex items-center justify-center text-white shrink-0`}>
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
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest events in your organization</p>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="p-5 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <SkeletonLine w="w-48" />
                                                <SkeletonLine w="w-24" />
                                            </div>
                                        </div>
                                    ))
                                ) : recentEvents.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">No events found.</div>
                                ) : recentEvents.map((event) => (
                                    <div key={event.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                                                {event.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:text-white">{event.name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Organizer</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{event.date}</span>
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

