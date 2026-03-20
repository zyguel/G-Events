import { NextResponse } from 'next/server';
import { getTsSupportedLanguages } from '@/lib/tsTranslateEngine';

export async function GET() {
  return NextResponse.json({ success: true, data: getTsSupportedLanguages() });
}
