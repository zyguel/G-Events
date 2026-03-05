import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
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

  const redirectTo = next.startsWith('/') ? next : '/dashboard';
  const url = new URL(redirectTo, requestUrl.origin);
  return NextResponse.redirect(url);
}
