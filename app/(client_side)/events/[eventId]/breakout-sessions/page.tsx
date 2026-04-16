import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getPublishedEventById } from '@/lib/actions/events';
import MyBreakoutsClient from './MyBreakoutsClient';

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
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userRow.id)
        .not('status', 'in', '("cancelled","rejected")')
        .limit(1);

    if (regError || !regList || regList.length === 0) {
        console.error("Registration check failed:", regError, "User ID:", userRow.id, "Event ID:", eventId);
        return (
            <div className="p-8 mt-24 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Registration Not Found</h1>
                <p>We couldn't verify your registration for this event. You must be registered to select breakout sessions.</p>
                <div className="mt-4"><a href={`/events/${slug}`} className="text-blue-500 underline">Go Back</a></div>
            </div>
        );
    }
    const reg = regList[0];

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
    const parseDescription = (raw: any) => {
        if (!raw) return {};
        try {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
            return {};
        }
    };

    const sessions = (sessionsData || []).map(row => {
        const meta = parseDescription(row.description);
        
        const registrations = Array.isArray(row.BreakoutSessionRegistration) ? row.BreakoutSessionRegistration : [];
        const currentAttendees = registrations.length;
        const isJoined = registrations.some((r: any) => r.registration_id === reg.id);

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
