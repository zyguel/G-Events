"use client";

import { useMemo } from "react";

import EventOverview from "@/components/admin/EventOverview";
import AuditLogViewer from "@/components/admin/AuditLogViewer";
import { useEventData } from "../EventDataContext";

interface AgendaSlot {
    id: number;
    title: string;
    description?: string;
    speaker_name?: string;
    start_time?: string;
    end_time?: string;
    order?: number;
}

export default function EventOverviewPage() {
    const initialEvent = useEventData();

    // Define the type for event data
    type EventDataType = {
        id: string;
        name: string;
        date: string;
        status: "Draft" | "Ongoing" | "Completed" | "Not Yet Published" | "Published" | "Not Started" | "Cancelled";
        location?: string;
        description?: string;
        agenda?: Array<{ id: number; title: string; description?: string; startTime?: string; endTime?: string; speaker?: string }>;
        objectives?: string[];
        theme?: string;
        startTime?: string;
        endTime?: string;
        bannerUrl?: string;
    };

    const eventData = useMemo<EventDataType | null>(() => {
        if (!initialEvent) {
            return null;
        }

        const now = new Date();
        const startDate = initialEvent.event_start_at ? new Date(initialEvent.event_start_at) : null;
        const endDate = initialEvent.event_end_at ? new Date(initialEvent.event_end_at) : null;

        let status: "Draft" | "Ongoing" | "Completed" | "Not Yet Published" | "Published" | "Not Started" | "Cancelled" = 'Draft';

        if (initialEvent.is_published) {
            if (endDate && endDate < now) {
                status = 'Completed';
            } else if (startDate && startDate <= now && endDate && endDate >= now) {
                status = 'Ongoing';
            } else {
                status = 'Published';
            }
        }

        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        return {
            id: initialEvent.id.toString(),
            name: initialEvent.title,
            date: initialEvent.event_start_at ? new Date(initialEvent.event_start_at).toISOString().split('T')[0] : '',
            status,
            location: initialEvent.location,
            description: initialEvent.description,
            agenda: initialEvent.AgendaSlot?.map((slot: AgendaSlot) => ({
                id: slot.id,
                title: slot.title,
                description: slot.description,
                startTime: slot.start_time ? formatTime(new Date(slot.start_time)) : '',
                endTime: slot.end_time ? formatTime(new Date(slot.end_time)) : '',
                speaker: slot.speaker_name
            })) || [],
            objectives: initialEvent.objectives || [],
            theme: initialEvent.theme || '',
            startTime: startDate ? formatTime(startDate) : '',
            endTime: endDate ? formatTime(endDate) : '',
            bannerUrl: initialEvent.banner_image
        };
    }, [initialEvent]);

    if (!eventData) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h1>
                    <p className="text-gray-600 dark:text-gray-400">The event you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <EventOverview initialData={eventData} />
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
                <AuditLogViewer entityType="Event" entityId={parseInt(eventData.id, 10)} />
            </div>
        </>
    );
}
