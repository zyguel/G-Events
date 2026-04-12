/**
 * Breakout session `description` stores JSON metadata (shared with admin breakouts API).
 */

export type BreakoutMeta = {
  date?: string;
  time?: string;
  type?: string;
  status?: string;
  joinLink?: string;
};

export function parseBreakoutDescription(raw: unknown): BreakoutMeta {
  if (!raw) return {};
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === 'object' ? (parsed as BreakoutMeta) : {};
  } catch {
    return {};
  }
}

/** Client-facing breakouts are physical sessions only. */
export function isInPersonBreakoutDescription(description: unknown): boolean {
  const meta = parseBreakoutDescription(description);
  return meta.type === 'In-Person';
}
