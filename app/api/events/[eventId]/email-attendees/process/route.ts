import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { processDueCampaigns } from "@/lib/emailCampaigns";

export async function POST(
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
    const result = await processDueCampaigns(supabase, { eventId: id, limit: 20 });

    return NextResponse.json({
      success: true,
      message: "Scheduled campaigns processed",
      ...result,
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;

    console.error("Process scheduled campaigns error:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unexpected error while processing scheduled campaigns",
      },
      { status: 500 }
    );
  }
}
