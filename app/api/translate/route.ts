import { NextResponse } from 'next/server';
import { normalizeLanguageCode } from '@/lib/i18n';
import { translateBatchWithTsEngine } from '@/lib/tsTranslateEngine';

const MAX_TEXT_ITEMS = 100
const MAX_TEXT_CHARS_TOTAL = 20000

interface TranslateRequestBody {
  texts?: string[];
  source?: string;
  target?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateRequestBody;
    const texts = Array.isArray(body.texts) ? body.texts.filter((value): value is string => typeof value === 'string') : [];
    const target = normalizeLanguageCode(body.target ?? 'en');

    if (texts.length > MAX_TEXT_ITEMS) {
      return NextResponse.json({ success: false, error: 'Too many text items' }, { status: 400 })
    }

    const totalChars = texts.reduce((sum, text) => sum + text.length, 0)
    if (totalChars > MAX_TEXT_CHARS_TOTAL) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 400 })
    }

    if (!texts.length) {
      return NextResponse.json({ success: true, data: {} });
    }

    const translated = await translateBatchWithTsEngine({ texts, target });

    return NextResponse.json({ success: true, data: translated });
  } catch {
    return NextResponse.json({ success: false, error: 'Translation failed' }, { status: 500 });
  }
}
