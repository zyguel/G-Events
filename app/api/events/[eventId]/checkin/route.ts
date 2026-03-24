import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";

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
      .from("Registration")
      .select(
        "id, status, has_checked_in, created_at, User(name, email), Ticket(name)"
      )
      .eq("event_id", id)
      .not("status", "in", "(cancelled,rejected)")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const attendees = (data || []).map((row: any) => ({
      registrationId: String(row.id),
      name: row.User?.name || "Unknown",
      email: row.User?.email || "",
      ticketType: row.Ticket?.name || "General Admission",
      status: row.has_checked_in ? "Checked-In" : "Not Yet Checked-In",
      checkInTime:
        row.has_checked_in && row.created_at
          ? new Date(row.created_at).toLocaleString()
          : undefined,
    }));

    return NextResponse.json({ success: true, data: attendees });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;

    console.error("Check-in GET error:", e);
    return NextResponse.json(
      { success: false, error: "Unexpected error while loading attendees" },
      { status: 500 }
    );
  }
}
