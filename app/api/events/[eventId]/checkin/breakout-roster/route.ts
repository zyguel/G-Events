import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";

/**
 * GET /api/events/[eventId]/checkin/breakout-roster
 * Attendees with a breakout seat: name, session, breakout check-in status (for admin check-in desk).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUser();

    const { eventId } = await params;
    const id = parseInt(eventId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid eventId" }, { status: 400 });
    }

    const admin = await createAdminClient();

    const { data: sessions, error } = await admin
      .from("BreakoutSession")
      .select(
        "id, name, BreakoutSessionRegistration(id, check_in_time, status, registration_id, Registration(id, status, User(name, email), Ticket(name)))"
      )
      .eq("event_id", id)
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    type RegRow = {
      id: number;
      status?: string | null;
      User?: { name?: string; email?: string } | null;
      Ticket?: { name?: string } | null;
    };

    const rows: {
      breakoutRegistrationId: number;
      registrationId: string;
      name: string;
      email: string;
      ticketType: string;
      sessionId: number;
      sessionTitle: string;
      registrationStatus: string;
      breakoutCheckedIn: boolean;
      breakoutCheckInTime: string | null;
    }[] = [];

    for (const s of sessions || []) {
      const sessionTitle = (s as { name?: string }).name || `Session ${(s as { id: number }).id}`;
      const sessionId = (s as { id: number }).id;
      const regs = (s as { BreakoutSessionRegistration?: unknown[] }).BreakoutSessionRegistration || [];

      for (const br of regs) {
        const b = br as {
          id: number;
          check_in_time: string | null;
          status: string | null;
          registration_id: number;
          Registration: RegRow | null;
        };
        const reg = b.Registration;
        if (!reg) continue;
        const st = String(reg.status || "").toLowerCase();
        if (st !== "confirmed") continue;

        const checkedIn =
          !!b.check_in_time || String(b.status || "").toLowerCase() === "checked_in";

        rows.push({
          breakoutRegistrationId: b.id,
          registrationId: String(reg.id),
          name: reg.User?.name || "Unknown",
          email: reg.User?.email || "",
          ticketType: reg.Ticket?.name || "General Admission",
          sessionId,
          sessionTitle,
          registrationStatus: String(reg.status || "pending"),
          breakoutCheckedIn: checkedIn,
          breakoutCheckInTime: b.check_in_time
            ? new Date(String(b.check_in_time)).toLocaleString()
            : null,
        });
      }
    }

    rows.sort((a, b) => {
      const bySession = a.sessionTitle.localeCompare(b.sessionTitle);
      if (bySession !== 0) return bySession;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    console.error("breakout-roster GET", e);
    return NextResponse.json(
      { success: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
