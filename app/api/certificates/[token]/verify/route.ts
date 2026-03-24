import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { verifyCertificateByToken } from "@/lib/certificates";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 400 });
    }

    const supabase = await createClient();
    const result = await verifyCertificateByToken(supabase, token);

    if (!result.found) {
      return NextResponse.json(
        { success: false, verified: false, error: result.reason || "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: result.isValid,
      reason: result.reason || null,
      blockchain: result.verification || null,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, verified: false, error: e instanceof Error ? e.message : "Unexpected verification error" },
      { status: 500 }
    );
  }
}
