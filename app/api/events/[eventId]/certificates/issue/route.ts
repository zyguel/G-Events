import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import {
  anchorCertificateIssuesToLedger,
  enqueueCertificateIssues,
  getEventCertificateRecipients,
  processQueuedCertificateEmails,
} from "@/lib/certificates";
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

    const body = await request.json().catch(() => ({}));
    const templateId = parseInt(String(body?.templateId ?? ""), 10);
    const queueEmail = !!body?.queueEmail;
    const recipientIds: number[] | null = Array.isArray(body?.recipientIds)
      ? body.recipientIds.map((v: unknown) => Number(v)).filter((v: number) => !Number.isNaN(v))
      : null;

    if (isNaN(templateId)) {
      return NextResponse.json(
        { success: false, error: "templateId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: template, error: templateError } = await supabase
      .from("CertificateTemplate")
      .select("id")
      .eq("id", templateId)
      .eq("event_id", id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { success: false, error: "Certificate template not found" },
        { status: 404 }
      );
    }

    let recipients = await getEventCertificateRecipients(supabase, id);
    if (recipientIds && recipientIds.length > 0) {
      const allowed = new Set(recipientIds);
      recipients = recipients.filter((r) => r.registrationId !== null && allowed.has(r.registrationId));
    }

    const issueCount = await enqueueCertificateIssues(supabase, id, templateId, recipients, queueEmail);
    const anchoredCount = await anchorCertificateIssuesToLedger(supabase, id, templateId, recipients);

    let emailProcessing: { processed: number; sent: number; failed: number } | null = null;
    if (queueEmail) {
      const appOrigin = resolveTrustedAppOrigin(request.nextUrl.origin)
      emailProcessing = await processQueuedCertificateEmails(supabase, appOrigin, {
        eventId: id,
        limit: 50,
      });
    }

    return NextResponse.json({
      success: true,
      message: queueEmail ? "Certificates issued and email queue processed" : "Certificates issued",
      issuedCount: issueCount,
      anchoredCount,
      emailProcessing,
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
