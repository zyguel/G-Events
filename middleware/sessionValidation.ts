import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Middleware to validate user sessions server-side
 * This enforces the "Remember Me" policy at the server level
 */
export async function validateSessionMiddleware(request: NextRequest) {
  // Skip validation for public routes
  const publicRoutes = [
    '/login',
    '/register', 
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/api/auth',
    '/_next',
    '/favicon',
    '/icons',
    '/images',
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    const supabase = await createClient();
    
    // Get current user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // No authenticated user, allow request to continue
      // (protected routes should have their own checks)
      return NextResponse.next();
    }

    // Check for valid tracked session
    const { data: sessions, error: sessionError } = await supabase
      .from('UserSession')
      .select('id, is_persistent, expires_at')
      .eq('user_id', user.id)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('Session validation error:', sessionError);
      return NextResponse.next();
    }

    // No valid tracked session found - sign out the user
    if (!sessions || sessions.length === 0) {
      console.log(`No valid tracked session for user ${user.id}, signing out`);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }

    const session = sessions[0];

    // For non-persistent sessions, check if we should enforce browser session only
    // This is handled client-side via SessionEnforcer, but we can add additional checks here
    
    // Update last activity (fire and forget)
    supabase
      .from('UserSession')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id)
      .then(() => {});

    // Add session info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('X-Session-Id', session.id.toString());
    response.headers.set('X-Session-Persistent', session.is_persistent.toString());
    
    return response;
    
  } catch (error) {
    console.error('Session middleware error:', error);
    return NextResponse.next();
  }
}
