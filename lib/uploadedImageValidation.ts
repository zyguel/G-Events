const SVG_MAX_SCAN_BYTES = 512 * 1024;

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

type ImageValidationOptions = {
  allowedMimeTypes: Set<string>;
  allowedFormatsLabel: string;
  maxBytes: number;
};

function startsWithBytes(source: Uint8Array, signature: readonly number[]): boolean {
  if (source.length < signature.length) return false;
  return signature.every((value, idx) => source[idx] === value);
}

function includesBytes(source: Uint8Array, sequence: readonly number[]): boolean {
  if (sequence.length === 0 || source.length < sequence.length) return false;
  for (let i = 0; i <= source.length - sequence.length; i += 1) {
    let matches = true;
    for (let j = 0; j < sequence.length; j += 1) {
      if (source[i + j] !== sequence[j]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

function hasPngStructure(bytes: Uint8Array): boolean {
  if (!startsWithBytes(bytes, PNG_SIGNATURE)) return false;
  return includesBytes(bytes, [0x49, 0x45, 0x4e, 0x44]); // IEND
}

function hasJpegStructure(bytes: Uint8Array): boolean {
  if (!startsWithBytes(bytes, JPEG_SIGNATURE)) return false;
  const lastIndex = bytes.length - 1;
  return bytes.length > 4 && bytes[lastIndex - 1] === 0xff && bytes[lastIndex] === 0xd9;
}

function hasGifStructure(bytes: Uint8Array): boolean {
  const gif87a = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] as const;
  const gif89a = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] as const;
  if (!startsWithBytes(bytes, gif87a) && !startsWithBytes(bytes, gif89a)) return false;
  return bytes.length > 10 && bytes[bytes.length - 1] === 0x3b;
}

function hasWebpStructure(bytes: Uint8Array): boolean {
  if (bytes.length < 16) return false;
  const riff = startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]); // RIFF
  const webp = startsWithBytes(bytes.slice(8), [0x57, 0x45, 0x42, 0x50]); // WEBP
  if (!riff || !webp) return false;

  const declaredSize =
    bytes[4]
    | (bytes[5] << 8)
    | (bytes[6] << 16)
    | (bytes[7] << 24);

  // RIFF size excludes the first 8 bytes.
  return declaredSize > 8 && declaredSize <= bytes.length + 1024;
}

function hasAvifStructure(bytes: Uint8Array): boolean {
  if (bytes.length < 16) return false;
  if (!startsWithBytes(bytes.slice(4), [0x66, 0x74, 0x79, 0x70])) return false; // ftyp

  const majorBrand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (majorBrand === 'avif' || majorBrand === 'avis') return true;

  for (let i = 16; i + 3 < Math.min(bytes.length, 64); i += 4) {
    const compatibleBrand = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
    if (compatibleBrand === 'avif' || compatibleBrand === 'avis') {
      return true;
    }
  }

  return false;
}

function hasSvgStructure(bytes: Uint8Array): boolean {
  const slice = bytes.slice(0, Math.min(bytes.length, SVG_MAX_SCAN_BYTES));
  const text = new TextDecoder('utf-8', { fatal: false }).decode(slice).trim().toLowerCase();
  if (!text) return false;
  const hasSvgTag = text.includes('<svg');
  const hasScriptTag = text.includes('<script');
  return hasSvgTag && !hasScriptTag;
}

function hasExpectedImageStructure(bytes: Uint8Array, mimeType: string): boolean {
  const normalizedMime = mimeType.toLowerCase();

  if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') {
    return hasJpegStructure(bytes);
  }

  if (normalizedMime === 'image/png') {
    return hasPngStructure(bytes);
  }

  if (normalizedMime === 'image/webp') {
    return hasWebpStructure(bytes);
  }

  if (normalizedMime === 'image/gif') {
    return hasGifStructure(bytes);
  }

  if (normalizedMime === 'image/avif') {
    return hasAvifStructure(bytes);
  }

  if (normalizedMime === 'image/svg+xml') {
    return hasSvgStructure(bytes);
  }

  return false;
}

export async function validateUploadedImageFile(
  file: File,
  options: ImageValidationOptions,
): Promise<string | null> {
  if (!(file instanceof File)) {
    return 'Image file is required.';
  }

  if (!file.type.startsWith('image/') || !options.allowedMimeTypes.has(file.type)) {
    return `Unsupported image format. Allowed formats: ${options.allowedFormatsLabel}.`;
  }

  if (file.size <= 0) {
    return 'Image file is empty.';
  }

  if (file.size > options.maxBytes) {
    return `Image file is too large. Maximum allowed size is ${Math.round(options.maxBytes / (1024 * 1024))}MB.`;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasExpectedImageStructure(bytes, file.type)) {
    return 'Image file appears to be invalid or corrupted.';
  }

  return null;
}