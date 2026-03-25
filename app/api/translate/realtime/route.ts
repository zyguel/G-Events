import { NextResponse } from 'next/server';
import { normalizeLanguageCode } from '@/lib/i18n';
import { translateBatchWithTsEngine } from '@/lib/tsTranslateEngine';
import { flattenPayloadStrings } from '@/lib/translatePayload';

const MAX_REALTIME_STRINGS = 300
const MAX_REALTIME_CHARS_TOTAL = 40000

interface RealtimeTranslateBody {
  payload?: unknown;
  source?: string;
  target?: string;
  skipKeys?: string[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RealtimeTranslateBody;
    const target = normalizeLanguageCode(body.target ?? 'en');
    const payload = body.payload;
    const skipKeys = Array.isArray(body.skipKeys)
      ? body.skipKeys.filter((key): key is string => typeof key === 'string')
      : [];

    const { strings, rebuild } = flattenPayloadStrings(payload, skipKeys);

    if (strings.length > MAX_REALTIME_STRINGS) {
      return NextResponse.json({ success: false, error: 'Payload contains too many translatable fields' }, { status: 400 })
    }

    const totalChars = strings.reduce((sum, text) => sum + text.length, 0)
    if (totalChars > MAX_REALTIME_CHARS_TOTAL) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 400 })
    }

    if (!strings.length || target === 'en') {
      return NextResponse.json({ success: true, data: payload });
    }

    const translatedMap = await translateBatchWithTsEngine({
      texts: strings,
      target,
    });

    return NextResponse.json({ success: true, data: rebuild(translatedMap) });
  } catch {
    return NextResponse.json({ success: false, error: 'Realtime translation failed' }, { status: 500 });
  }
}
