import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';
import { getRequestPublicOrigin } from '@/lib/requestPublicOrigin';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const publicOrigin = getRequestPublicOrigin(request);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const rememberMe = requestUrl.searchParams.get('remember_me') === 'true';

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    // Handle email link flows (recovery, signup, etc.)
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'recovery' | 'email' | 'signup' });
  }

  const redirectTo = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  // Create tracked session for "Remember Me" enforcement
  // Skip for password recovery flows
  if (type !== 'recovery' && redirectTo !== '/reset-password') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // For OAuth, default to persistent session unless remember_me=false
      // For email verification, use the remember_me param
      const isPersistent = rememberMe || true; // Default to persistent for OAuth
      
      const expiresAt = isPersistent 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 8 * 60 * 60 * 1000);

      try {
        // Get IP and user agent from request headers
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;
        const userAgent = request.headers.get('user-agent');
        
        // Use admin client to bypass RLS
        const adminSupabase = await createAdminClient();
        await adminSupabase
          .from('UserSession')
          .insert({
            user_id: user.id,
            is_persistent: isPersistent,
            expires_at: expiresAt.toISOString(),
            ip_address: ipAddress,
            user_agent: userAgent,
          });
      } catch (err) {
        console.error('Failed to create tracked session:', err);
      }
    }
  }

  // Keep password recovery flow intact.
  if (type === 'recovery' || redirectTo === '/reset-password') {
    const recoveryUrl = new URL(redirectTo, publicOrigin);
    return NextResponse.redirect(recoveryUrl);
  }

  const url = new URL('/auth/session-role', publicOrigin);
  url.searchParams.set('next', redirectTo);
  return NextResponse.redirect(url);
}
