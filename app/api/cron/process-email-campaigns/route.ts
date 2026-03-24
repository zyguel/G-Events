import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { processDueCampaigns } from "@/lib/emailCampaigns";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const result = await processDueCampaigns(supabase, { limit: 50 });

    return NextResponse.json({
      success: true,
      message: "Processed due campaigns",
      ...result,
    });
  } catch (e) {
    console.error("Cron email processing error:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unexpected cron processing error",
      },
      { status: 500 }
    );
  }
}
