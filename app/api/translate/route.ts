import { NextResponse } from 'next/server';
import { normalizeLanguageCode } from '@/lib/i18n';
import { translateBatchWithTsEngine } from '@/lib/tsTranslateEngine';

interface TranslateRequestBody {
  texts?: string[];
  source?: string;
  target?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateRequestBody;
    const texts = Array.isArray(body.texts) ? body.texts : [];
    const target = normalizeLanguageCode(body.target ?? 'en');

    if (!texts.length) {
      return NextResponse.json({ success: true, data: {} });
    }

    const translated = await translateBatchWithTsEngine({ texts, target });

    return NextResponse.json({ success: true, data: translated });
  } catch {
    return NextResponse.json({ success: false, error: 'Translation failed' }, { status: 500 });
  }
}
