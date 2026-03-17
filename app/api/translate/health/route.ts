import { NextResponse } from 'next/server';
import { getTsEngineHealth } from '@/lib/tsTranslateEngine';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: getTsEngineHealth(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: getTsEngineHealth(),
      },
      { status: 500 }
    );
  }
}
