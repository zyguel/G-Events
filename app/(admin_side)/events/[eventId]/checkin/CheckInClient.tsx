"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Search, Filter, MoreVertical, CheckCircle, Clock, ChevronDown, UserCheck, UserX, Eye, QrCode, Camera, ScanLine, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { EventSummary } from '@/lib/types';
import TablePaginationControls from '@/components/admin/TablePaginationControls';

// --- Types ---
interface Attendee {
    registrationId: string;
    name: string;
    email: string;
    ticketType: string;
    status: 'Checked-In' | 'Not Yet Checked-In';
    checkInTime?: string;
}

interface CheckInClientProps {
    event: EventSummary;
}

// --- Mock Data ---
const INITIAL_ATTENDEES: Attendee[] = [
    { registrationId: "20240502000002", name: "Karylle Bernate", email: "karyllebernate8@gmail.com", ticketType: "General Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000001", name: "Vinz Villarin", email: "vinzvillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In" },
    { registrationId: "20240502000003", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000004", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000005", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000006", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In", checkInTime: "2025-06-01 09:20 AM" },
    { registrationId: "20240502000007", name: "Sophia Villarin", email: "sophiavillarin@gmail.com", ticketType: "Premium Admission", status: "Not Yet Checked-In", checkInTime: "2025-06-01 09:20 AM" },
];

