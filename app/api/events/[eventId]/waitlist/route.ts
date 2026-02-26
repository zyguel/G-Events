import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
        const { eventId } = await params;
        const id = parseInt(eventId, 10);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId" },
                { status: 400 }
            );
        }

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

        return NextResponse.json({ success: true, data: entries });
    } catch (e: any) {
        console.error("ManageWaitlist GET error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

