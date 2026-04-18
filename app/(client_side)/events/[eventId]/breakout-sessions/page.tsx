import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getPublishedEventById } from '@/lib/actions/events';
import MyBreakoutsClient from './MyBreakoutsClient';

type BreakoutMeta = {
    type?: string;
    status?: string;
    date?: string;
    time?: string;
    joinLink?: string;
};

export default async function MyBreakoutsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId: slug } = await params;
    const eventId = parseInt(slug?.split('-').pop() ?? '', 10);

    if (isNaN(eventId)) {
        return notFound();
    }

    const event = await getPublishedEventById(eventId);
    if (!event) {
        return notFound();
    }

    if (!event.allow_breakout_sessions) {
        return (
            <div className="p-8 mt-24 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Breakout Sessions Not Available</h1>
                <p className="text-gray-600 dark:text-gray-400">Breakout sessions are not enabled for this event.</p>
                <div className="mt-6"><a href={`/events/${slug}`} className="text-blue-500 hover:text-blue-600 underline font-medium">Return to Event Page</a></div>
            </div>
        );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return redirect(`/login?redirect=/events/${slug}`);
    }

    // Verify user is registered
    const { data: userRow } = await supabase.from('User').select('id').ilike('email', user.email).limit(1).single();
    if (!userRow) {
        return redirect(`/events/${slug}`);
    }

    const { data: regList, error: regError } = await supabase.from('Registration')
        .select('id, status, profile_pending')
        .eq('event_id', eventId)
        .eq('user_id', userRow.id)
        .order('created_at', { ascending: false })
        .limit(1);

    if (regError || !regList || regList.length === 0) {
        console.error("Registration check failed:", regError, "User ID:", userRow.id, "Event ID:", eventId);
        return (
            <div className="p-8 mt-24 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Registration Not Found</h1>
                <p>We couldn&apos;t verify your registration for this event. You must be registered to select breakout sessions.</p>
                <div className="mt-4"><a href={`/events/${slug}`} className="text-blue-500 underline">Go Back</a></div>
            </div>
        );
    }
    const reg = regList[0];
    const status = String(reg.status || '').toLowerCase();

    if (status === 'cancelled' || status === 'rejected') {
        return (
            <div className="p-8 mt-24 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Registration Not Found</h1>
                <p>We couldn&apos;t verify your registration for this event. You must be registered to select breakout sessions.</p>
                <div className="mt-4"><a href={`/events/${slug}`} className="text-blue-500 underline">Go Back</a></div>
            </div>
        );
    }

    if (status !== 'confirmed') {
        return (
            <div className="p-8 mt-24 text-center">
                <h1 className="text-2xl font-bold text-amber-500 mb-4">Registration Pending Approval</h1>
                <p>Your event registration is still pending organizer review. You can choose breakout sessions after your registration is confirmed.</p>
                <div className="mt-4"><a href={`/events/${slug}`} className="text-blue-500 underline">Go Back</a></div>
            </div>
        );
    }

    if (reg.profile_pending === true) {
        return (
            <div className="p-8 mt-24 text-center">
                <h1 className="text-2xl font-bold text-amber-500 mb-4">Complete Your Registration</h1>
                <p>Finish your registration details before selecting a breakout session.</p>
                <div className="mt-4"><a href={`/events/${slug}`} className="text-blue-500 underline">Go Back</a></div>
            </div>
        );
    }

    // Fetch all breakout sessions
    const { data: sessionsData, error: sessionsError } = await supabase
        .from('BreakoutSession')
        .select(`
            id, name, description, room_name, room_capacity, speaker_name,
            BreakoutSessionRegistration(registration_id)
        `)
        .eq('event_id', eventId)
        .order('id', { ascending: true });

    if (sessionsError) {
        console.error("Failed to load sessions:", sessionsError);
        return <div className="p-8 text-center text-red-500">Failed to load breakout sessions.</div>;
    }

    // Parse sessions
    const parseDescription = (raw: unknown): BreakoutMeta => {
        if (!raw) return {};
        try {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            return parsed && typeof parsed === "object" ? (parsed as BreakoutMeta) : {};
        } catch {
            return {};
        }
    };

    const sessions = (sessionsData || []).map(row => {
        const meta = parseDescription(row.description);
        
        const registrations = Array.isArray(row.BreakoutSessionRegistration) ? row.BreakoutSessionRegistration : [];
        const currentAttendees = registrations.length;
        const isJoined = registrations.some((r: { registration_id: number }) => r.registration_id === reg.id);

        const speakers = row.speaker_name
            ? String(row.speaker_name).split(",").map(name => ({ name: name.trim() })).filter(s => s.name.length > 0)
            : [];

        return {
            id: row.id.toString(),
            title: row.name || "",
            type: (meta.type === "In-Person" ? "In-Person" : "Online") as "In-Person" | "Online",
            status: meta.status || "Not Started",
            date: meta.date || "",
            time: meta.time || "",
            location: row.room_name || "",
            joinLink: meta.joinLink || "",
            currentAttendees,
            maxCapacity: row.room_capacity || 0,
            speakers,
            isJoined
        };
    });

    return (
        <MyBreakoutsClient 
            event={{ slug, title: event.title, id: eventId }}
            initialSessions={sessions} 
        />
    );
}
