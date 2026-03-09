"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import EventOverview from "@/components/admin/EventOverview";
import { getEventById } from "@/lib/actions/events";

export default function EventOverviewPage() {
    const params = useParams();
    const slug = params.eventId as string; // useParams returns string | string[]
    const idPart = slug?.split("-").pop() ?? "";
    const eventId = idPart; // numeric ID as string

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

            // 1. Fetch from Supabase
            try {
                // Ensure eventId is a number if your DB uses number IDs
                console.log('Overview Page: eventId slug:', slug);
                const id = parseInt(eventId);
                console.log('Overview Page: parsed id:', id);

                if (!isNaN(id)) {
                    console.log('Overview Page: Calling getEventById with', id);
                    const apiData = await getEventById(id);
                    console.log('Overview Page: API Data:', apiData);

                    if (apiData) {
                        const now = new Date();
                        const startDate = apiData.event_start_at ? new Date(apiData.event_start_at) : null;
                        const endDate = apiData.event_end_at ? new Date(apiData.event_end_at) : null;

                        let status: "Draft" | "Ongoing" | "Completed" | "Not Yet Published" | "Published" | "Not Started" | "Cancelled" = 'Draft';

                        if (apiData.is_published) {
                            if (endDate && endDate < now) {
                                status = 'Completed';
                            } else if (startDate && startDate <= now && endDate && endDate >= now) {
                                status = 'Ongoing'; // or Live
                            } else {
                                status = 'Published'; // or Upcoming
                            }
                        }

                        const formatTime = (date: Date) => {
                            return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                        };

                        setEventData({
                            id: apiData.id.toString(),
                            name: apiData.title,
                            date: apiData.event_start_at ? new Date(apiData.event_start_at).toISOString().split('T')[0] : '',
                            status: status,
                            location: apiData.location,
                            description: apiData.description,
                            agenda: apiData.AgendaSlot?.map((slot: any) => ({
                                id: slot.id,
                                title: slot.title,
                                description: slot.description,
                                startTime: slot.start_time ? formatTime(new Date(slot.start_time)) : '',
                                endTime: slot.end_time ? formatTime(new Date(slot.end_time)) : '',
                                speaker: slot.speaker_name
                            })) || [],
                            // Map other fields as necessary
                            objectives: apiData.objectives || [],
                            theme: apiData.theme || '',
                            startTime: startDate ? formatTime(startDate) : '',
                            endTime: endDate ? formatTime(endDate) : '',
                            bannerUrl: apiData.banner_image
                        });
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.error("Error loading from API", e);
            }

            // 2. Fallback to Local Storage (keep for backward compatibility or drafts)
            try {
                const localDetail = localStorage.getItem(`event_detail_${eventId}`);
                if (localDetail) {
                    setEventData(JSON.parse(localDetail));
                    setLoading(false);
                    return;
                }
            } catch (e) {
                // console.error("Error loading from local storage", e);
            }

            // 3. Not found
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
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h1>
                    <p className="text-gray-600 dark:text-gray-400">The event you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
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
