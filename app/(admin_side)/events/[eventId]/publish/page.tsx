"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { getEventData, EventData } from "@/lib/api";
import PublishEventContent from "@/components/admin/PublishEventContent";

export default function PublishEventPage() {
    const params = useParams();
    const eventId = params.eventId as string;

    // Use any here to allow flexibility since we are mixing API types with mapped local types
    const [eventData, setEventData] = useState<any | null>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvent = async () => {
            if (!eventId) return;

            // 1. Try fetching from "API" (mock logic)
            try {
                const apiData = await getEventData(eventId);
                // Check if apiData is valid and not empty for local events
                if (apiData && (apiData.id !== eventId || apiData.name !== "New Event")) {
                    setEventData(apiData);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.log("Error fetching from API, checking local storage...", e);
            }

            // 2. Fallback to localStorage
            try {
                // Fetch Tickets
                const localTickets = localStorage.getItem(`event_tickets_${eventId}`);
                if (localTickets) {
                    setTickets(JSON.parse(localTickets));
                }

                // Try getting full detail first
                const localDetail = localStorage.getItem(`event_detail_${eventId}`);
                if (localDetail) {
                    const parsed = JSON.parse(localDetail);
                    // Map bannerUrl to bannerImage if needed, as PublishEventContent uses bannerImage
                    if (parsed.bannerUrl && !parsed.bannerImage) {
                        parsed.bannerImage = parsed.bannerUrl;
                    }
                    setEventData(parsed);
                    setLoading(false);
                    return;
                }

                // Fallback to summary list
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
                    // Reconstruct a basic event object
                    const reconstructedEvent: any = {
                        id: summaryEvent.id,
                        name: summaryEvent.name,
                        date: summaryEvent.rawDate || summaryEvent.date,
                        status: summaryEvent.status || 'Draft',
                        location: summaryEvent.location || '',
                        // Default empty values for other expected fields
                        description: '',
                        startTime: '',
                        endTime: '',
                        bannerImage: undefined,

                        // Mock stats for structure compatibility if needed
                        stats: { totalEvents: 0, registrations: 0, revenue: 0, satisfaction: 0, expenses: 0, netProfit: 0 },
                        comments: [],
                        trends: { registrations: { weekly: [], weekLabels: [], registrationOpenDate: "", eventDate: "" }, attendance: { checkedIn: 0, noShow: 0, waitlisted: 0 } },
                        revenueBreakdown: [],
                        recentTransactions: []
                    };

                    setEventData(reconstructedEvent);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error("Error loading from local storage", e);
            }

            // If we get here, truly not found
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
                <PublishEventContent event={eventData} tickets={tickets} />
            </main>
        </div>
    );
}
