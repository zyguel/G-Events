import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { extractCheckInToken, verifyCheckInToken } from "@/lib/checkinQr";

type MaybeRelation<T> = T | T[] | null | undefined;

function pickSingleRelation<T>(value: MaybeRelation<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUser();

    const { eventId } = await params;
    const parsedEventId = parseInt(eventId, 10);

    if (isNaN(parsedEventId)) {
      return NextResponse.json(
        { success: false, error: "Invalid eventId" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const qrData = String(body?.qrData || "").trim();
    if (!qrData) {
      return NextResponse.json(
        { success: false, error: "qrData is required" },
        { status: 400 }
      );
    }

    const token = extractCheckInToken(qrData);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Could not read QR token" },
        { status: 400 }
      );
    }

    const verification = verifyCheckInToken(token);
    if (!verification.valid || !verification.claims) {
      return NextResponse.json(
        { success: false, error: verification.reason || "Invalid check-in QR code" },
        { status: 400 }
      );
    }

    const claims = verification.claims;
    if (claims.eid !== parsedEventId) {
      return NextResponse.json(
        { success: false, error: "This QR code is not valid for the current event" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: registration, error: registrationError } = await supabase
      .from("Registration")
      .select("id, event_id, has_checked_in, checked_in_at, User(name, email), Ticket(name)")
      .eq("id", claims.rid)
      .eq("event_id", parsedEventId)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found for this QR code" },
        { status: 404 }
      );
    }

    const attendee = pickSingleRelation<{ name?: string | null; email?: string | null }>(registration.User);
    const ticket = pickSingleRelation<{ name?: string | null }>(registration.Ticket);

    const attendeeEmail = String(attendee?.email || "").trim().toLowerCase();
    if (attendeeEmail && attendeeEmail !== claims.email) {
      return NextResponse.json(
        { success: false, error: "QR attendee details do not match registration data" },
        { status: 400 }
      );
    }

    let checkedInAt = registration.checked_in_at || null;
    let alreadyCheckedIn = !!registration.has_checked_in;

    if (!alreadyCheckedIn) {
      checkedInAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("Registration")
        .update({ has_checked_in: true, checked_in_at: checkedInAt })
        .eq("id", claims.rid)
        .eq("event_id", parsedEventId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      alreadyCheckedIn,
      attendee: {
        registrationId: String(registration.id),
        name: attendee?.name || "Unknown",
        email: attendee?.email || "",
        ticketType: ticket?.name || "General Admission",
        status: "Checked-In",
        checkInTime: checkedInAt ? new Date(checkedInAt).toLocaleString() : undefined,
      },
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;

    console.error("Check-in scan POST error:", e);
    return NextResponse.json(
      { success: false, error: "Unexpected error while scanning QR" },
      { status: 500 }
    );
  }
}
