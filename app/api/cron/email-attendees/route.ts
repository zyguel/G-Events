import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { processDueCampaigns } from '@/lib/emailCampaigns';
import { safeCompareSecrets } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  const providedSecret = request.headers.get("x-cron-secret")

  if (!safeCompareSecrets(expectedSecret, providedSecret)) {
    return Response.json({ success: false, error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const result = await processDueCampaigns(supabase, { limit: 50 });

    return Response.json({
      success: true,
      message: 'Scheduled attendee campaigns processed',
      invokedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
        console.error('Cron email-attendees processing failed:', error);
    }
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected cron processing error',
      },
      { status: 500 }
    );
  }
}
