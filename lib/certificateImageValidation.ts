/**
 * Certificate templates only accept a single PNG or JPEG raster (no PDF, no executables).
 */

const MAX_BYTES = 12 * 1024 * 1024;

function isPngMagic(buf: Uint8Array): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

function isJpegMagic(buf: Uint8Array): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

export function validateCertificateImageBytes(buf: Uint8Array): "png" | "jpeg" {
  if (buf.byteLength > MAX_BYTES) {
    throw new Error("Image is too large (max 12 MB)");
  }
  if (isPngMagic(buf)) return "png";
  if (isJpegMagic(buf)) return "jpeg";
  throw new Error("Only PNG or JPEG images are allowed for certificate backgrounds");
}

export function validateCertificateBackgroundDataUrl(dataUrl: string): void {
  const trimmed = dataUrl.trim();
  if (!trimmed.startsWith("data:")) {
    throw new Error("Invalid certificate background image");
  }
  const comma = trimmed.indexOf(",");
  if (comma === -1) {
    throw new Error("Invalid certificate background image");
  }
  const header = trimmed.slice(0, comma).toLowerCase();
  if (!header.includes("base64")) {
    throw new Error("Certificate background must be base64-encoded PNG or JPEG");
  }
  if (!header.includes("image/png") && !header.includes("image/jpeg") && !header.includes("image/jpg")) {
    throw new Error("Certificate background must be PNG or JPEG (PDF and other types are not allowed)");
  }

  const b64 = trimmed.slice(comma + 1).replace(/\s/g, "");
  let binary: Uint8Array;
  try {
    const bin = atob(b64);
    binary = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) binary[i] = bin.charCodeAt(i) & 0xff;
  } catch {
    throw new Error("Invalid certificate background image data");
  }

  validateCertificateImageBytes(binary);
}
