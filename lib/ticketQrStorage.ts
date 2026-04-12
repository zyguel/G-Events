import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const DEFAULT_QR_BUCKET = "QR";

function getCandidateBuckets(): string[] {
  const configured = process.env.TICKET_QR_BUCKET?.trim();
  const candidates = [configured, DEFAULT_QR_BUCKET, "qr"].filter(
    (value): value is string => !!value
  );
  return Array.from(new Set(candidates));
}

function isBucketNotFoundError(message: string): boolean {
  return message.toLowerCase().includes("bucket not found");
}

function buildQrStoragePath(ticketUrl: string, folder: string): string {
  const hash = createHash("sha256").update(ticketUrl).digest("hex").slice(0, 40);
  return `${folder}/${hash}.png`;
}

/**
 * Generates a scan-friendly QR PNG and stores it in the public QR bucket.
 * Uses a deterministic hash path so repeated sends for the same ticket reuse the same file.
 */
export async function buildAndStoreTicketQrImage(params: {
  supabase: SupabaseClient;
  ticketUrl: string;
  folder?: string;
}): Promise<string> {
  const folder = (params.folder || "event-tickets").replace(/^\/+|\/+$/g, "") || "event-tickets";
  const objectPath = buildQrStoragePath(params.ticketUrl, folder);

  const png = await QRCode.toBuffer(params.ticketUrl, {
    type: "png",
    // 340 keeps edges crisp for most mobile scanners while staying relatively small.
    width: 340,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const buckets = getCandidateBuckets();
  let activeBucket: string | null = null;
  let lastErrorMessage = "";

  for (const bucket of buckets) {
    const { error: uploadError } = await params.supabase.storage
      .from(bucket)
      .upload(objectPath, new Uint8Array(png), {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: true,
      });

    if (!uploadError) {
      activeBucket = bucket;
      break;
    }

    lastErrorMessage = uploadError.message;
    if (!isBucketNotFoundError(uploadError.message)) {
      throw new Error(`Failed to upload QR image to ${bucket} bucket: ${uploadError.message}`);
    }
  }

  if (!activeBucket) {
    throw new Error(
      `Failed to upload QR image. Checked buckets: ${buckets.join(", ")}. Last error: ${lastErrorMessage || "Unknown error"}`
    );
  }

  const {
    data: { publicUrl },
  } = params.supabase.storage.from(activeBucket).getPublicUrl(objectPath);

  if (!publicUrl) {
    throw new Error(`Failed to resolve public URL for ${activeBucket}/${objectPath}`);
  }

  return publicUrl;
}
