import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { getAddOnClaimSummariesByRegistrationIds } from "@/lib/checkinAddOnClaims";

type CheckInRegistrationRow = {
  id: number;
  has_checked_in: boolean | null;
  checked_in_at: string | null;
  User?: {
    name?: string | null;
    email?: string | null;
  } | null;
  Ticket?: {
    name?: string | null;
  } | null;
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
      .from("Registration")
      .select(
        "id, status, has_checked_in, checked_in_at, User(name, email), Ticket(name)"
      )
      .eq("event_id", id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const registrationRows = ((data || []) as CheckInRegistrationRow[]);

    const registrationIds = registrationRows
      .map((row) => Number(row.id))
      .filter((regId: number) => Number.isInteger(regId) && regId > 0);

    const addOnSummaryByRegistrationId = await getAddOnClaimSummariesByRegistrationIds(
      supabase,
      registrationIds
    );

    const attendees = registrationRows.map((row) => {
      const summary = addOnSummaryByRegistrationId.get(Number(row.id));
      const claimableAddOns = summary?.claimableAddOns || [];
      const claimableAddOnQty = Number(summary?.claimableAddOnQty || 0);
      const totalAddOnQty = Number(summary?.totalAddOnQty || 0);
      const addOnClaimStatus = summary?.addOnClaimStatus || "None";

      return {
        registrationId: String(row.id),
        name: row.User?.name || "Unknown",
        email: row.User?.email || "",
        ticketType: row.Ticket?.name || "General Admission",
        status: row.has_checked_in ? "Checked-In" : "Not Yet Checked-In",
        checkInTime:
          row.has_checked_in && row.checked_in_at
            ? new Date(row.checked_in_at).toLocaleString()
            : undefined,
        totalAddOnQty,
        claimableAddOnQty,
        addOnClaimStatus,
        claimableAddOns,
      };
    });

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
