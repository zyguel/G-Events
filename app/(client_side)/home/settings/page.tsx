"use client";

import React, { useEffect, useMemo, useState } from 'react';
import ClientHeader from '@/components/client/ClientHeader';
import ClientMobileNav from '@/components/client/ClientMobileNav';
import ThemeToggle from '@/components/admin/ThemeToggle';
import { createClient } from '@/lib/supabase-browser';
import { useLocale } from '@/contexts/LocaleContext';
import { getLanguageLabel } from '@/lib/i18n';
import { Globe, Bell, User, Camera } from 'lucide-react';

interface RegionOption {
    code: string;
    label: string;
}

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_RAW_PROFILE_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const TARGET_PROFILE_IMAGE_SIZE_BYTES = 900 * 1024;
const PREVIEW_CROP_SIZE = 280;
const OUTPUT_CROP_SIZE = 512;
const ALLOWED_PROFILE_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
]);
const PROFILE_IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif';
const PROFILE_IMAGE_ALLOWED_LABEL = 'JPEG, PNG, WebP, GIF, AVIF';

export default function ClientSettingsPage() {
    const { locale, saveLocale, t, availableLanguages } = useLocale();

    const [name, setName] = useState('');
    const [avatarSeed, setAvatarSeed] = useState('User');
    const [email, setEmail] = useState('');
    const [metadataAvatarUrl, setMetadataAvatarUrl] = useState<string | null>(null);
    const [bucketAvatarUrl, setBucketAvatarUrl] = useState<string | null>(null);
    const [avatarSourceIndex, setAvatarSourceIndex] = useState(0);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState<string | null>(null);

    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
    const [cropFileName, setCropFileName] = useState<string>('avatar.jpg');
    const [cropZoom, setCropZoom] = useState(1);
    const [cropOffsetX, setCropOffsetX] = useState(0);
    const [cropOffsetY, setCropOffsetY] = useState(0);
    const [cropImageSize, setCropImageSize] = useState<{ width: number; height: number } | null>(null);
    const [isDraggingCrop, setIsDraggingCrop] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number; startOffsetX: number; startOffsetY: number } | null>(null);

    const [language, setLanguage] = useState(locale.language);
    const [region, setRegion] = useState(locale.region);
    const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [eventUpdates, setEventUpdates] = useState(true);
    const [isSavingLocale, setIsSavingLocale] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const computeCoverDimensions = (imageWidth: number, imageHeight: number, boxSize: number, zoomFactor: number) => {
        const baseScale = Math.max(boxSize / imageWidth, boxSize / imageHeight);
        const finalScale = baseScale * zoomFactor;
        return {
            drawWidth: imageWidth * finalScale,
            drawHeight: imageHeight * finalScale,
        };
    };

    const readImageSize = (fileUrl: string): Promise<{ width: number; height: number }> => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Failed to read image dimensions.'));
        img.src = fileUrl;
    });

    const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> => new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Unable to process image.'));
                return;
            }
            resolve(blob);
        }, type, quality);
    });

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

    const getStoredAvatarPath = (metadata: Record<string, unknown> | undefined): string | null => {
        if (!metadata) return null;
        const profilePath = typeof metadata.profile_image_path === 'string' ? metadata.profile_image_path.trim() : '';
        if (profilePath) return profilePath;

        const avatarValue = typeof metadata.avatar_url === 'string' ? metadata.avatar_url.trim() : '';
        if (avatarValue.startsWith('storage:')) {
            return avatarValue.slice('storage:'.length).trim() || null;
        }

        return null;
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
            setMetadataAvatarUrl(null);
            setBucketAvatarUrl(avatarUrl);
            setAvatarSourceIndex(0);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

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

    const openAvatarPicker = () => {
        const input = document.getElementById('client-profile-avatar-input') as HTMLInputElement | null;
        if (!input || isUploadingAvatar) return;
        input.click();
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_PROFILE_IMAGE_TYPES.has(file.type)) {
            setAvatarError(`Unsupported image format. Allowed formats: ${PROFILE_IMAGE_ALLOWED_LABEL}.`);
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

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            setProfileMessage(t('Name is required.'));
            return;
        }

        setIsSavingProfile(true);
        setProfileMessage(null);
        const supabase = createClient();

        const { error } = await supabase.auth.updateUser({
            data: {
                name: name.trim(),
                full_name: name.trim(),
            },
        });

        if (error) {
            setProfileMessage(t('Unable to save profile right now.'));
        } else {
            setAvatarSeed(encodeURIComponent(name.trim()));
            setProfileMessage(t('Profile updated successfully.'));
        }

        setIsSavingProfile(false);
    };

    useEffect(() => {
        const supabase = createClient();

        const loadUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const resolvedName =
                user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                user.email?.split('@')[0] ||
                'User';

            const metadata = user.user_metadata as Record<string, unknown> | undefined;
            const directMetadataAvatarUrl = getMetadataAvatarUrl(metadata);
            const storedAvatarPath = getStoredAvatarPath(metadata);
            const signedBucketAvatarUrl = await getBucketAvatarUrlFromApi(storedAvatarPath ?? undefined);

            setName(String(resolvedName));
            setAvatarSeed(encodeURIComponent(String(resolvedName)));
            setEmail(user.email ?? '');
            setMetadataAvatarUrl(directMetadataAvatarUrl);
            setBucketAvatarUrl(signedBucketAvatarUrl);
            setAvatarSourceIndex(0);
        };

        const loadRegions = async () => {
            try {
                const response = await fetch('/api/regions', { cache: 'no-store' });
                const payload = await response.json();
                if (response.ok && Array.isArray(payload?.data)) {
                    setRegionOptions(payload.data as RegionOption[]);
                }
            } catch {
                setRegionOptions([]);
            }
        };

        loadUser();
        loadRegions();
    }, []);

    useEffect(() => {
        setLanguage(locale.language);
        setRegion(locale.region);
    }, [locale.language, locale.region]);

    const languageOptions = useMemo(() => {
        return availableLanguages.map((item) => ({
            value: item.code,
            label: item.nativeName
                ? `${item.name} - ${item.nativeName} (${item.code.toUpperCase()})`
                : `${item.name} (${item.code.toUpperCase()})`,
        }));
    }, [availableLanguages]);

    const selectedRegionLabel = useMemo(() => {
        return regionOptions.find((item) => item.code === region)?.label ?? region;
    }, [region, regionOptions]);

    const handleSaveLocale = async () => {
        setIsSavingLocale(true);
        setMessage(null);

        const ok = await saveLocale({ language, region });

        setIsSavingLocale(false);
        setMessage(ok ? t('Settings saved successfully.') : t('Unable to save settings right now.'));
    };

    const avatarSources = [
        metadataAvatarUrl,
        bucketAvatarUrl,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
    ].filter((source): source is string => Boolean(source && source.trim().length > 0));

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

    return (
        <div className="h-screen flex flex-col bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300">
            <ClientHeader />

            <div className="flex flex-1 min-h-0 overflow-hidden">

                <main className="flex-1 min-h-0 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-10">
                    <div className="mx-auto max-w-4xl space-y-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('Settings')}</h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('Manage your attendee preferences and account details.')}</p>
                        </div>

                        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">{t('Account')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Your attendee profile details')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
                                <div className="relative w-24 h-24">
                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-700 overflow-hidden ring-2 ring-gray-200 dark:ring-gray-600">
                                        {activeAvatarSrc ? (
                                            <img
                                                src={activeAvatarSrc}
                                                alt={name || 'User'}
                                                className="w-full h-full object-cover"
                                                onError={handleAvatarImageError}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openAvatarPicker}
                                        disabled={isUploadingAvatar}
                                        className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <Camera size={14} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">{t('Name')}</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('Email')}</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{email || '—'}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSaveProfile}
                                            disabled={isSavingProfile}
                                            className="px-4 py-2 rounded-xl bg-[#3D518C] text-white text-sm font-medium hover:bg-[#2d3d6b] disabled:opacity-70"
                                        >
                                            {isSavingProfile ? t('Saving...') : t('Save Profile')}
                                        </button>
                                        <input
                                            id="client-profile-avatar-input"
                                            type="file"
                                            accept={PROFILE_IMAGE_ACCEPT}
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                        />
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {t('Supported image formats')}: {PROFILE_IMAGE_ALLOWED_LABEL}. {t('Maximum upload size')}: 20MB.
                                    </p>

                                    {(profileMessage || avatarError || isUploadingAvatar) ? (
                                        <div className="space-y-1">
                                            {profileMessage ? <p className="text-sm text-gray-600 dark:text-gray-300">{profileMessage}</p> : null}
                                            {isUploadingAvatar ? <p className="text-sm text-indigo-600 dark:text-indigo-400">{t('Uploading profile image...')}</p> : null}
                                            {avatarError ? <p className="text-sm text-red-600 dark:text-red-400">{avatarError}</p> : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        {isCropModalOpen && cropImageUrl && cropImageSize && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                                <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Crop Profile Photo')}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('Move and zoom your image, then save.')}</p>
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
                                                {t('Zoom')} ({Math.round(cropZoom * 100)}%)
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
                                                {t('Drag the image to position your face inside the circle. The square area is saved, and this circle shows how it appears in round avatars.')}
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
                                            {t('Cancel')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmCropAndUpload}
                                            disabled={isUploadingAvatar}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70"
                                        >
                                            {t('Crop and Save')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-indigo-500 text-white flex items-center justify-center">
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">{t('Language & Region')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Choose your preferred language and region')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('Language')}</span>
                                    <select
                                        value={language}
                                        onChange={(event) => setLanguage(event.target.value)}
                                        className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                    >
                                        {languageOptions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('Region')}</span>
                                    <select
                                        value={region}
                                        onChange={(event) => setRegion(event.target.value)}
                                        className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                    >
                                        {regionOptions.map((option) => (
                                            <option key={option.code} value={option.code}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                {t('Current selection')}: {getLanguageLabel(language, availableLanguages)} - {selectedRegionLabel}
                            </p>

                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={handleSaveLocale}
                                    disabled={isSavingLocale}
                                    className="px-4 py-2 rounded-xl bg-[#3D518C] text-white text-sm font-medium hover:bg-[#2d3d6b] disabled:opacity-70"
                                >
                                    {isSavingLocale ? t('Saving...') : t('Save Preferences')}
                                </button>
                                {message ? <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p> : null}
                            </div>
                        </section>

                        <section className="md:hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">{t('Appearance')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Switch between light and dark mode')}</p>
                                </div>
                                <ThemeToggle />
                            </div>
                        </section>

                        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center">
                                    <Bell size={18} />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">{t('Notifications')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Manage attendee notification options')}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3">
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{t('Email Notifications')}</span>
                                    <input type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications((value) => !value)} />
                                </label>
                                <label className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3">
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{t('Event Updates')}</span>
                                    <input type="checkbox" checked={eventUpdates} onChange={() => setEventUpdates((value) => !value)} />
                                </label>
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            <ClientMobileNav activePage="settings" />
        </div>
    );
}
