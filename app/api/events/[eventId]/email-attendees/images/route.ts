import { NextRequest, NextResponse } from "next/server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { validateUploadedImageFile } from "@/lib/uploadedImageValidation";

const ALLOWED_EMAIL_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);
const ALLOWED_EMAIL_IMAGE_LABEL = "JPEG, PNG, WebP, GIF, AVIF, SVG";
const MAX_EMAIL_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function getSafeImageExtension(file: File): string {
  const mime = (file.type || "").toLowerCase();
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "jpg";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUser();

    const { eventId } = await params;
    const id = Number.parseInt(eventId, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid eventId" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size <= 0) {
      return NextResponse.json(
        { success: false, error: "Image file is required" },
        { status: 400 }
      );
    }

    const imageValidationError = await validateUploadedImageFile(image, {
      allowedMimeTypes: ALLOWED_EMAIL_IMAGE_MIME_TYPES,
      allowedFormatsLabel: ALLOWED_EMAIL_IMAGE_LABEL,
      maxBytes: MAX_EMAIL_IMAGE_SIZE_BYTES,
    });
    if (imageValidationError) {
      return NextResponse.json(
        { success: false, error: imageValidationError },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: eventData, error: eventError } = await supabase
      .from("Event")
      .select("id")
      .eq("id", id)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { success: false, error: "Event not found or access denied" },
        { status: 404 }
      );
    }

    const ext = getSafeImageExtension(image);
    const filePath = `email-campaigns/${id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const storageClient =
      process.env.SUPABASE_SERVICE_ROLE_KEY ? await createAdminClient() : supabase;

    const { error: uploadError } = await storageClient.storage
      .from("events")
      .upload(filePath, image, {
        cacheControl: "3600",
        upsert: false,
        contentType: image.type || undefined,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = storageClient.storage.from("events").getPublicUrl(filePath);

    return NextResponse.json({ success: true, data: { url: publicUrl } }, { status: 201 });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;

    if (process.env.NODE_ENV === 'development') {
        console.error("Email image upload error:", e);
    }
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unexpected error while uploading image",
      },
      { status: 500 }
    );
  }
}
