import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await params;
    const numericRegistrationId = Number.parseInt(registrationId, 10);

    if (!Number.isFinite(numericRegistrationId) || numericRegistrationId <= 0) {
      return NextResponse.json({ success: false, error: "Invalid registration id" }, { status: 400 });
    }

    const sessionClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = await createAdminClient();

    const { data: userRow, error: userError } = await adminClient
      .from("User")
      .select("id")
      .ilike("email", user.email)
      .limit(1)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
    }

    const userId = Number(userRow?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });
    }

    const { data: registration, error: registrationError } = await adminClient
      .from("Registration")
      .select("id, user_id, status, has_checked_in")
      .eq("id", numericRegistrationId)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    if (Number(registration.user_id) !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const currentStatus = String(registration.status || "pending").toLowerCase();
    if (currentStatus === "cancelled") {
      return NextResponse.json({ success: true, message: "Already withdrawn" });
    }

    if (registration.has_checked_in) {
      return NextResponse.json(
        { success: false, error: "You cannot withdraw after check-in." },
        { status: 409 }
      );
    }

    const { error: updateError } = await adminClient
      .from("Registration")
      .update({
        status: "cancelled",
        has_checked_in: false,
        checked_in_at: null,
      })
      .eq("id", numericRegistrationId)
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "You have been withdrawn from this event.",
      data: { registrationId: numericRegistrationId, status: "cancelled" },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
        console.error("Withdraw ticket error:", error);
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
