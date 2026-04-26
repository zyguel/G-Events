import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseForEventOr404 } from "@/lib/apiEventAccess";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string; campaignId: string }> }
) {
  try {
    await requireUser();

    const { eventId, campaignId } = await params;
    const parsedEventId = parseInt(eventId, 10);
    const parsedCampaignId = parseInt(campaignId, 10);

    if (isNaN(parsedEventId) || isNaN(parsedCampaignId)) {
      return NextResponse.json(
        { success: false, error: "Invalid eventId or campaignId" },
        { status: 400 }
      );
    }

    const access = await getAdminSupabaseForEventOr404(parsedEventId);
    if (!access.ok) return access.response;
    const supabase = access.supabase;

    const { data: existing, error: existingError } = await supabase
      .from("EventEmailCampaign")
      .select("id")
      .eq("id", parsedCampaignId)
      .eq("event_id", parsedEventId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("EventEmailCampaign")
      .delete()
      .eq("id", parsedCampaignId)
      .eq("event_id", parsedEventId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Campaign deleted" });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;

    if (process.env.NODE_ENV === 'development') {
        console.error("Email campaign DELETE error:", e);
    }
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unexpected error while deleting campaign",
      },
      { status: 500 }
    );
  }
}
