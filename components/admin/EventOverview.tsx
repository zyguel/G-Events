"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, MapPin, Upload, Plus, Clock, Trash2, X, Users, Pencil, Image as ImageIcon, Type, AlignLeft, List, Check, CheckCircle } from "lucide-react";
import Modal, { ModalInput, ModalTextarea, ModalFooter } from "./Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DateTimeInput from "./DateTimeInput";
import TimeInput from "./TimeInput";
import dynamic from "next/dynamic";
import { createEvent, saveAgendaSlot, deleteAgendaSlot, deleteEvent } from '@/lib/actions/events';
import DateInput from "./DateInput";

const LocationMapPicker = dynamic(() => import('./LocationMapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl w-full flex items-center justify-center text-gray-400">Loading Map...</div>
});
import { usePermissions } from "@/contexts/PermissionContext";

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'from-emerald-500 to-green-600' : type === 'error' ? 'from-red-500 to-rose-600' : 'from-blue-500 to-indigo-600';

    return (
        <div className={`fixed bottom-6 right-6 z-100 bg-gradient-to-r ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up`}>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Check size={18} />
            </div>
            <span className="font-medium">{message}</span>
        </div>
    );
};

// Types
interface AgendaItem {
    id: string;
    title: string;
    speaker?: string;
    startTime: string;
    endTime: string;
    description: string;
}

interface EventData {
    id: string;
    name: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location: string;
    description?: string;
    theme?: string;
    objectives: string[];
    agenda: AgendaItem[];
    bannerUrl?: string;
    status: string;
}

