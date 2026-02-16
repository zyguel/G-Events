"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { getEventData } from "@/lib/api";
import EventOverview from "@/components/admin/EventOverview";

export default function EventOverviewPage() {
    const params = useParams();
    const eventId = params.eventId as string; // useParams returns string | string[]

    // Define the type for event data
    type EventDataType = {
        id: string;
        name: string;
        date: string;
        status: "Draft" | "Ongoing" | "Completed" | "Not Yet Published" | "Published" | "Not Started" | "Cancelled";
        [key: string]: any;
    };

    const [eventData, setEventData] = useState<EventDataType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvent = async () => {
            if (!eventId) return;

            // 1. Priority: Check localStorage for full detail (User edits/Status updates)
            try {
                const localDetail = localStorage.getItem(`event_detail_${eventId}`);
                if (localDetail) {
                    setEventData(JSON.parse(localDetail));
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error("Error loading from local storage", e);
            }

            // 2. Secondary: Fetch from "API" (Mock data or valid server data)
            try {
                const apiData = await getEventData(eventId);
                if (apiData) {
                    setEventData(apiData);
                    setLoading(false);
                    return;
                }
            } catch {
                console.log("Not found in API, checking other sources...");
            }

            // 3. Fallback: Check summary list in localStorage (mock_created_events)
            try {
                type StoredEvent = {
                    id: string;
                    name: string;
                    date: string;
                    rawDate?: string;
                    status?: "Draft" | "Ongoing" | "Completed" | "Not Yet Published" | "Published" | "Not Started" | "Cancelled";
                    location?: string;
                };

                const storedEvents: StoredEvent[] = JSON.parse(localStorage.getItem('mock_created_events') || '[]');
                const summaryEvent = storedEvents.find((e) => e.id === eventId);

                if (summaryEvent) {
                    // Reconstruct a basic event object compatible with EventOverview
                    setEventData({
                        id: summaryEvent.id,
                        name: summaryEvent.name,
                        date: summaryEvent.rawDate || summaryEvent.date,
                        status: summaryEvent.status || 'Draft',
                        location: summaryEvent.location,
                        objectives: [],
                        agenda: [],
                        description: '',
                        subtitle: '',
                        startTime: '',
                        endTime: ''
                    });
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error("Error loading summary from local storage", e);
            }

            // 4. Truly not found
            setEventData(null);
            setLoading(false);
        };

        loadEvent();
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D518C]"></div>
            </div>
        );
    }

    if (!eventData) {
        return notFound();
    }

    return (
        <div className="flex flex-col h-screen text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth">
                <EventOverview initialData={eventData} />
            </main>
        </div>
    );
}
