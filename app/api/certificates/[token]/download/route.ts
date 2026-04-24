import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import {
  buildCertificatePdfBuffer,
  CertificateTemplateRow,
  getCertificateLedgerMetaByToken,
} from "@/lib/certificates";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: issue, error: issueError } = await supabase
      .from("CertificateIssue")
      .select("id, recipient_name, template_id")
      .eq("access_token", token)
      .single();

    if (issueError || !issue) {
      return NextResponse.json({ success: false, error: "Certificate not found" }, { status: 404 });
    }

    const { data: template, error: templateError } = await supabase
      .from("CertificateTemplate")
      .select("*")
      .eq("id", issue.template_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: "Certificate template missing" }, { status: 404 });
    }

    const ledgerMeta = await getCertificateLedgerMetaByToken(supabase, token);
    const verificationText = ledgerMeta
      ? `Blockchain Ref #${ledgerMeta.blockIndex} | Block ${ledgerMeta.blockHash.slice(0, 16)}... | Cert ${ledgerMeta.certificateHash.slice(0, 16)}...`
      : "Blockchain Ref: not anchored";

    const pdfBuffer = await buildCertificatePdfBuffer(
      template as CertificateTemplateRow,
      issue.recipient_name,
      verificationText
    );

    const safeName = String(issue.recipient_name || "attendee")
      .replace(/[^a-z0-9-_ ]/gi, "")
      .trim()
      .replace(/\s+/g, "_");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate_${safeName || "attendee"}.pdf"`,
        ...(ledgerMeta
          ? {
              "X-Certificate-Block-Hash": ledgerMeta.blockHash,
              "X-Certificate-Hash": ledgerMeta.certificateHash,
              "X-Certificate-Block-Index": String(ledgerMeta.blockIndex),
            }
          : {}),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unexpected certificate download error" },
      { status: 500 }
    );
  }
}
