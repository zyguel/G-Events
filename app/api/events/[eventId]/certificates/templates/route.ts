import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseForEventOr404 } from "@/lib/apiEventAccess";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";

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

    const { data, error } = await access.supabase
      .from("CertificateTemplate")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireUser();
    const { eventId } = await params;
    const id = parseInt(eventId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid eventId" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const backgroundImage = String(body?.backgroundImage || "").trim();
    const nameX = Number(body?.nameX ?? 150);
    const nameY = Number(body?.nameY ?? 150);
    const fontSize = Number(body?.fontSize ?? 28);
    const fontColor = String(body?.fontColor || "#000000");

    if (!name || !backgroundImage) {
      return NextResponse.json(
        { success: false, error: "name and backgroundImage are required" },
        { status: 400 }
      );
    }

    const access = await getAdminSupabaseForEventOr404(id);
    if (!access.ok) return access.response;

    const { data, error } = await access.supabase
      .from("CertificateTemplate")
      .insert([
        {
          event_id: id,
          name,
          background_image: backgroundImage,
          name_x: Number.isNaN(nameX) ? 150 : nameX,
          name_y: Number.isNaN(nameY) ? 150 : nameY,
          font_size: Number.isNaN(fontSize) ? 28 : fontSize,
          font_color: fontColor,
          created_by_email: user.email || null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
