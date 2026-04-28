import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';

/**
 * POST /api/auth/session
 * Creates a tracked session for the authenticated user
 * Called after successful login to track "Remember Me" preference
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { isPersistent, userAgent } = body;
    
    // Get IP address from request headers (server-side)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;

    // Calculate expiry based on "Remember Me" preference
    // Persistent: 1 week, Session-only: 8 hours
    const expiresAt = isPersistent 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 8 * 60 * 60 * 1000);

    // Create tracked session using admin client (service role) to bypass RLS
    const adminSupabase = await createAdminClient();
    const { data: session, error: sessionError } = await adminSupabase
      .from('UserSession')
      .insert({
        user_id: user.id,
        is_persistent: isPersistent,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent || request.headers.get('user-agent') || null,
      })
      .select('id, is_persistent, expires_at')
      .single();

    if (sessionError) {
      console.error('Failed to create tracked session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        isPersistent: session.is_persistent,
        expiresAt: session.expires_at,
      }
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Revokes the current tracked session (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Revoke all active sessions for this user using admin client
    const adminSupabase = await createAdminClient();
    const { error: revokeError } = await adminSupabase
      .from('UserSession')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_revoked', false);

    if (revokeError) {
      console.error('Failed to revoke sessions:', revokeError);
      return NextResponse.json(
        { error: 'Failed to revoke sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Session revocation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
