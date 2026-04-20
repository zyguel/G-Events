import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getRequestPublicOrigin } from '@/lib/requestPublicOrigin';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const publicOrigin = getRequestPublicOrigin(request);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    // Handle email link flows (recovery, signup, etc.)
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'recovery' | 'email' | 'signup' });
  }

  const redirectTo = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  // Keep password recovery flow intact.
  if (type === 'recovery' || redirectTo === '/reset-password') {
    const recoveryUrl = new URL(redirectTo, publicOrigin);
    return NextResponse.redirect(recoveryUrl);
  }

  const url = new URL('/auth/session-role', publicOrigin);
  url.searchParams.set('next', redirectTo);
  return NextResponse.redirect(url);
}
