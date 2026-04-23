import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions/events";
import BreakoutsClient from "./BreakoutsClient";
import PermissionGate from "@/components/admin/PermissionGate";

export const metadata = {
    title: 'Breakout Sessions',
};

export default async function BreakoutsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // Validate eventId slug
    if (!eventId || eventId === 'undefined') {
        console.error('Invalid eventId slug:', eventId);
        return notFound();
    }

    const slug = eventId;
    const idPart = slug.split('-').pop() ?? '';
    const id = parseInt(idPart, 10);
    if (isNaN(id)) return notFound();

    const data = await getEventById(id);

    if (!data) {
        console.error('Event not found for eventId:', eventId);
        return notFound();
    }

    // Derive status
    const now = new Date();
    const startDate = data.event_start_at ? new Date(data.event_start_at) : null;
    const endDate = data.event_end_at ? new Date(data.event_end_at) : null;

    let status: "Draft" | "Completed" | "Ongoing" | "Published" | "Not Yet Published" | "Not Started" | "Cancelled" = 'Draft';
    if (data.is_published) {
        if (endDate && endDate < now) {
            status = 'Completed';
        } else if (startDate && startDate <= now && endDate && endDate >= now) {
            status = 'Ongoing';
        } else {
            status = 'Published';
        }
    }

    const event = {
        id: data.id.toString(),
        name: data.title,
        date: data.event_start_at || '',
        status: status
    };

    if (!data.allow_breakout_sessions) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Breakout Sessions Disabled</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Breakout sessions are currently disabled for this event. To manage breakout sessions, you must first enable them in the Publish Event {'>'} Registration Settings page.
                </p>
            </div>
        );
    }

    return (
        <PermissionGate permission="Create Breakout Sessions">
            <BreakoutsClient event={event} />
        </PermissionGate>
    );
}
