import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { processDueCampaigns } from '@/lib/emailCampaigns';

export const dynamic = 'force-dynamic';

type CronAuthorizationResult = {
  ok: boolean;
  status: number;
  error?: string;
};

function authorizeCronRequest(request: NextRequest): CronAuthorizationResult {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return {
        ok: false,
        status: 500,
        error: 'CRON_SECRET is not configured',
      };
    }

    return { ok: true, status: 200 };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized',
    };
  }

  return { ok: true, status: 200 };
}

export async function GET(request: NextRequest) {
  const authorization = authorizeCronRequest(request);
  if (!authorization.ok) {
    return Response.json(
      {
        success: false,
        error: authorization.error || 'Unauthorized',
      },
      { status: authorization.status }
    );
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
    console.error('Cron email-attendees processing failed:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected cron processing error',
      },
      { status: 500 }
    );
  }
}
