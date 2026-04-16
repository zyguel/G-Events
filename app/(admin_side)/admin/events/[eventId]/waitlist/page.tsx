import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions/events";
import WaitlistClient from "./WaitlistClient";
import PermissionGate from "@/components/admin/PermissionGate";

export default async function WaitlistPage({ params }: { params: Promise<{ eventId: string }> }) {
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

    if (!data.allow_waitlist) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Waitlist Disabled</h2>
                    <p className="text-gray-500 dark:text-gray-400">The waitlist feature is currently disabled for this event. You can enable it in the Publish Settings.</p>
                </div>
            </div>
        );
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

    return (
        <PermissionGate permission="Manage Waitlist">
            <WaitlistClient event={event} />
        </PermissionGate>
    );
}
