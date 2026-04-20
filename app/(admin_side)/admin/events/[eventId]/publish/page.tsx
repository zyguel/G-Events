"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EventData } from "@/lib/types";
import PublishEventContent from "@/components/admin/PublishEventContent";
import { getEventById } from "@/lib/actions/events";
import { getTickets } from "@/lib/eventManagement";

export default function PublishEventPage() {
    const params = useParams();
    const slug = params.eventId as string;
    const idPart = slug?.split("-").pop() ?? "";
    const eventId = idPart;

    // Use any here to allow flexibility since we are mixing API types with mapped local types
    const [eventData, setEventData] = useState<any | null>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvent = async () => {
            if (!eventId) return;

            try {
                const id = parseInt(eventId);
                if (!isNaN(id)) {
                    // Fetch event and tickets concurrently
                    const [apiData, ticketsData] = await Promise.all([
                        getEventById(id),
                        getTickets(eventId)
                    ]);

                    if (apiData) {
                        // Derive status
                        const now = new Date();
                        const startDate = apiData.event_start_at ? new Date(apiData.event_start_at) : null;
                        const endDate = apiData.event_end_at ? new Date(apiData.event_end_at) : null;

                        let status = 'Draft';
                        if (apiData.is_published) {
                            if (endDate && endDate < now) {
                                status = 'Completed';
                            } else if (startDate && startDate <= now && endDate && endDate >= now) {
                                status = 'Ongoing';
                            } else {
                                status = 'Published';
                            }
                        }

                        const reconstructedEvent: any = {
                            id: apiData.id.toString(),
                            name: apiData.title,
                            date: apiData.event_start_at || '',
                            status: status,
                            location: apiData.location || '',
                            description: apiData.description || '',
                            startTime: startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                            endTime: endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                            bannerImage: apiData.banner_image,

                            // Registration Settings
                            allowGroupRegistration: apiData.allow_group_registration,
                            allowWaitlist: apiData.allow_waitlist,
                            enableBreakoutSession: apiData.allow_breakout_sessions,
                            isVisibleToPublic: apiData.is_visible,

                            // Registration Dates/Times
                            registrationOpenDate: apiData.registration_open_at ? new Date(apiData.registration_open_at).toISOString().split('T')[0] : '',
                            registrationOpenTime: apiData.registration_open_at ? new Date(apiData.registration_open_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                            registrationCloseDate: apiData.registration_close_at ? new Date(apiData.registration_close_at).toISOString().split('T')[0] : '',
                            registrationCloseTime: apiData.registration_close_at ? new Date(apiData.registration_close_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',

                            // Mock stats
                            stats: { totalEvents: 0, registrations: 0, revenue: 0, satisfaction: 0, expenses: 0, netProfit: 0 },
                            comments: [],
                            trends: { registrations: { weekly: [], weekLabels: [], registrationOpenDate: "", eventDate: "" }, attendance: { checkedIn: 0, noShow: 0, waitlisted: 0 } },
                            revenueBreakdown: [],
                            recentTransactions: []
                        };

                        setEventData(reconstructedEvent);
                        setTickets(ticketsData || []);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.log("Error fetching from API", e);
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
            <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D518C]"></div>
            </div>
        );
    }

    if (!eventData) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h1>
                    <p className="text-gray-600 dark:text-gray-400">The event you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return <PublishEventContent event={eventData} tickets={tickets} />;
}
