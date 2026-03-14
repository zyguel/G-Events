import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const id = parseInt(eventId, 10);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("BreakoutSession")
            .select(
                "id, name, description, room_name, room_capacity, speaker_name, BreakoutSessionRegistration(id)"
            )
            .eq("event_id", id)
            .order("id", { ascending: true });

        if (error) {
            console.error("ManageBreakouts GET: query failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const rows = data || [];
        const sessions = rows.map(mapRowToSession);

        return NextResponse.json({ success: true, data: sessions });
    } catch (e: any) {
        console.error("ManageBreakouts GET error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const id = parseInt(eventId, 10);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId" },
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

        const { data, error } = await supabase
            .from("BreakoutSession")
            .insert([
                {
                    event_id: id,
                    name: session.title,
                    description,
                    room_name: session.location || null,
                    room_capacity: session.maxCapacity || 0,
                    speaker_name: speakerName || null,
                },
            ])
            .select(
                "id, name, description, room_name, room_capacity, speaker_name, BreakoutSessionRegistration(id)"
            )
            .single();

        if (error) {
            console.error("ManageBreakouts POST: insert failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const created = mapRowToSession(data);
        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (e: any) {
        console.error("ManageBreakouts POST error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

