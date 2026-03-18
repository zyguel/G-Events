import { NextResponse } from 'next/server';
import { normalizeLanguageCode } from '@/lib/i18n';
import { translateBatchWithTsEngine } from '@/lib/tsTranslateEngine';
import { flattenPayloadStrings } from '@/lib/translatePayload';

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