function parseHHMMToMinutes(value: string | undefined): number | null {
    if (!value) return null;
    const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

export default function EventOverview({ initialData }: { initialData: any }) {
    const { hasPermission, isAdmin } = usePermissions();
    const canEditAgenda = isAdmin || hasPermission('Manage Event Agenda');

    // State
    const [event, setEvent] = useState<EventData>({
        ...initialData,
        startTime: initialData.startTime || "14:00", // 24h format for inputs
        endTime: initialData.endTime || "20:00",
        // Ensure objectives start empty if not provided, or respecting user request to start empty
        objectives: initialData.objectives && initialData.objectives.length > 0 ? initialData.objectives : [],
        agenda: initialData.agenda || []
    });

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Temporary state for date/time modal (using Date objects for DateTimeInput)
    const [tempEventDate, setTempEventDate] = useState<Date | null>(null);
    const [tempStartTime, setTempStartTime] = useState<string>('');
    const [tempEndTime, setTempEndTime] = useState<string>('');
    const [tempLocation, setTempLocation] = useState<string>('');
    const [tempTitle, setTempTitle] = useState<string>('');
    const [tempDescription, setTempDescription] = useState<string>('');
    const [tempTheme, setTempTheme] = useState<string>('');

    const [activeModal, setActiveModal] = useState<null | 'banner' | 'title' | 'dateLocation' | 'overview' | 'agenda' | 'deleteBanner' | 'deleteEvent'>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form States
    const [newAgenda, setNewAgenda] = useState<Partial<AgendaItem>>({});
    const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
    const [newObjective, setNewObjective] = useState("");
    const [isAddingObjective, setIsAddingObjective] = useState(false);
    const [editingObjectiveIndex, setEditingObjectiveIndex] = useState<number | null>(null);
    const [editingObjectiveValue, setEditingObjectiveValue] = useState("");

    const objectiveInputRef = useRef<HTMLInputElement>(null);

    // Banner Upload State
    const [tempBanner, setTempBanner] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ... useEffect ...

    // --- Actions ---

    const handleSaveTitle = (e: React.FormEvent) => {
        e.preventDefault();
        const name = tempTitle.trim();

        if (!name) {
            setToast({ message: 'Event title is required.', type: 'error' });
            return;
        }

        if (name.length > 100) {
            setToast({ message: 'Event title must be 100 characters or less.', type: 'error' });
            return;
        }

        const updatedEvent = {
            ...event,
            name
        };
        setEvent(updatedEvent);
        setActiveModal(null);

        if (event.id !== 'new') {
            setToast({ message: 'Saving title...', type: 'info' });
            import('@/lib/actions/events').then(({ updateEvent }) => {
                updateEvent(parseInt(event.id), {
                    title: name,
                    // Subtitle is not in DB schema yet, so we don't save it to backend
                }).then(res => {
                    if (res.success) setToast({ message: 'Event title updated!', type: 'success' });
                    else setToast({ message: 'Failed to save title.', type: 'error' });
                });
            });
        } else {
            setToast({ message: 'Title updated locally!', type: 'success' });
        }
    };

    // Initialize date/time modal values when it opens
    useEffect(() => {
        if (activeModal === 'dateLocation') {
            // Parse the event date into a Date object
            let eventDate = null;
            if (event.date) {
                const parsed = new Date(event.date);
                if (!isNaN(parsed.getTime())) {
                    eventDate = parsed;
                }
            }
            setTempEventDate(eventDate);
            setTempStartTime(event.startTime || '');
            setTempEndTime(event.endTime || '');
            setTempLocation(event.location || '');
        } else if (activeModal === 'overview') {
            setTempTitle(event.name || '');
            setTempDescription(event.description || '');
            setTempTheme(event.theme || '');
        }
    }, [activeModal, event.date, event.startTime, event.endTime, event.location, event.name, event.description, event.theme]);


    const handleSaveDateLocation = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        // Format date from Date object to YYYY-MM-DD
        const formattedDate = tempEventDate ? tempEventDate.toISOString().split('T')[0] : event.date;
        const location = tempLocation;

        const updatedEvent = {
            ...event,
            date: formattedDate,
            startTime: tempStartTime,
            endTime: tempEndTime,
            location: location
        };
        setEvent(updatedEvent);
        setActiveModal(null);

        if (event.id !== 'new') {
            setToast({ message: 'Saving date & location...', type: 'info' });

            // Construct timestamps
            const startAt = tempStartTime ? new Date(`${formattedDate}T${tempStartTime}:00`).toISOString() : null;
            const endAt = tempEndTime ? new Date(`${formattedDate}T${tempEndTime}:00`).toISOString() : null;

            import('@/lib/actions/events').then(({ updateEvent }) => {
                updateEvent(parseInt(event.id), {
                    location: location,
                    event_start_at: startAt,
                    event_end_at: endAt
                }).then(res => {
                    if (res.success) {
                        const adjusted = Number(res.ticketWindowAdjustments?.adjustedTickets || 0);
                        if (adjusted > 0) {
                            setToast({
                                message: `Date & location updated. ${adjusted} ticket sale window${adjusted === 1 ? '' : 's'} auto-adjusted.`,
                                type: 'info'
                            });
                        } else {
                            setToast({ message: 'Date & location updated!', type: 'success' });
                        }
                    }
                    else setToast({ message: 'Failed to update date/location.', type: 'error' });
                });
            });
        } else {
            setToast({ message: 'Date & location updated locally!', type: 'success' });
        }
    };

    const handleSaveBasicDetails = (e: React.FormEvent) => {
        e.preventDefault();
        const name = tempTitle.trim();
        const description = tempDescription.trim();
        const theme = tempTheme.trim();

        if (!name) {
            setToast({ message: 'Event title is required.', type: 'error' });
            return;
        }

        if (name.length > 100) {
            setToast({ message: 'Event title must be 100 characters or less.', type: 'error' });
            return;
        }

        if (description && description.length > 250) {
            setToast({ message: 'Event description must be 250 characters or less.', type: 'error' });
            return;
        }

        if (theme && theme.length > 50) {
            setToast({ message: 'Event theme must be 50 characters or less.', type: 'error' });
            return;
        }

        const updatedEvent = {
            ...event,
            name,
            description,
            theme,
        };
        
        setEvent(updatedEvent);
        setActiveModal(null);
        
        if (event.id !== 'new') {
            setToast({ message: 'Saving event details...', type: 'info' });
            import('@/lib/actions/events').then(({ updateEvent }) => {
                updateEvent(parseInt(event.id), {
                    title: name,
                    description: updatedEvent.description,
                    theme: updatedEvent.theme
                }).then(res => {
                    if (res.success) setToast({ message: 'Event details saved!', type: 'success' });
                    else setToast({ message: 'Failed to save details: ' + res.error, type: 'error' });
                });
            });
        } else {
            setToast({ message: 'Details updated locally!', type: 'success' });
        }
    };

    const handleAddObjective = () => {
        const objective = newObjective.trim();
        if (objective) {
            if (objective.length > 50) {
                setToast({ message: 'Objective must be 50 characters or less.', type: 'error' });
                return;
            }
            const updatedEvent = {
                ...event,
                objectives: [...event.objectives, objective]
            };
            setEvent(updatedEvent);
            setNewObjective("");
            setIsAddingObjective(false);
            if (event.id !== 'new') {
                setToast({ message: 'Saving objective...', type: 'info' });
                import('@/lib/actions/events').then(({ updateEvent }) => {
                    updateEvent(parseInt(event.id), {
                        objectives: updatedEvent.objectives
                    }).then(res => {
                        if (res.success) setToast({ message: 'Objective added!', type: 'success' });
                        else setToast({ message: 'Failed to save objective.', type: 'error' });
                    });
                });
            }
        }
    };

    const handleStartEditObjective = (index: number) => {
        setEditingObjectiveIndex(index);
        setEditingObjectiveValue(event.objectives[index]);
    };

    const handleCancelEditObjective = () => {
        setEditingObjectiveIndex(null);
        setEditingObjectiveValue("");
    };

    const handleSaveEditedObjective = () => {
        const value = editingObjectiveValue.trim();
        if (editingObjectiveIndex !== null && value) {
            if (value.length > 50) {
                setToast({ message: 'Objective must be 50 characters or less.', type: 'error' });
                return;
            }
            
            const newObjectives = [...event.objectives];
            newObjectives[editingObjectiveIndex] = value;
            
            const updatedEvent = {
                ...event,
                objectives: newObjectives
            };
            setEvent(updatedEvent);
            setEditingObjectiveIndex(null);
            setEditingObjectiveValue("");

            if (event.id !== 'new') {
                setToast({ message: 'Updating objective...', type: 'info' });
                import('@/lib/actions/events').then(({ updateEvent }) => {
                    updateEvent(parseInt(event.id), {
                        objectives: updatedEvent.objectives
                    }).then(res => {
                        if (res.success) setToast({ message: 'Objective updated!', type: 'success' });
                        else setToast({ message: 'Failed to update objective.', type: 'error' });
                    });
                });
            }
        }
    };

    const handleRemoveObjective = (index: number) => {
        const updatedEvent = {
            ...event,
            objectives: event.objectives.filter((_, i) => i !== index)
        };
        setEvent(updatedEvent);
        if (event.id !== 'new') {
            setToast({ message: 'Removing objective...', type: 'info' });
            import('@/lib/actions/events').then(({ updateEvent }) => {
                updateEvent(parseInt(event.id), {
                    objectives: updatedEvent.objectives
                }).then(res => {
                    if (res.success) setToast({ message: 'Objective removed!', type: 'success' });
                    else setToast({ message: 'Failed to update objectives.', type: 'error' });
                });
            });
        }
    };

    const handleAddAgendaSlot = async () => {
        if (!newAgenda.title || !newAgenda.speaker || !newAgenda.startTime || !newAgenda.endTime) return;

        const agendaStartMinutes = parseHHMMToMinutes(newAgenda.startTime);
        const agendaEndMinutes = parseHHMMToMinutes(newAgenda.endTime);
        if (agendaStartMinutes === null || agendaEndMinutes === null) {
            setToast({ message: 'Please provide valid agenda start and end times.', type: 'error' });
            return;
        }

        if (agendaStartMinutes >= agendaEndMinutes) {
            setToast({ message: 'Agenda end time must be later than agenda start time.', type: 'error' });
            return;
        }

        const eventStartMinutes = parseHHMMToMinutes(event.startTime);
        const eventEndMinutes = parseHHMMToMinutes(event.endTime);

        if (eventStartMinutes !== null && agendaStartMinutes < eventStartMinutes) {
            setToast({
                message: `Agenda cannot start earlier than event start time (${formatTimeDisplay(event.startTime || '')}).`,
                type: 'error'
            });
            return;
        }

        if (eventEndMinutes !== null && agendaEndMinutes > eventEndMinutes) {
            setToast({
                message: `Agenda cannot end later than event end time (${formatTimeDisplay(event.endTime || '')}).`,
                type: 'error'
            });
            return;
        }

        let updatedEvent: EventData;
        let itemToSave: AgendaItem;

        if (editingAgendaId) {
            // Update existing item
            updatedEvent = {
                ...event,
                agenda: event.agenda.map(item =>
                    item.id === editingAgendaId
                        ? { ...item, ...newAgenda } as AgendaItem
                        : item
                )
            };
            itemToSave = updatedEvent.agenda.find(i => i.id === editingAgendaId)!;
        } else {
            // Add new item
            const newItem: AgendaItem = {
                id: `new-${Date.now()}`, // Helper ID for optimistic update
                title: newAgenda.title || '',
                speaker: newAgenda.speaker || '',
                startTime: newAgenda.startTime || '',
                endTime: newAgenda.endTime || '',
                description: newAgenda.description || ''
            };

            updatedEvent = {
                ...event,
                agenda: [...(event.agenda || []), newItem]
            };
            itemToSave = newItem;
        }
        setEvent(updatedEvent);
        setNewAgenda({});
        setEditingAgendaId(null);
        setActiveModal(null);

        if (event.id !== 'new') {
            setToast({ message: 'Saving agenda item...', type: 'info' });
            const res = await saveAgendaSlot(parseInt(event.id), {
                id: itemToSave.id,
                title: itemToSave.title,
                description: itemToSave.description,
                speaker: itemToSave.speaker,
                startTime: itemToSave.startTime,
                endTime: itemToSave.endTime
            });

            if (res.success) {
                setToast({ message: 'Agenda item saved!', type: 'success' });
            } else {
                setToast({ message: 'Failed to save agenda item: ' + res.error, type: 'error' });
                console.error("Failed to save agenda item", res.error);
            }
        } else {
            setToast({ message: 'Agenda item added locally!', type: 'success' });
        }
    };

    const handleDeleteAgendaSlot = async (id: string) => {
        const updatedEvent = {
            ...event,
            agenda: event.agenda.filter(item => item.id !== id)
        };
        setEvent(updatedEvent);

        if (event.id !== 'new') {
            setToast({ message: 'Deleting agenda item...', type: 'info' });
            const res = await deleteAgendaSlot(id);
            if (res.success) {
                setToast({ message: 'Agenda item removed!', type: 'success' });
            } else {
                setToast({ message: 'Failed to remove agenda item: ' + res.error, type: 'error' });
                console.error("Failed to delete agenda item", res.error);
            }
        }
    };

    const handleEditAgendaItem = (item: AgendaItem) => {
        setNewAgenda(item);
        setEditingAgendaId(item.id);
        setActiveModal('agenda');
    };

    const handleDeleteBanner = () => {
        setActiveModal('deleteBanner');
    };

    const confirmDeleteBanner = async () => {
        const updatedEvent = { ...event, bannerUrl: undefined };
        setEvent(updatedEvent);
        setActiveModal(null);

        if (event.id !== 'new') {
            setToast({ message: 'Removing banner...', type: 'info' });
            try {
                const { updateEvent } = await import('@/lib/actions/events');
                const res = await updateEvent(parseInt(event.id), { banner_image: null });
                if (res.success) {
                    setToast({ message: 'Banner removed successfully!', type: 'success' });
                } else {
                    setToast({ message: 'Failed to remove banner from server.', type: 'error' });
                }
            } catch (e) {
                console.error('Error removing banner from server', e);
                setToast({ message: 'Error removing banner.', type: 'error' });
            }
        } else {
            setToast({ message: 'Banner removed successfully', type: 'info' });
        }
    };

    // Helper to compress image
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    const width = (scaleSize < 1) ? MAX_WIDTH : img.width;
                    const height = (scaleSize < 1) ? img.height * scaleSize : img.height;

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // Banner Upload Handlers
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            setToast({ message: 'File too large (max 20MB)', type: 'error' });
            return;
        }

        if (!file.type.startsWith('image/')) {
            setToast({ message: 'Please upload an image file', type: 'error' });
            return;
        }

        try {
            const compressedDataUrl = await compressImage(file);
            setTempBanner(compressedDataUrl);
        } catch (error) {
            console.error("Error compressing image", error);
            setToast({ message: 'Error processing image', type: 'error' });
        }
    };

    // Helper to convert data URL to Blob
    const dataURLtoBlob = (dataurl: string) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const handleSaveBanner = async () => {
        if (tempBanner) {

            // Optimistic update
            const updatedEvent = { ...event, bannerUrl: tempBanner };
            setEvent(updatedEvent);
            setActiveModal(null);
            setTempBanner(null);

            // If it's a new event (id='new'), we can't upload to server yet effectively without an ID,
            // or we upload but only save URL to state.
            // Assuming this is for existing events primarily based on user request.
            if (event.id !== 'new') {
                setToast({ message: 'Uploading banner...', type: 'info' });
                try {
                    const blob = dataURLtoBlob(tempBanner);
                    const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
                    const formData = new FormData();
                    formData.append('file', file);

                    // Dynamic import to avoid server-only module in client component issues if not handled by Next.js automatically
                    // But here we rely on the import at top. 
                    // To be safe, we might need to check how next.js handles this. 
                    // Usually safe if "use server" is at top of the file being imported.
                    const { uploadEventBanner, updateEvent } = await import('@/lib/actions/events');
                    formData.append('event_id', event.id.toString());

                    const uploadRes = await uploadEventBanner(formData);
                    if (uploadRes.success && uploadRes.url) {
                        const updateRes = await updateEvent(parseInt(event.id), { banner_image: uploadRes.url });
                        if (updateRes.success) {
                            setToast({ message: 'Banner saved to server!', type: 'success' });
                        } else {
                            console.error('Failed to update event record:', updateRes.error);
                            setToast({ message: 'Banner uploaded but failed to link to event.', type: 'error' });
                        }
                    } else {
                        console.error('Failed to upload banner:', uploadRes.error);
                        setToast({ message: `Failed to upload: ${uploadRes.error}`, type: 'error' });
                    }
                } catch (e: any) {
                    console.error("Error saving banner to server", e);
                    setToast({ message: `Error: ${e.message || 'Unknown error'}`, type: 'error' });
                }
            } else {
                setToast({ message: 'Banner update saved locally.', type: 'success' });
            }
        }
    };

    const handleCloseBannerModal = () => {
        setTempBanner(null);
        setActiveModal(null);
    };

    // Helper to format time for display
    const formatTimeDisplay = (time24: string) => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    // Helper to format date for display
    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            // Verify date is valid
            if (isNaN(date.getTime())) return dateStr;

            return new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                // timeZone: 'UTC'
            }).format(date);
        } catch (e) {
            return dateStr;
        }
    };

    // ... existing handlers ...

    const router = useRouter();

    const handleDeleteEvent = async () => {
        if (event.id === 'new') return;

        setIsDeleting(true);
        setToast({ message: 'Deleting event and all associated data...', type: 'info' });

        try {
            const result = await deleteEvent(parseInt(event.id));

            if (result.success) {
                setToast({ message: 'Event deleted successfully!', type: 'success' });
                // Redirect to events list quickly to avoid server-side 404 on revalidation
                setTimeout(() => {
                    router.push('/admin/events');
                }, 500);
            } else {
                setToast({ message: result.error || 'Failed to delete event', type: 'error' });
                setIsDeleting(false);
            }
        } catch (error) {
            console.error('Delete error:', error);
            setToast({ message: 'An unexpected error occurred during deletion.', type: 'error' });
            setIsDeleting(false);
        }
    };

    const handleCreateEvent = async () => {
        // Basic validation
        const title = event.name?.trim();
        if (!title) {
            setToast({ message: 'Event title is required.', type: 'error' });
            return;
        }

        if (title.length > 100) {
            setToast({ message: 'Event title must be 100 characters or less.', type: 'error' });
            return;
        }
        if (event.description && event.description.length > 250) {
            setToast({ message: 'Event description must be 250 characters or less.', type: 'error' });
            return;
        }

        if (event.theme && event.theme.length > 50) {
            setToast({ message: 'Event theme must be 50 characters or less.', type: 'error' });
            return;
        }

        if (event.objectives.some(obj => obj.length > 50)) {
            setToast({ message: 'Each objective must be 50 characters or less.', type: 'error' });
            return;
        }

        if (!event.date) {
            setToast({ message: 'Please select an event date.', type: 'error' });
            return;
        }

        setToast({ message: 'Creating event...', type: 'info' });

        try {
            const formData = new FormData();
            formData.append('name', event.name);
            formData.append('date', event.date);
            if (event.description) formData.append('description', event.description);
            if (event.startTime) formData.append('startTime', event.startTime);
            if (event.endTime) formData.append('endTime', event.endTime);
            if (event.location) formData.append('location', event.location);
            if (event.theme) formData.append('theme', event.theme);

            // Handle Banner Upload for Creation
            if (event.bannerUrl && event.bannerUrl.startsWith('data:')) {
                const blob = dataURLtoBlob(event.bannerUrl);
                const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
                formData.append('bannerFile', file);
            }

            // Serialize agenda and objectives
            if (event.agenda.length > 0) {
                formData.append('agenda', JSON.stringify(event.agenda));
            }
            if (event.objectives.length > 0) {
                // Determine if we are creating or updating. Here it's create.
                formData.append('objectives', JSON.stringify(event.objectives));
            }

            // Call Server Action
            const result = await createEvent({}, formData);

            if (result.success) {
                setToast({ message: 'Event created successfully!', type: 'success' });

                // Clear local storage for new event draft
                localStorage.removeItem(`event_detail_new`);

                // Redirect
                setTimeout(() => {
                    router.push('/admin/events');
                }, 1000);
            } else {
                setToast({ message: result.error || 'Failed to create event', type: 'error' });
            }

        } catch (error) {
            console.error('Creation error:', error);
            setToast({ message: 'An unexpected error occurred.', type: 'error' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8 pb-20 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-gray-100">
            {/* Toast Notification */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <style jsx global>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>

            {/* Page Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300">
                        <CheckCircle className="w-7 h-7 text-white" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {event.id === 'new' ? 'Create New Event' : 'Event Overview'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Manage your event details, schedule, and content
                        </p>
                    </div>
                </div>

                {event.id === 'new' ? (
                    <button
                        onClick={handleCreateEvent}
                        className="px-6 py-2.5 bg-[#3D518C] text-white rounded-xl text-sm font-semibold hover:bg-[#2d3d6b] transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <Check size={18} />
                        Save Event
                    </button>
                ) : isAdmin && (
                    <button
                        onClick={() => setActiveModal('deleteEvent')}
                        className="px-6 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center gap-2"
                    >
                        <Trash2 size={18} />
                        Delete Event
                    </button>
                )}
            </div>

            {/* Unified Event Hero Section */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg group/main">
                {/* 1. Banner Area */}
                <div className="relative w-full aspect-[21/7] md:aspect-[21/6] bg-gray-100 dark:bg-gray-900 overflow-hidden group/banner">
                    {event.bannerUrl ? (
                        <>
                            <Image
                                src={event.bannerUrl}
                                alt="Event Banner"
                                fill
                                sizes="(max-width: 1024px) 100vw, 1200px"
                                className="object-cover transition-transform duration-700 group-hover/banner:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover/banner:opacity-40 transition-opacity" />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                            <div 
                                onClick={() => setActiveModal('banner')}
                                className="flex flex-col items-center gap-3 cursor-pointer group/upload"
                            >
                                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover/upload:scale-110 transition-all duration-300 border border-dashed border-indigo-200 dark:border-indigo-800">
                                    <Upload size={28} />
                                </div>
                                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Upload Banner</span>
                            </div>
                        </div>
                    )}

                    {/* Banner Controls Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        {event.bannerUrl && (
                            <>
                                <button
                                    onClick={handleDeleteBanner}
                                    className="p-2.5 bg-white/20 hover:bg-red-500 text-white rounded-xl backdrop-blur-md border border-white/30 transition-all shadow-lg"
                                    title="Delete Banner"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setActiveModal('banner')}
                                    className="p-2.5 bg-white/20 hover:bg-indigo-600 text-white rounded-xl backdrop-blur-md border border-white/30 transition-all shadow-lg"
                                    title="Change Banner"
                                >
                                    <Pencil size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. Content Area */}
                <div className="p-8 md:p-10 space-y-8">
                    {/* Header: Title and Status */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                                    {event.status || 'Draft'}
                                </span>
                                <button
                                    onClick={() => setActiveModal('overview')}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                    title="Edit Basic Details"
                                >
                                    <Pencil size={16} />
                                </button>
                            </div>
                            
                            <div className="space-y-1">
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                    {event.name || "Untitled Event"}
                                </h1>
                                {event.theme && (
                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                        Theme: {event.theme}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description and Overview */}
                    <div className="pt-8 border-t border-gray-100 dark:border-gray-700 space-y-8 relative group/overview">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Left: Description */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">About the Event</h3>
                                {event.description ? (
                                    <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line font-medium tracking-tight">
                                        {event.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No description provided yet.</p>
                                )}
                            </div>

                            {/* Right: Theme & Objectives */}
                            <div className="space-y-6">
                                {event.objectives && event.objectives.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Key Objectives</h3>
                                        <ul className="space-y-3">
                                            {event.objectives.map((obj, i) => (
                                                <li key={i} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 text-sm md:text-base">
                                                    <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{obj}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Meta Row: Date & Location */}
                    <div className="flex flex-wrap items-start gap-x-12 gap-y-6 pt-8 border-t border-gray-100 dark:border-gray-700/50 relative">
                        {/* Date & Time */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Calendar size={20} />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                    {event.date ? formatDateDisplay(event.date) : "Date TBD"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                                    {event.startTime ? formatTimeDisplay(event.startTime) : "--:--"} - {event.endTime ? formatTimeDisplay(event.endTime) : "--:--"}
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <MapPin size={20} />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                    {event.location || "Location TBD"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mt-1">
                                    Venue Location
                                </p>
                            </div>
                        </div>

                        {/* Edit Button - Pinned to far right, aligned with first row */}
                        <button
                            onClick={() => setActiveModal('dateLocation')}
                            className="absolute top-8 right-0 p-2.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                            title="Edit Date & Location"
                        >
                            <Pencil size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 5. Agenda */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                            <List className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                Agenda
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                Schedule of activities
                            </p>
                        </div>
                    </div>
                    {event.agenda.length > 0 && canEditAgenda && (
                        <button
                            onClick={() => {
                                setNewAgenda({});
                                setEditingAgendaId(null);
                                setActiveModal('agenda');
                            }}
                            className="text-sm font-semibold text-white bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-md px-4 py-2 rounded-lg transition-all transform hover:-translate-y-0.5 font-sans"
                        >
                            + Add Item
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {event.agenda.length > 0 ? (
                        <div className="space-y-3">
                            {[...event.agenda]
                                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                                .map((slot, i) => (
                                    <div key={i} className="flex gap-4 py-4 px-6 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-md bg-white dark:bg-gray-800/50 group/item shadow-sm">
                                        <div className="min-w-[120px] pt-1">
                                            <div className="text-sm font-bold text-[#3D518C] dark:text-indigo-400 whitespace-nowrap bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg inline-block">
                                                {formatTimeDisplay(slot.startTime)}
                                            </div>
                                            {slot.endTime && (
                                                <div className="text-xs text-gray-400 mt-1 pl-1">
                                                    to {formatTimeDisplay(slot.endTime)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{slot.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    {slot.speaker && (
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md uppercase tracking-wide">
                                                            <Users size={12} className="text-gray-400 dark:text-gray-500" />
                                                            <span className="truncate max-w-[150px]">{slot.speaker}</span>
                                                        </div>
                                                    )}
                                                    {canEditAgenda && (
                                                        <div className="flex gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditAgendaItem(slot);
                                                                }}
                                                                className="text-gray-400 hover:text-indigo-500 transition-colors p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                                                                title="Edit Item"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteAgendaSlot(slot.id);
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                                                                title="Remove Item"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {slot.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">{slot.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <List size={24} />
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-medium mb-1">No agenda items</h3>
                            <p className="text-gray-500 text-sm mb-4">Start building your event schedule</p>
                            {canEditAgenda && (
                                <button
                                    onClick={() => {
                                        setNewAgenda({});
                                        setEditingAgendaId(null);
                                        setActiveModal('agenda');
                                    }}
                                    className="text-sm font-semibold text-white bg-[#3D518C] hover:bg-[#2D4178] px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                                >
                                    + Add First Item
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* --- MODALS --- */}

            {/* Banner Modal */}
            <Modal isOpen={activeModal === 'banner'} onClose={handleCloseBannerModal} title="Upload Banner" size="md">
                <div className="space-y-6">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    {tempBanner ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-700">
                            <Image
                                src={tempBanner}
                                alt="Banner Preview"
                                fill
                                sizes="(max-width: 768px) 100vw, 700px"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all"
                                >
                                    <Pencil size={20} />
                                </button>
                                <button
                                    onClick={() => setTempBanner(null)}
                                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative border-2 border-dashed border-gray-300 dark:border-gray-600 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-all duration-300 cursor-pointer hover:border-indigo-400"
                        >
                            <div className="w-14 h-14 bg-white dark:bg-gray-700 rounded-xl shadow-sm flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 border border-gray-100 dark:border-gray-600">
                                <Upload size={28} className="drop-shadow-sm" />
                            </div>
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Click to upload</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (max. 20MB)</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={handleCloseBannerModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors font-sans">Cancel</button>
                        <button
                            onClick={handleSaveBanner}
                            disabled={!tempBanner}
                            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all font-sans ${tempBanner
                                ? 'bg-gradient-to-r from-[#3D518C] to-indigo-600 hover:shadow-xl hover:-translate-y-0.5'
                                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                }`}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Title Modal */}
            <Modal isOpen={activeModal === 'title'} onClose={() => setActiveModal(null)} title="Edit Event Details" size="md">
                <form onSubmit={handleSaveTitle} className="space-y-6" noValidate>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Event Title</label>
                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${tempTitle.length >= 100 ? 'text-red-500' : 'text-gray-400'}`}>
                                {tempTitle.length} / 100 Characters
                            </span>
                        </div>
                        <ModalInput 
                            name="name" 
                            value={tempTitle} 
                            onChange={(e) => setTempTitle(e.target.value)}
                            placeholder="Input event title" 
                            required 
                            maxLength={100} 
                        />
                    </div>
                    <ModalFooter onCancel={() => setActiveModal(null)} />
                </form>
            </Modal>

            {/* Date/Location Modal */}
            <Modal isOpen={activeModal === 'dateLocation'} onClose={() => setActiveModal(null)} title="Edit Date & Location" size="lg">
                <form onSubmit={handleSaveDateLocation} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                            <DateInput
                                value={tempEventDate}
                                onChange={(date) => setTempEventDate(date)}
                                placeholder="Select event date"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                                <TimeInput
                                    value={tempStartTime}
                                    onChange={(time) => setTempStartTime(time)}
                                    placeholder="Select start time"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                                <TimeInput
                                    value={tempEndTime}
                                    onChange={(time) => setTempEndTime(time)}
                                    placeholder="Select end time"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location via Map</label>
                        <LocationMapPicker
                            value={tempLocation}
                            onChange={(val) => setTempLocation(val)}
                        />
                    </div>
                    <ModalFooter onCancel={() => setActiveModal(null)} />
                </form>
            </Modal>

            {/* Overview Modal */}
            <Modal isOpen={activeModal === 'overview'} onClose={() => setActiveModal(null)} title="Edit Event Basic Details" size="md">
                <form onSubmit={handleSaveBasicDetails} className="space-y-6" noValidate>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Event Title</label>
                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${tempTitle.length >= 100 ? 'text-red-500' : 'text-gray-400'}`}>
                                {tempTitle.length} / 100 Characters
                            </span>
                        </div>
                        <ModalInput 
                            name="title" 
                            value={tempTitle} 
                            onChange={(e) => setTempTitle(e.target.value)}
                            placeholder="Input event title" 
                            required 
                            maxLength={100} 
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Event Description</label>
                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${tempDescription.length >= 250 ? 'text-red-500' : 'text-gray-400'}`}>
                                {tempDescription.length} / 250 Characters
                            </span>
                        </div>
                        <ModalTextarea 
                            name="description" 
                            rows={5} 
                            value={tempDescription} 
                            onChange={(e) => setTempDescription(e.target.value)}
                            placeholder="What is this event about?" 
                            maxLength={250} 
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Theme</label>
                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${tempTheme.length >= 50 ? 'text-red-500' : 'text-gray-400'}`}>
                                {tempTheme.length} / 50 Characters
                            </span>
                        </div>
                        <ModalInput 
                            name="theme" 
                            value={tempTheme} 
                            onChange={(e) => setTempTheme(e.target.value)}
                            placeholder="e.g. Technology & Innovation" 
                            maxLength={50} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Objectives</label>
                        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-5 space-y-3 border border-gray-100 dark:border-gray-700">
                            {event.objectives.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No objectives added yet.</p>
                            )}
                            <ul className="space-y-2">
                                {event.objectives.map((obj, i) => (
                                    <li key={i} className={`flex items-center justify-between group bg-white dark:bg-gray-800 p-2.5 rounded-lg border shadow-sm transition-all ${editingObjectiveIndex === i ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200'}`}>
                                        {editingObjectiveIndex === i ? (
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        value={editingObjectiveValue}
                                                        onChange={(e) => setEditingObjectiveValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEditedObjective();
                                                            if (e.key === 'Escape') handleCancelEditObjective();
                                                        }}
                                                        maxLength={50}
                                                        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                                                    />
                                                    <button type="button" onClick={handleSaveEditedObjective} className="text-green-500 hover:text-green-600 transition-colors">
                                                        <Check size={16} />
                                                    </button>
                                                    <button type="button" onClick={handleCancelEditObjective} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-end pr-1">
                                                    <span className={`text-[9px] font-bold uppercase ${editingObjectiveValue.length >= 50 ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {editingObjectiveValue.length} / 50
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{obj}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button type="button" onClick={() => handleStartEditObjective(i)} className="text-gray-400 hover:text-indigo-500 transition-colors px-1" title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button type="button" onClick={() => handleRemoveObjective(i)} className="text-gray-400 hover:text-red-500 transition-colors px-1" title="Remove">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {/* Add Objective Input */}
                            <div className="flex items-center gap-2 mt-2">
                                {isAddingObjective ? (
                                    <div className="flex-1 flex flex-col gap-2 animate-in fade-in slide-in-from-left-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={objectiveInputRef}
                                                value={newObjective}
                                                onChange={(e) => setNewObjective(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                                                placeholder="Type a new objective..."
                                                maxLength={50}
                                                className="flex-1 px-4 py-2 text-sm rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 shadow-sm transition-all hover:border-indigo-400 dark:hover:border-indigo-400"
                                            />
                                            <button type="button" onClick={handleAddObjective} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                                                <Plus size={16} />
                                            </button>
                                            <button type="button" onClick={() => setIsAddingObjective(false)} className="text-gray-400 p-2 hover:text-gray-600">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Add Event Objective</p>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${newObjective.length >= 50 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {newObjective.length} / 50 Characters
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setIsAddingObjective(true)} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                                        <Plus size={16} /> Add Objective
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <ModalFooter onCancel={() => setActiveModal(null)} />
                </form>
            </Modal>

            {/* Agenda Modal */}
            <Modal isOpen={activeModal === 'agenda'} onClose={() => setActiveModal(null)} title="Add Agenda Item" size="md">
                <form onSubmit={(e) => { e.preventDefault(); handleAddAgendaSlot(); }} className="space-y-6">
                    {event.startTime && event.endTime ? (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
                            Agenda time must stay within the event window: <strong>{formatTimeDisplay(event.startTime)}</strong> to <strong>{formatTimeDisplay(event.endTime)}</strong>.
                        </div>
                    ) : null}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title <span className="text-red-500">*</span></label>
                        <ModalInput
                            required
                            value={newAgenda.title || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAgenda({ ...newAgenda, title: e.target.value })}
                            placeholder="e.g. Opening Keynote"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Speaker <span className="text-red-500">*</span></label>
                        <ModalInput
                            required
                            value={newAgenda.speaker || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAgenda({ ...newAgenda, speaker: e.target.value })}
                            placeholder="Name"
                            icon={<Users size={18} />}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time <span className="text-red-500">*</span></label>
                            <TimeInput
                                required
                                value={newAgenda.startTime || ''}
                                onChange={(time) => setNewAgenda({ ...newAgenda, startTime: time })}
                                placeholder="Select start time"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time <span className="text-red-500">*</span></label>
                            <TimeInput
                                required
                                value={newAgenda.endTime || ''}
                                onChange={(time) => setNewAgenda({ ...newAgenda, endTime: time })}
                                placeholder="Select end time"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <ModalTextarea
                            rows={3}
                            value={newAgenda.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAgenda({ ...newAgenda, description: e.target.value })}
                            placeholder="Brief description of the activity"
                        />
                    </div>
                    <ModalFooter
                        onCancel={() => setActiveModal(null)}
                        saveText={editingAgendaId ? "Save Changes" : "Add Item"}
                    />
                </form>
            </Modal>

            {/* Delete Banner Confirmation Modal */}
            <Modal isOpen={activeModal === 'deleteBanner'} onClose={() => setActiveModal(null)} title="Remove Banner?" size="sm">
                <div className="text-center space-y-6 py-2">
                    <div className="relative w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500 ring-8 ring-red-50/50 dark:ring-red-900/10">
                        <Trash2 size={32} className="drop-shadow-sm" />
                    </div>
                    <div>
                        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed px-4">
                            Are you sure you want to remove the event banner?<br />This action cannot be undone.
                        </p>
                    </div>
                    <ModalFooter
                        onCancel={() => setActiveModal(null)}
                        onSave={confirmDeleteBanner}
                        saveText="Yes, Remove It"
                        submitType="button"
                        isDanger={true}
                    />
                </div>
            </Modal>
            {/* Delete Event Modal */}
            <Modal
                isOpen={activeModal === 'deleteEvent'}
                onClose={() => setActiveModal(null)}
                title="Delete Event"
                subtitle="Permanent and destructive action"
                size="md"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3">
                        <Trash2 size={24} className="text-red-600 dark:text-red-400 shrink-0 mt-1" />
                        <div>
                            <p className="text-sm font-bold text-red-800 dark:text-red-300">Warning: Permanent Deletion</p>
                            <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                                Are you sure you want to delete <span className="font-bold underline">"{event.name}"</span>? 
                                This action is permanent and will remove all associated data including registrations, 
                                tickets, agenda slots, and order forms.
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 px-1">
                        Please type the word <span className="font-bold text-gray-900 dark:text-white">DELETE</span> to confirm.
                    </p>
                    <ModalInput
                        type="text"
                        placeholder="Type DELETE to confirm"
                        onChange={(e) => {
                            // We could add local verification here if we wanted
                        }}
                    />
                    <ModalFooter 
                        onCancel={() => setActiveModal(null)}
                        onSave={handleDeleteEvent}
                        saveText="Delete Event"
                        isDanger={true}
                        isSubmitting={isDeleting}
                        submitType="button"
                    />
                </div>
            </Modal>
        </div>
    );
}
