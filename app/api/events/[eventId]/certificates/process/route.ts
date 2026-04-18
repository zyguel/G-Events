import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseForEventOr404 } from "@/lib/apiEventAccess";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { processQueuedCertificateEmails } from "@/lib/certificates";
import { resolveTrustedAppOrigin } from "@/lib/security";

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

    const access = await getAdminSupabaseForEventOr404(id);
    if (!access.ok) return access.response;

    const supabase = access.supabase;
    const appOrigin = resolveTrustedAppOrigin(request.nextUrl.origin)
    const result = await processQueuedCertificateEmails(supabase, appOrigin, {
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
      { success: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
