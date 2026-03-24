import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { processQueuedCertificateEmails } from "@/lib/certificates";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUser();
    const { eventId } = await params;
    const id = parseInt(eventId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid eventId" }, { status: 400 });
    }

    const supabase = await createClient();
    const result = await processQueuedCertificateEmails(supabase, request.nextUrl.origin, {
      eventId: id,
      limit: 100,
    });

    return NextResponse.json({
      success: true,
      message: "Certificate email queue processed",
      ...result,
    });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
