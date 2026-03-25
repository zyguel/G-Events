import { timingSafeEqual } from 'crypto'

export function safeCompareSecrets(expected: string | undefined, provided: string | null): boolean {
  if (!expected || !provided) return false

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}

function normalizeOrigin(origin: string): string {
  const parsed = new URL(origin)

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Unsupported app origin protocol')
  }

  return parsed.origin
}

export function resolveTrustedAppOrigin(requestOrigin: string): string {
  const configuredOrigin = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL

  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin)
  }

  if (process.env.NODE_ENV === 'development') {
    return normalizeOrigin(requestOrigin)
  }

  throw new Error('APP_URL is required in production for secure absolute links')
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function htmlToPlainText(value: string, maxLength = 150): string {
  const stripped = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (stripped.length <= maxLength) {
    return stripped
  }

  return `${stripped.slice(0, maxLength)}...`
}
