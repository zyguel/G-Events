import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminSupabaseForEventOr404 } from "@/lib/apiEventAccess";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { validateCertificateBackgroundDataUrl } from "@/lib/certificateImageValidation";

function decodeCertificateDataUrl(dataUrl: string): { bytes: Buffer; extension: string; contentType: string } {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/i);
  if (!match) {
    throw new Error("Certificate background must be a PNG or JPEG data URL");
  }

  const rawType = match[1].toLowerCase();
  const contentType = rawType === "image/jpg" ? "image/jpeg" : rawType;
  const extension = contentType === "image/png" ? "png" : "jpg";
  const bytes = Buffer.from(match[2], "base64");

  if (bytes.byteLength === 0) {
    throw new Error("Certificate background image data is empty");
  }

  return { bytes, extension, contentType };
}

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

    try {
      validateCertificateBackgroundDataUrl(backgroundImage);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : "Invalid background image" },
        { status: 400 }
      );
    }

    const access = await getAdminSupabaseForEventOr404(id);
    if (!access.ok) return access.response;

    const { bytes, extension, contentType } = decodeCertificateDataUrl(backgroundImage);
    const objectPath = `certificates/${id}/template-${Date.now()}-${randomUUID()}.${extension}`;
    const { error: uploadError } = await access.supabase.storage
      .from("events")
      .upload(objectPath, bytes, {
        cacheControl: "3600",
        contentType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: `Failed to store certificate background: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = access.supabase.storage.from("events").getPublicUrl(objectPath);

    const { data, error } = await access.supabase
      .from("CertificateTemplate")
      .insert([
        {
          event_id: id,
          name,
          background_image: publicUrl,
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
