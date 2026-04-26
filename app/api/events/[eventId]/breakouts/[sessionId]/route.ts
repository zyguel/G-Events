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
    date: string; // YYYY-MM-DD format
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    location?: string;
    joinLink?: string;
    maxCapacity: number;
    speakers: SpeakerPayload[];
}

function formatTimeDisplay(startTime: string, endTime: string): string {
    if (!startTime) return "";
    const start = formatTime12Hour(startTime);
    const end = endTime ? formatTime12Hour(endTime) : "";
    return end ? `${start} – ${end}` : start;
}

function formatTime12Hour(time24: string): string {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time24;
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function calculateStatus(
    sessionStatus: string,
    sessionDate: string | null,
    startTime: string | null,
    endTime: string | null
): UiStatus {
    // Cancelled is always manual - respect what was set
    if (sessionStatus === "Cancelled") return "Cancelled";
    
    // If no date, default to Not Started
    if (!sessionDate) return "Not Started";
    
    // Use current timestamp
    const now = new Date();
    
    // Parse the session date components directly to avoid timezone issues
    // sessionDate format: YYYY-MM-DD
    const [year, month, day] = sessionDate.split('-').map(Number);
    if (!year || !month || !day) return "Not Started";
    
    // Parse start time (HH:MM) - default to midnight
    let startHour = 0, startMinute = 0;
    if (startTime) {
        const [h, m] = startTime.split(':').map(Number);
        if (!isNaN(h)) startHour = h;
        if (!isNaN(m)) startMinute = m;
    }
    
    // Parse end time (HH:MM) - default to 23:59
    let endHour = 23, endMinute = 59;
    if (endTime) {
        const [h, m] = endTime.split(':').map(Number);
        if (!isNaN(h)) endHour = h;
        if (!isNaN(m)) endMinute = m;
    }
    
    // Create timestamps using local time (same approach for all dates)
    // Note: month is 0-indexed in JavaScript Date
    const startDateTime = new Date(year, month - 1, day, startHour, startMinute, 0);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute, 59);
    
    // Handle overnight sessions (end time before start time)
    if (endTime && startTime && (endHour < startHour || (endHour === startHour && endMinute <= startMinute))) {
        endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    // Determine status based on current time
    if (now < startDateTime) {
        return "Not Started";
    } else if (now >= startDateTime && now <= endDateTime) {
        return "Ongoing";
    } else {
        return "Completed";
    }
}

function validateSessionPayload(session: SessionPayload): string | null {
    const title = String(session.title || '').trim();
    const date = String(session.date || '').trim();
    const startTime = String(session.startTime || '').trim();
    const endTime = String(session.endTime || '').trim();
    const maxCapacity = Number(session.maxCapacity);
    const location = String(session.location || '').trim();
    const joinLink = String(session.joinLink || '').trim();

    if (!title) return 'Session title is required.';
    if (!date) return 'Session date is required.';
    if (!startTime) return 'Session start time is required.';
    if (!endTime) return 'Session end time is required.';
    if (!Number.isFinite(maxCapacity) || maxCapacity <= 0) {
        return 'Session max capacity must be greater than 0.';
    }

    if (!joinLink && !location) {
        return session.type === 'Online'
            ? 'Join link is required for online sessions.'
            : 'Location is required for in-person sessions.';
    }

    return null;
}

const buildDescription = (session: SessionPayload) =>
    JSON.stringify({
        type: session.type,
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

    const inferredType: UiType = meta.type === "In-Person"
        ? "In-Person"
        : meta.type === "Online"
            ? "Online"
            : row.room_name
                ? "In-Person"
                : "Online";
    
    // Helper to extract HH:MM from timestamp (handles both "HH:MM:SS" and ISO "2024-01-15T18:54:00")
    const extractTime = (timestamp: string | null): string => {
        if (!timestamp) return "";
        // If it contains T, it's an ISO timestamp - extract time portion
        if (timestamp.includes('T')) {
            const timePart = timestamp.split('T')[1]; // "18:54:00+00:00" or "18:54:00"
            return timePart.slice(0, 5); // "18:54"
        }
        // Otherwise assume it's already HH:MM:SS
        return timestamp.slice(0, 5);
    };
    
    // Get raw status from DB and calculate computed status
    const rawStatus = row.status || "Not Started";
    const startTimeStr = extractTime(row.start_time);
    const endTimeStr = extractTime(row.end_time);
    
    const computedStatus = calculateStatus(
        rawStatus,
        row.session_date,
        startTimeStr || null,
        endTimeStr || null
    );
    
    // Format time display
    const timeDisplay = formatTimeDisplay(startTimeStr, endTimeStr);
    
    // Format date display
    const dateDisplay = row.session_date 
        ? new Date(row.session_date + 'T00:00:00').toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
        : "";

    return {
        id: row.id.toString(),
        title: row.name || "",
        type: inferredType,
        status: computedStatus,
        rawStatus: rawStatus,
        date: dateDisplay,
        sessionDate: row.session_date || "",
        startTime: startTimeStr,
        endTime: endTimeStr,
        time: timeDisplay,
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
        const validationError = validateSessionPayload(session);
        if (validationError) {
            return NextResponse.json(
                { success: false, error: validationError },
                { status: 400 }
            );
        }

        const requestedCapacity = Number(session.maxCapacity);
        const supabase = await createClient();

        const { data: existingSession, error: existingSessionError } = await supabase
            .from("BreakoutSession")
            .select("room_capacity, status")
            .eq("id", breakoutId)
            .eq("event_id", eventNumericId)
            .maybeSingle();

        if (existingSessionError) {
            return NextResponse.json(
                { success: false, error: existingSessionError.message },
                { status: 500 }
            );
        }

        if (!existingSession) {
            return NextResponse.json(
                { success: false, error: "Breakout session not found" },
                { status: 404 }
            );
        }

        const existingCapacity = Number(existingSession.room_capacity || 0);

        const { count: attendeeCount, error: attendeeCountError } = await supabase
            .from("BreakoutSessionRegistration")
            .select("id", { count: "exact", head: true })
            .eq("breakout_session_id", breakoutId);

        if (attendeeCountError) {
            return NextResponse.json(
                { success: false, error: attendeeCountError.message },
                { status: 500 }
            );
        }

        if (
            Number.isFinite(requestedCapacity)
            && requestedCapacity > 0
            && (attendeeCount || 0) > requestedCapacity
            && requestedCapacity !== existingCapacity
        ) {
            return NextResponse.json(
                { success: false, error: "Maximum capacity cannot be lower than current attendees." },
                { status: 400 }
            );
        }

        const description = buildDescription(session);
        const speakerName = session.speakers.map(s => s.name.trim()).join(", ");
        
        // Parse times and combine with date for timestamp format
        const sessionDate = session.date || null;
        const startTime = session.startTime && sessionDate ? `${sessionDate}T${session.startTime}:00` : null;
        const endTime = session.endTime && sessionDate ? `${sessionDate}T${session.endTime}:00` : null;
        
        // Only update status if explicitly changed to Cancelled or if it was Cancelled and changed to something else
        // Otherwise, let the auto-calculation handle it
        let newStatus: string = existingSession.status || 'Not Started';
        if (session.status === 'Cancelled') {
            newStatus = 'Cancelled';
        } else if (newStatus === 'Cancelled') {
            // If changing from Cancelled to non-Cancelled, set to Not Started (will be auto-calculated on next fetch)
            newStatus = 'Not Started';
        }
        
        const { data, error } = await supabase
            .from("BreakoutSession")
            .update({
                name: session.title,
                description,
                room_name: session.location || null,
                room_capacity: session.maxCapacity || 0,
                speaker_name: speakerName || null,
                session_date: session.date || null,
                start_time: startTime,
                end_time: endTime,
                status: newStatus,
            })
            .eq("id", breakoutId)
            .eq("event_id", eventNumericId)
            .select(
                "id, name, description, room_name, room_capacity, speaker_name, session_date, start_time, end_time, status, BreakoutSessionRegistration(id)"
            )
            .single();

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error("ManageBreakouts PATCH: update failed", error);
            }
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const updated = mapRowToSession(data);
        revalidatePath(`/admin/events/${eventNumericId}/breakouts`);

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        if (process.env.NODE_ENV === 'development') {
            console.error("ManageBreakouts PATCH error:", e);
        }
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
            if (process.env.NODE_ENV === 'development') {
                console.error("ManageBreakouts DELETE: delete failed", error);
            }
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
        if (process.env.NODE_ENV === 'development') {
            console.error("ManageBreakouts DELETE error:", e);
        }
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

