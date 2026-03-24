import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';

type UiStatus = "Invited" | "Waiting";

const mapStatusToUi = (s: string | null): UiStatus => {
    if (!s) return "Waiting";
    const normalized = s.toLowerCase();
    if (normalized === "invited") return "Invited";
    return "Waiting";
};

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
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
            .from("WaitlistEntry")
            .select("id, email, status, created_at, ticket_id, Ticket(name)")
            .eq("event_id", id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("ManageWaitlist GET: query failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const rows = data || [];

        // Compute queue per ticket type
        const counters = new Map<string, number>();

        const entries = rows.map((row: any) => {
            const ticketType: string = row.Ticket?.name || "General Admission";
            const current = counters.get(ticketType) ?? 0;
            const queue = current + 1;
            counters.set(ticketType, queue);

            const email: string = row.email || "";

            return {
                id: row.id?.toString() || "",
                fullName: email || "Unknown",
                email,
                ticketType,
                queue,
                status: mapStatusToUi(row.status || null),
            };
        });

        const { data: settingsRow, error: settingsError } = await supabase
            .from("EventWaitlistSettings")
            .select("expiry_days, invite_type, show_position")
            .eq("event_id", id)
            .single();

        if (settingsError && settingsError.code !== "PGRST116") {
            console.error("ManageWaitlist GET: settings query failed", settingsError);
            return NextResponse.json(
                { success: false, error: settingsError.message },
                { status: 500 }
            );
        }

        const settings = settingsRow
            ? {
                  expiryDays: String(settingsRow.expiry_days ?? 7),
                  inviteType: settingsRow.invite_type === "manual" ? "manual" : "auto",
                  showPosition: !!settingsRow.show_position,
              }
            : {
                  expiryDays: "7",
                  inviteType: "auto",
                  showPosition: false,
              };

        return NextResponse.json({ success: true, data: entries, settings });
    } catch (e: any) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageWaitlist GET error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId, 10);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId" },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const action = body?.action as string | undefined;
        const entryId = parseInt(String(body?.entryId ?? ""), 10);
        const supabase = await createClient();

        if (action === "save_settings") {
            const expiryDays = parseInt(String(body?.expiryDays ?? ""), 10);
            const inviteType = body?.inviteType === "manual" ? "manual" : "auto";
            const showPosition = !!body?.showPosition;

            if (isNaN(expiryDays) || expiryDays < 1 || expiryDays > 30) {
                return NextResponse.json(
                    { success: false, error: "expiryDays must be between 1 and 30" },
                    { status: 400 }
                );
            }

            const { error: settingsError } = await supabase
                .from("EventWaitlistSettings")
                .upsert(
                    {
                        event_id: id,
                        expiry_days: expiryDays,
                        invite_type: inviteType,
                        show_position: showPosition,
                    },
                    { onConflict: "event_id" }
                );

            if (settingsError) {
                return NextResponse.json(
                    { success: false, error: settingsError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, message: "Waitlist settings saved" });
        }

        if (action !== "invite") {
            return NextResponse.json(
                { success: false, error: "Unsupported action" },
                { status: 400 }
            );
        }

        if (isNaN(entryId)) {
            return NextResponse.json(
                { success: false, error: "Invalid waitlist entry ID" },
                { status: 400 }
            );
        }

        // Ensure entry belongs to event before mutation.
        const { data: existing, error: existingError } = await supabase
            .from("WaitlistEntry")
            .select("id, event_id, status")
            .eq("id", entryId)
            .eq("event_id", id)
            .single();

        if (existingError || !existing) {
            return NextResponse.json(
                { success: false, error: "Waitlist entry not found" },
                { status: 404 }
            );
        }

        if ((existing.status || "").toLowerCase() === "invited") {
            return NextResponse.json(
                { success: true, message: "Entry already invited" }
            );
        }

        const { error } = await supabase
            .from("WaitlistEntry")
            .update({ status: "invited" })
            .eq("id", entryId)
            .eq("event_id", id);

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: "Invite sent" });
    } catch (e: any) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageWaitlist PATCH error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

