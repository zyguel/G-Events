import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; registrationId: string }> }
) {
  try {
    await requireUser();

    const { eventId, registrationId } = await params;
    const parsedEventId = parseInt(eventId, 10);
    const parsedRegistrationId = parseInt(registrationId, 10);

    if (isNaN(parsedEventId) || isNaN(parsedRegistrationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid eventId or registrationId" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body?.checkedIn !== "boolean") {
      return NextResponse.json(
        { success: false, error: "checkedIn must be a boolean" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const checkedInAt = body.checkedIn ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("Registration")
      .update({ has_checked_in: body.checkedIn, checked_in_at: checkedInAt })
      .eq("id", parsedRegistrationId)
      .eq("event_id", parsedEventId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;

    console.error("Check-in PATCH error:", e);
    return NextResponse.json(
      { success: false, error: "Unexpected error while updating check-in" },
      { status: 500 }
    );
  }
}
