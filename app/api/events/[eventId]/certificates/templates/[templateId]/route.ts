import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string; templateId: string }> }
) {
  try {
    await requireUser();
    const { eventId, templateId } = await params;
    const parsedEventId = parseInt(eventId, 10);
    const parsedTemplateId = parseInt(templateId, 10);

    if (isNaN(parsedEventId) || isNaN(parsedTemplateId)) {
      return NextResponse.json(
        { success: false, error: "Invalid eventId or templateId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("CertificateTemplate")
      .select("id")
      .eq("id", parsedTemplateId)
      .eq("event_id", parsedEventId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("CertificateTemplate")
      .delete()
      .eq("id", parsedTemplateId)
      .eq("event_id", parsedEventId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Template deleted" });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
