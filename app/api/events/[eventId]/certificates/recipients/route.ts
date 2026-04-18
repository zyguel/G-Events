import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseForEventOr404 } from "@/lib/apiEventAccess";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { getEventCertificateRecipients } from "@/lib/certificates";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUser();
    const { eventId } = await params;
    const id = parseInt(eventId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid eventId" }, { status: 400 });
    }

    const access = await getAdminSupabaseForEventOr404(id);
    if (!access.ok) return access.response;

    const recipients = await getEventCertificateRecipients(access.supabase, id);
    return NextResponse.json({ success: true, data: recipients });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
