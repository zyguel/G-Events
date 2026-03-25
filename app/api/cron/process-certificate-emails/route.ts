import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { processQueuedCertificateEmails } from "@/lib/certificates";
import { resolveTrustedAppOrigin, safeCompareSecrets } from "@/lib/security";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  const providedSecret = request.headers.get("x-cron-secret")

  if (!safeCompareSecrets(expectedSecret, providedSecret)) {
    return NextResponse.json({ success: false, error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const appOrigin = resolveTrustedAppOrigin(request.nextUrl.origin)
    const result = await processQueuedCertificateEmails(supabase, appOrigin, { limit: 100 });

    return NextResponse.json({
      success: true,
      message: "Certificate email queue processed",
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Unexpected cron processing error" },
      { status: 500 }
    );
  }
}
