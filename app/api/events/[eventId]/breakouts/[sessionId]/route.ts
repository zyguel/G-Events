import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireUser } from '@/lib/apiAuth';

type UiType = "Online" | "In-Person";
type UiStatus = "Not Started" | "Ongoing" | "Completed" | "Cancelled";

interface SpeakerPayload {
    name: string;
    imageUrl?: string;
}

interface SessionPayload {
    id?: string;
    title: string;
    type: UiType;
    status: UiStatus;
    date: string;
    time: string;
    location?: string;
    joinLink?: string;
    maxCapacity: number;
    speakers: SpeakerPayload[];
}

const buildDescription = (session: SessionPayload) =>
    JSON.stringify({
        date: session.date,
        time: session.time,
        type: session.type,
        status: session.status,
        joinLink: session.joinLink,
    });

const parseDescription = (raw: any) => {
    if (!raw) return {};
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const mapRowToSession = (row: any) => {
    const meta = parseDescription(row.description);
    const currentAttendees =
        Array.isArray(row.BreakoutSessionRegistration) &&
        row.BreakoutSessionRegistration.length > 0
            ? row.BreakoutSessionRegistration.length
            : 0;

    const speakers: SpeakerPayload[] = row.speaker_name
        ? String(row.speaker_name)
              .split(",")
              .map((name: string) => ({ name: name.trim() }))
              .filter((s: SpeakerPayload) => s.name.length > 0)
        : [];

    const type: UiType = meta.type === "In-Person" ? "In-Person" : "Online";
    const status: UiStatus =
        meta.status === "Ongoing" ||
        meta.status === "Completed" ||
        meta.status === "Cancelled"
            ? meta.status
            : "Not Started";

    return {
        id: row.id.toString(),
        title: row.name || "",
        type,
        status,
        date: meta.date || "",
        time: meta.time || "",
        location: row.room_name || "",
        joinLink: meta.joinLink || "",
        currentAttendees,
        maxCapacity: row.room_capacity || 0,
        speakers,
    };
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; sessionId: string }> }
) {
    try {
        await requireUser();
        const { eventId, sessionId } = await params;
        const eventNumericId = parseInt(eventId, 10);
        const breakoutId = parseInt(sessionId, 10);

        if (isNaN(eventNumericId) || isNaN(breakoutId)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId or sessionId" },
                { status: 400 }
            );
        }

        const body = (await request.json().catch(() => null)) as {
            session?: SessionPayload;
        } | null;

        if (!body?.session) {
            return NextResponse.json(
                { success: false, error: "Missing session payload" },
                { status: 400 }
            );
        }

        const session = body.session;
        const description = buildDescription(session);
        const speakerName = session.speakers.map(s => s.name.trim()).join(", ");

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("BreakoutSession")
            .update({
                name: session.title,
                description,
                room_name: session.location || null,
                room_capacity: session.maxCapacity || 0,
                speaker_name: speakerName || null,
            })
            .eq("id", breakoutId)
            .eq("event_id", eventNumericId)
            .select(
                "id, name, description, room_name, room_capacity, speaker_name, BreakoutSessionRegistration(id)"
            )
            .single();

        if (error) {
            console.error("ManageBreakouts PATCH: update failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const updated = mapRowToSession(data);
        revalidatePath(`/admin/events/${eventNumericId}/breakouts`);

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        console.error("ManageBreakouts PATCH error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string; sessionId: string }> }
) {
    try {
        await requireUser();
        const { eventId, sessionId } = await params;
        const eventNumericId = parseInt(eventId, 10);
        const breakoutId = parseInt(sessionId, 10);

        if (isNaN(eventNumericId) || isNaN(breakoutId)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId or sessionId" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Find affected registrations before deletion
        const { data: affectedRegs } = await supabase
            .from("BreakoutSessionRegistration")
            .select("registration_id")
            .eq("breakout_session_id", breakoutId);

        const { error } = await supabase
            .from("BreakoutSession")
            .delete()
            .eq("id", breakoutId)
            .eq("event_id", eventNumericId);

        if (error) {
            console.error("ManageBreakouts DELETE: delete failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Sync Registration table for affected attendees
        if (affectedRegs && affectedRegs.length > 0) {
            const regIds = affectedRegs.map(r => r.registration_id);
            await supabase
                .from("Registration")
                .update({ has_breakout_session_registration: false })
                .in("id", regIds);
        }

        revalidatePath(`/admin/events/${eventNumericId}/breakouts`);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("ManageBreakouts DELETE error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

