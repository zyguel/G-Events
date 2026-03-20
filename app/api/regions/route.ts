import { NextResponse } from 'next/server';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(en);

export async function GET() {
  try {
    const names = countries.getNames('en', { select: 'official' });
    const data = Object.entries(names)
      .map(([code, name]) => ({ code, label: String(name) }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