export default function CheckInClient({ event }: CheckInClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    // Use mock attendees only for local draft events.
    const [attendees, setAttendees] = useState<Attendee[]>(event.id.startsWith('evt-') ? INITIAL_ATTENDEES : []);
    const [isLoading, setIsLoading] = useState(!event.id.startsWith('evt-'));
    const [error, setError] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'All' | 'Checked-In' | 'Not Yet Checked-In'>('All');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [scanInput, setScanInput] = useState('');
    const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isScanningFrame, setIsScanningFrame] = useState(false);
    const [isSubmittingScan, setIsSubmittingScan] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const isDetectingRef = useRef(false);
    const isSubmittingScanRef = useRef(false);

    // Action Menu State
    const [openActionId, setOpenActionId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        if (event.id.startsWith('evt-')) {
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();

        const loadAttendees = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await fetch(`/api/events/${event.id}/checkin`, { signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`Failed to load attendees (${res.status})`);
                }
                const json = await res.json();
                if (json?.success && Array.isArray(json.data)) {
                    setAttendees(json.data);
                } else {
                    throw new Error(json?.error || "Unexpected response format");
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                console.error("Error loading check-in attendees:", e);
                setError(e instanceof Error ? e.message : "Failed to load attendees");
            } finally {
                setIsLoading(false);
            }
        };

        loadAttendees();
        return () => controller.abort();
    }, [event.id]);

    // --- Actions ---
    const handleCheckInToggle = async (registrationId: string) => {
        const target = attendees.find(att => att.registrationId === registrationId);
        if (!target) return;

        const nextStatus = target.status === 'Checked-In' ? 'Not Yet Checked-In' : 'Checked-In';
        const nextTime = nextStatus === 'Checked-In' ? new Date().toLocaleString() : undefined;

        setAttendees(prev => prev.map(att =>
            att.registrationId === registrationId
                ? { ...att, status: nextStatus, checkInTime: nextTime }
                : att
        ));
        setOpenActionId(null);

        if (event.id.startsWith('evt-')) return;

        try {
            setUpdatingId(registrationId);
            const res = await fetch(`/api/events/${event.id}/checkin/${registrationId}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ checkedIn: nextStatus === 'Checked-In' }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed to update check-in (${res.status})`);
            }
        } catch (e) {
            console.error("Error updating check-in:", e);
            // Roll back optimistic update
            setAttendees(prev => prev.map(att =>
                att.registrationId === registrationId
                    ? { ...att, status: target.status, checkInTime: target.checkInTime }
                    : att
            ));
            setError(e instanceof Error ? e.message : "Failed to update check-in");
        } finally {
            setUpdatingId(null);
        }
    };

    const applyScannedAttendee = (attendee: Attendee) => {
        setAttendees((prev) => {
            const existing = prev.find((item) => item.registrationId === attendee.registrationId);
            if (!existing) {
                return [attendee, ...prev];
            }

            return prev.map((item) =>
                item.registrationId === attendee.registrationId
                    ? { ...item, ...attendee }
                    : item
            );
        });
    };

    const handleScanSubmit = async (qrData: string) => {
        const payload = qrData.trim();
        if (!payload || event.id.startsWith('evt-')) return;

        try {
            setIsSubmittingScan(true);
            isSubmittingScanRef.current = true;
            setScanStatus(null);

            const res = await fetch(`/api/events/${event.id}/checkin/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrData: payload }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Scan failed (${res.status})`);
            }

            if (json?.attendee) {
                applyScannedAttendee(json.attendee as Attendee);
            }

            setScanInput('');
            setScanStatus({
                type: json?.alreadyCheckedIn ? 'info' : 'success',
                message: json?.alreadyCheckedIn ? 'Attendee was already checked in.' : 'Attendee checked in successfully.'
            });

            if (isCameraOpen) {
                stopCamera();
            }
        } catch (e) {
            setScanStatus({
                type: 'error',
                message: e instanceof Error ? e.message : 'Failed to process scanned QR code'
            });
        } finally {
            setIsSubmittingScan(false);
            isSubmittingScanRef.current = false;
            setIsScanningFrame(false);
        }
    };

    const stopCamera = () => {
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsCameraOpen(false);
        setIsCameraReady(false);
        setIsScanningFrame(false);
        isDetectingRef.current = false;
    };

    const attachStreamToVideo = useCallback(async () => {
        const video = videoRef.current;
        const stream = streamRef.current;

        if (!video || !stream) {
            return false;
        }

        if (video.srcObject !== stream) {
            video.srcObject = stream;
        }

        try {
            await video.play();
            setIsCameraReady(true);
            return true;
        } catch {
            return false;
        }
    }, []);

    useEffect(() => {
        if (!isCameraOpen || !streamRef.current) {
            return;
        }

        let cancelled = false;

        const syncVideo = async () => {
            // Wait one paint so the <video> is mounted after isCameraOpen toggles.
            await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
            if (cancelled) return;

            const ok = await attachStreamToVideo();
            if (!ok && !cancelled) {
                setCameraError('Camera stream started but could not attach to video preview. Please retry.');
            }
        };

        syncVideo();

        return () => {
            cancelled = true;
        };
    }, [attachStreamToVideo, isCameraOpen]);

    const startCamera = async () => {
        try {
            setCameraError(null);
            setIsCameraReady(false);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });

            streamRef.current = stream;
            setIsCameraOpen(true);

            const jsQrModule = await import('jsqr');
            const decodeWithJsQr = jsQrModule.default;

            let detector: any = null;
            if ('BarcodeDetector' in window) {
                try {
                    const DetectorCtor = (window as any).BarcodeDetector;
                    detector = new DetectorCtor({ formats: ['qr_code'] });
                } catch {
                    detector = null;
                }
            }

            intervalRef.current = window.setInterval(async () => {
                if (isDetectingRef.current || !videoRef.current || !canvasRef.current || isSubmittingScanRef.current) {
                    return;
                }

                const video = videoRef.current;
                if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
                    return;
                }

                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                isDetectingRef.current = true;
                setIsScanningFrame(true);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                try {
                    let rawValue: string | undefined;

                    if (detector) {
                        try {
                            const results = await detector.detect(canvas);
                            rawValue = results?.[0]?.rawValue;
                        } catch {
                            rawValue = undefined;
                        }
                    }

                    if (!rawValue) {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const qrResult = decodeWithJsQr(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: 'attemptBoth',
                        });
                        rawValue = qrResult?.data;
                    }

                    if (rawValue) {
                        await handleScanSubmit(rawValue);
                    }
                } catch {
                    // Detection can fail on frames with no QR; ignore and continue scanning.
                } finally {
                    isDetectingRef.current = false;
                    setIsScanningFrame(false);
                }
            }, 450);
        } catch (e) {
            setCameraError(e instanceof Error ? e.message : 'Failed to access camera');
            stopCamera();
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Filtering ---
    const filteredAttendees = attendees.filter(attendee => {
        const matchesSearch =
            attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.registrationId.includes(searchQuery);

        const matchesFilter = activeFilter === 'All' || attendee.status === activeFilter;

        return matchesSearch && matchesFilter;
    });

    const paginatedAttendees = filteredAttendees.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredAttendees.length / rowsPerPage));
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, filteredAttendees.length, rowsPerPage]);

    const stats = {
        total: attendees.length,
        checkedIn: attendees.filter(a => a.status === 'Checked-In').length,
        pending: attendees.filter(a => a.status === 'Not Yet Checked-In').length
    };

    // --- UI Components ---

    return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30 transition-colors duration-300 relative">

            {/* Background Glow Effects (Dark Mode Only) - Adjusted to blend with gray theme */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-0 dark:opacity-50 transition-opacity duration-500">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="p-8 relative z-10">
                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                    {/* Page Header */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                            <UserCheck className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Check-In
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Manage attendee check-ins and track event attendance
                            </p>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{stats.checkedIn}</span> Checked In
                        </div>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{stats.pending}</span> Pending
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm p-4 md:p-5 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Scan QR Check-In</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Scan attendee passes or paste QR data manually.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={isCameraOpen ? stopCamera : startCamera}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                                        isCameraOpen
                                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/50'
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                                    }`}
                                >
                                    {isCameraOpen ? <XCircle size={16} /> : <Camera size={16} />}
                                    {isCameraOpen ? 'Stop Camera' : 'Start Camera Scanner'}
                                </button>
                            </div>
                        </div>

                        {scanStatus && (
                            <div className={`px-3 py-2 rounded-lg text-sm border ${
                                scanStatus.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/50'
                                    : scanStatus.type === 'info'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/50'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/50'
                            }`}>{scanStatus.message}</div>
                        )}

                        {cameraError && (
                            <div className="px-3 py-2 rounded-lg text-sm border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/50">
                                {cameraError}
                            </div>
                        )}

                        {isCameraOpen && (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-950">
                                <video ref={videoRef} className="w-full max-h-[320px] object-cover" playsInline muted />
                                <canvas ref={canvasRef} className="hidden" />
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
                                </div>
                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 text-white">
                                        <ScanLine size={13} />
                                        {isCameraReady ? 'Point camera to attendee QR code' : 'Initializing camera...'}
                                    </span>
                                    {isSubmittingScan && (
                                        <span className="px-2 py-1 rounded-md bg-indigo-500/85 text-white">Processing scan...</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (scanInput.trim()) {
                                    handleScanSubmit(scanInput);
                                }
                            }}
                            className="flex flex-col md:flex-row gap-2"
                        >
                            <div className="relative flex-1">
                                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    placeholder="Paste scanned QR payload"
                                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!scanInput.trim() || isSubmittingScan}
                                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                            >
                                Verify and Check In
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel p-1.5 rounded-2xl flex flex-col md:flex-row items-center gap-2 bg-white/70 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 backdrop-blur-xl shadow-sm transition-all duration-300 relative z-30">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Name, or Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none rounded-xl"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto p-1">
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${isFilterOpen || activeFilter !== 'All'
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-gray-100/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Filter size={16} />
                                    <span>{activeFilter === 'All' ? 'Filter' : activeFilter}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Filter Dropdown */}
                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1.5 z-20 flex flex-col gap-1 backdrop-blur-3xl origin-top-right ring-1 ring-black/5"
                                            >
                                                {['All', 'Checked-In', 'Not Yet Checked-In'].map((filter) => (
                                                    <button
                                                        key={filter}
                                                        onClick={() => {
                                                            setActiveFilter(filter as any);
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === filter
                                                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        {filter}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-4 py-2.5 bg-gray-100/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-all"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden shadow-sm transition-colors duration-300">
                        {error && (
                            <div className="px-6 pt-6 text-sm text-red-600 dark:text-red-300">{error}</div>
                        )}
                        <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 transition-colors">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                                    <tr>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Registration ID</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Name</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Email</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Ticket Type</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Status</th>
                                        <th className="px-6 py-5 text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Time</th>
                                        <th className="px-6 py-5 text-center text-gray-500 dark:text-gray-400 font-semibold uppercase text-xs tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center text-gray-500 dark:text-gray-400">
                                                Loading attendees...
                                            </td>
                                        </tr>
                                    ) : filteredAttendees.length > 0 ? (
                                        paginatedAttendees.map((attendee) => (
                                            <tr
                                                key={attendee.registrationId}
                                                className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                                            >
                                                <td className="px-6 py-4 font-mono text-indigo-700 dark:text-indigo-300/80 whitespace-nowrap">{attendee.registrationId}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{attendee.name}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{attendee.email}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{attendee.ticketType}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md ${attendee.status === 'Checked-In'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                        }`}>
                                                        {attendee.status === 'Checked-In' ? (
                                                            <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-500" />
                                                        ) : (
                                                            <Clock size={12} className="text-amber-600 dark:text-amber-500" />
                                                        )}
                                                        {attendee.status}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-500 text-xs whitespace-nowrap">
                                                    {attendee.checkInTime || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex justify-center relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionId(openActionId === attendee.registrationId ? null : attendee.registrationId);
                                                            }}
                                                            className={`p-2 rounded-lg transition-colors ${openActionId === attendee.registrationId
                                                                ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                                                                : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                                }`}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>

                                                        {/* Actions Dropdown */}
                                                        <AnimatePresence>
                                                            {openActionId === attendee.registrationId && (
                                                                <>
                                                                    <div className="fixed inset-0 z-30" onClick={() => setOpenActionId(null)} />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                                                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="absolute right-8 top-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1 z-40 flex flex-col backdrop-blur-3xl origin-top-right ring-1 ring-black/5"
                                                                    >
                                                                        <button
                                                                            onClick={() => handleCheckInToggle(attendee.registrationId)}
                                                                            disabled={updatingId === attendee.registrationId}
                                                                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                                                                        >
                                                                            {attendee.status === 'Checked-In' ? (
                                                                                <>
                                                                                    <UserX size={16} className="text-rose-500 dark:text-rose-400" />
                                                                                    Undo Check-In
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <UserCheck size={16} className="text-emerald-500 dark:text-emerald-400" />
                                                                                    Check In User
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                        <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                                                                            <Eye size={16} className="text-blue-500 dark:text-blue-400" />
                                                                            View Details
                                                                        </button>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                                                    <Search size={40} strokeWidth={1.5} className="opacity-50" />
                                                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No attendees found</p>
                                                    <p className="text-sm">Try adjusting your search or filter</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <TablePaginationControls
                            totalItems={filteredAttendees.length}
                            currentPage={currentPage}
                            rowsPerPage={rowsPerPage}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={(rows) => {
                                setRowsPerPage(rows);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
