import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { processQueuedCertificateEmails } from "@/lib/certificates";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const result = await processQueuedCertificateEmails(supabase, request.nextUrl.origin, { limit: 100 });

    return NextResponse.json({
      success: true,
      message: "Certificate email queue processed",
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unexpected cron processing error" },
      { status: 500 }
    );
  }
}
