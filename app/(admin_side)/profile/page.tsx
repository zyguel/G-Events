"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { Camera, Mail, Phone, MapPin, Calendar, Briefcase, Edit3, Shield, Award, Check, X, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_RAW_PROFILE_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const TARGET_PROFILE_IMAGE_SIZE_BYTES = 900 * 1024;
const PREVIEW_CROP_SIZE = 280;
const OUTPUT_CROP_SIZE = 512;

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    location: string;
    role: string;
    department: string;
    joinedDate: string;
    avatarSeed: string;
    metadataAvatarUrl: string | null;
    bucketAvatarUrl: string | null;
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
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editData, setEditData] = useState({ name: '', phone: '', location: '', department: '' });
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [organizationName, setOrganizationName] = useState('Organization');
    const [isLoading, setIsLoading] = useState(true);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [avatarSourceIndex, setAvatarSourceIndex] = useState(0);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
    const [cropFileName, setCropFileName] = useState<string>('avatar.jpg');
    const [cropZoom, setCropZoom] = useState(1);
    const [cropOffsetX, setCropOffsetX] = useState(0);
    const [cropOffsetY, setCropOffsetY] = useState(0);
    const [cropImageSize, setCropImageSize] = useState<{ width: number; height: number } | null>(null);
    const [isDraggingCrop, setIsDraggingCrop] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number; startOffsetX: number; startOffsetY: number } | null>(null);

    const readImageSize = (fileUrl: string): Promise<{ width: number; height: number }> => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Failed to read image dimensions.'));
        img.src = fileUrl;
    });

    const computeCoverDimensions = (imageWidth: number, imageHeight: number, boxSize: number, zoomFactor: number) => {
        const baseScale = Math.max(boxSize / imageWidth, boxSize / imageHeight);
        const finalScale = baseScale * zoomFactor;
        return {
            drawWidth: imageWidth * finalScale,
            drawHeight: imageHeight * finalScale,
        };
    };

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> => new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Unable to process image.'));
                return;
            }
            resolve(blob);
        }, type, quality);
    });

    const buildCroppedCompressedFile = async (): Promise<File> => {
        if (!cropImageUrl || !cropImageSize) {
            throw new Error('No image selected for cropping.');
        }

        const image = new Image();
        image.src = cropImageUrl;
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Failed to load selected image.'));
        });

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_CROP_SIZE;
        canvas.height = OUTPUT_CROP_SIZE;
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Canvas is not available in this browser.');
        }

        const previewDims = computeCoverDimensions(cropImageSize.width, cropImageSize.height, PREVIEW_CROP_SIZE, cropZoom);
        const maxOffsetX = Math.max(0, (previewDims.drawWidth - PREVIEW_CROP_SIZE) / 2);
        const maxOffsetY = Math.max(0, (previewDims.drawHeight - PREVIEW_CROP_SIZE) / 2);
        const clampedX = clamp(cropOffsetX, -maxOffsetX, maxOffsetX);
        const clampedY = clamp(cropOffsetY, -maxOffsetY, maxOffsetY);

        const outputDims = computeCoverDimensions(cropImageSize.width, cropImageSize.height, OUTPUT_CROP_SIZE, cropZoom);
        const offsetScale = OUTPUT_CROP_SIZE / PREVIEW_CROP_SIZE;
        const drawX = (OUTPUT_CROP_SIZE - outputDims.drawWidth) / 2 + clampedX * offsetScale;
        const drawY = (OUTPUT_CROP_SIZE - outputDims.drawHeight) / 2 + clampedY * offsetScale;

        context.clearRect(0, 0, OUTPUT_CROP_SIZE, OUTPUT_CROP_SIZE);
        context.drawImage(image, drawX, drawY, outputDims.drawWidth, outputDims.drawHeight);

        let quality = 0.92;
        let blob = await canvasToBlob(canvas, 'image/jpeg', quality);

        while (blob.size > TARGET_PROFILE_IMAGE_SIZE_BYTES && quality > 0.5) {
            quality -= 0.08;
            blob = await canvasToBlob(canvas, 'image/jpeg', quality);
        }

        return new File([blob], cropFileName.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    };

    const closeCropModal = () => {
        setIsCropModalOpen(false);
        if (cropImageUrl) {
            URL.revokeObjectURL(cropImageUrl);
        }
        setCropImageUrl(null);
        setCropImageSize(null);
        setCropZoom(1);
        setCropOffsetX(0);
        setCropOffsetY(0);
    };

    const uploadAvatarFile = async (file: File) => {
        setIsUploadingAvatar(true);
        setAvatarError(null);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
            });

            const payload = await response.json();
            if (!response.ok || !payload?.success || !payload?.data?.avatarUrl) {
                setAvatarError(payload?.error || 'Failed to upload profile image.');
                return;
            }
            const avatarUrl = payload.data.avatarUrl as string;

            setProfile((prev) => (prev ? {
                ...prev,
                metadataAvatarUrl: null,
                bucketAvatarUrl: avatarUrl,
            } : prev));
            setAvatarSourceIndex(0);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const getMetadataAvatarUrl = (metadata: Record<string, unknown> | undefined): string | null => {
        if (!metadata) return null;
        const candidates = [metadata.avatar_url, metadata.picture, metadata.photo_url, metadata.image, metadata.profile_image_url];
        const firstUrl = candidates.find((value) => {
            if (typeof value !== 'string') return false;
            const trimmed = value.trim();
            if (!trimmed) return false;
            return !trimmed.startsWith('storage:');
        });
        return typeof firstUrl === 'string' ? firstUrl : null;
    };

    const getBucketAvatarUrlFromApi = async (path?: string): Promise<string | null> => {
        const query = path ? `?path=${encodeURIComponent(path)}` : '';
        const response = await fetch(`/api/profile/avatar${query}`, { method: 'GET' });
        if (!response.ok) {
            return null;
        }

        const payload = await response.json();
        if (!payload?.success) {
            return null;
        }

        return (payload?.data?.avatarUrl as string | null) ?? null;
    };

    const getStoredAvatarPath = (metadata: Record<string, unknown> | undefined): string | null => {
        if (!metadata) return null;

        const profilePath = typeof metadata.profile_image_path === 'string' ? metadata.profile_image_path.trim() : '';
        if (profilePath) return profilePath;

        const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url.trim() : '';
        if (avatarUrl.startsWith('storage:')) {
            return avatarUrl.slice('storage:'.length).trim() || null;
        }

        return null;
    };

    const openAvatarPicker = () => {
        const input = document.getElementById('profile-avatar-input') as HTMLInputElement | null;
        if (!input || isUploadingAvatar) return;
        input.click();
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setAvatarError('Please choose an image file.');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_RAW_PROFILE_IMAGE_SIZE_BYTES) {
            setAvatarError('Selected image is too large. Please choose an image 20MB or smaller.');
            event.target.value = '';
            return;
        }

        try {
            setAvatarError(null);
            if (cropImageUrl) {
                URL.revokeObjectURL(cropImageUrl);
            }

            const objectUrl = URL.createObjectURL(file);
            const size = await readImageSize(objectUrl);
            setCropFileName(file.name || 'avatar.jpg');
            setCropImageUrl(objectUrl);
            setCropImageSize(size);
            setCropZoom(1);
            setCropOffsetX(0);
            setCropOffsetY(0);
            setIsCropModalOpen(true);
        } catch {
            setAvatarError('Unable to open selected image. Please try another file.');
        } finally {
            event.target.value = '';
        }
    };

    const handleConfirmCropAndUpload = async () => {
        try {
            setAvatarError(null);
            const croppedFile = await buildCroppedCompressedFile();

            if (croppedFile.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
                setAvatarError('Could not compress image enough. Please try a smaller image.');
                return;
            }

            closeCropModal();
            await uploadAvatarFile(croppedFile);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to crop image.';
            setAvatarError(message);
        }
    };

    useEffect(() => {
        const supabase = createClient();

        const loadProfile = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch authenticated user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const organizationResponse = await fetch('/api/profile/organization', { method: 'GET' });
                if (organizationResponse.ok) {
                    const payload = await organizationResponse.json();
                    if (payload?.success && payload?.data?.organizationName) {
                        setOrganizationName(String(payload.data.organizationName));
                    }
                }

                const name = user.user_metadata?.name
                    || user.user_metadata?.full_name
                    || user.email?.split('@')[0]
                    || 'User';
                const userMetadata = user.user_metadata as Record<string, unknown> | undefined;
                const metadataAvatarUrl = getMetadataAvatarUrl(userMetadata);
                const storedAvatarPath = getStoredAvatarPath(userMetadata);
                const bucketAvatarUrl = await getBucketAvatarUrlFromApi(storedAvatarPath ?? undefined);

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
                    metadataAvatarUrl,
                    bucketAvatarUrl,
                    eventsManaged,
                    totalAttendees: totalAttendees ?? 0,
                    emailConfirmed: !!user.email_confirmed_at,
                });
                setEditData({ name, phone, location, department });
                setAvatarSourceIndex(0);
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
                name: editData.name,
                full_name: editData.name,
                phone: editData.phone,
                location: editData.location,
                department: editData.department,
            },
        });
        if (!error) {
            setProfile(prev => prev ? {
                ...prev,
                ...editData,
                avatarSeed: encodeURIComponent(editData.name || prev.name),
            } : prev);
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const handleCancelEdit = () => {
        if (profile) setEditData({ name: profile.name, phone: profile.phone, location: profile.location, department: profile.department });
        setIsEditing(false);
    };

    const avatarSources = profile
        ? [
            profile.metadataAvatarUrl,
            profile.bucketAvatarUrl,
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}`,
        ].filter((source): source is string => Boolean(source && source.trim().length > 0))
        : [];

    const activeAvatarSrc = avatarSources[Math.min(avatarSourceIndex, Math.max(avatarSources.length - 1, 0))] ?? null;

    const handleAvatarImageError = () => {
        setAvatarSourceIndex((prev) => (prev < avatarSources.length - 1 ? prev + 1 : prev));
    };

    const previewDraw = cropImageSize
        ? computeCoverDimensions(cropImageSize.width, cropImageSize.height, PREVIEW_CROP_SIZE, cropZoom)
        : null;

    const maxCropOffsetX = previewDraw ? Math.max(0, (previewDraw.drawWidth - PREVIEW_CROP_SIZE) / 2) : 0;
    const maxCropOffsetY = previewDraw ? Math.max(0, (previewDraw.drawHeight - PREVIEW_CROP_SIZE) / 2) : 0;

    const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!previewDraw || isUploadingAvatar) return;
        event.preventDefault();
        setIsDraggingCrop(true);
        setDragStart({
            x: event.clientX,
            y: event.clientY,
            startOffsetX: cropOffsetX,
            startOffsetY: cropOffsetY,
        });
    };

    const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingCrop || !dragStart) return;
        event.preventDefault();

        const nextOffsetX = dragStart.startOffsetX + (event.clientX - dragStart.x);
        const nextOffsetY = dragStart.startOffsetY + (event.clientY - dragStart.y);

        setCropOffsetX(clamp(nextOffsetX, -maxCropOffsetX, maxCropOffsetX));
        setCropOffsetY(clamp(nextOffsetY, -maxCropOffsetY, maxCropOffsetY));
    };

    const handleCropPointerUp = () => {
        setIsDraggingCrop(false);
        setDragStart(null);
    };

    useEffect(() => {
        setCropOffsetX((prev) => clamp(prev, -maxCropOffsetX, maxCropOffsetX));
        setCropOffsetY((prev) => clamp(prev, -maxCropOffsetY, maxCropOffsetY));
    }, [maxCropOffsetX, maxCropOffsetY]);

    useEffect(() => {
        return () => {
            if (cropImageUrl) {
                URL.revokeObjectURL(cropImageUrl);
            }
        };
    }, [cropImageUrl]);

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
                            <div className="h-32 relative bg-linear-to-r from-slate-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-800 border-b border-gray-200/70 dark:border-gray-700/70">
                                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(59,130,246,0.18) 0, transparent 35%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.22) 0, transparent 35%)' }} />
                                <div className="absolute inset-0 px-6 py-5 flex flex-col items-center justify-center text-center">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Workspace</p>
                                    <p className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mt-1">
                                        Currently managing: "{organizationName}"
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 pb-6 -mt-12 relative">
                                <div className="flex flex-col md:flex-row md:items-end gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-700 p-1 shadow-lg">
                                            {isLoading ? (
                                                <div className="w-full h-full rounded-xl bg-gray-200 dark:bg-gray-600 animate-pulse" />
                                            ) : profile && activeAvatarSrc ? (
                                                <img
                                                    src={activeAvatarSrc}
                                                    alt={profile.name}
                                                    className="w-full h-full rounded-xl object-cover"
                                                    onError={handleAvatarImageError}
                                                />
                                            ) : null}
                                        </div>
                                        <button
                                            onClick={openAvatarPicker}
                                            disabled={isUploadingAvatar}
                                            className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
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
                                        ) : profile && isEditing ? (
                                            <div className="space-y-3 max-w-md">
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">Name</label>
                                                    <input
                                                        type="text"
                                                        value={editData.name}
                                                        onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                                                        placeholder="Your name"
                                                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    />
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                                        {profile.role}
                                                    </span>
                                                    <span className="text-sm">{profile.department}</span>
                                                </p>
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
                                <input
                                    id="profile-avatar-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                                {(isUploadingAvatar || avatarError) && (
                                    <div className="mt-2 text-sm">
                                        {isUploadingAvatar && <p className="text-indigo-600 dark:text-indigo-400">Uploading profile image...</p>}
                                        {avatarError && <p className="text-red-600 dark:text-red-400">{avatarError}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isCropModalOpen && cropImageUrl && cropImageSize && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                                <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crop Profile Photo</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Move and zoom your image, then save.</p>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div
                                            className={`mx-auto rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 relative ${isDraggingCrop ? 'cursor-grabbing' : 'cursor-grab'}`}
                                            style={{ width: PREVIEW_CROP_SIZE, height: PREVIEW_CROP_SIZE }}
                                            onPointerDown={handleCropPointerDown}
                                            onPointerMove={handleCropPointerMove}
                                            onPointerUp={handleCropPointerUp}
                                            onPointerLeave={handleCropPointerUp}
                                            onPointerCancel={handleCropPointerUp}
                                        >
                                            {previewDraw && (
                                                <img
                                                    src={cropImageUrl}
                                                    alt="Crop preview"
                                                    className="absolute max-w-none select-none pointer-events-none"
                                                    style={{
                                                        width: `${previewDraw.drawWidth}px`,
                                                        height: `${previewDraw.drawHeight}px`,
                                                        left: `${(PREVIEW_CROP_SIZE - previewDraw.drawWidth) / 2 + cropOffsetX}px`,
                                                        top: `${(PREVIEW_CROP_SIZE - previewDraw.drawHeight) / 2 + cropOffsetY}px`,
                                                    }}
                                                />
                                            )}
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                <div
                                                    className="rounded-full border-2 border-white/90 dark:border-white/70"
                                                    style={{
                                                        width: Math.floor(PREVIEW_CROP_SIZE * 0.84),
                                                        height: Math.floor(PREVIEW_CROP_SIZE * 0.84),
                                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.28)',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-sm text-gray-600 dark:text-gray-300">
                                                Zoom ({Math.round(cropZoom * 100)}%)
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={3}
                                                    step={0.01}
                                                    value={cropZoom}
                                                    onChange={(e) => setCropZoom(Number(e.target.value))}
                                                    className="mt-1 w-full"
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Drag the image to position your face inside the circle. The square area is saved, and this circle shows how it appears in round avatars.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={closeCropModal}
                                            disabled={isUploadingAvatar}
                                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-70"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmCropAndUpload}
                                            disabled={isUploadingAvatar}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70"
                                        >
                                            Crop and Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

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

