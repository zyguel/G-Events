import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EVENTS_ROOT } from '@/lib/appRoutes';
import { SESSION_ROLE, SESSION_ROLE_COOKIE_NAME } from '@/lib/constants';
import { legacyAdminEventsRedirectTarget } from '@/lib/legacyAdminEventsRedirect';
import { createClient } from '@/lib/supabase-server';

const PUBLIC_ROUTES = new Set(['/login', '/register', '/forgot-password', '/auth/callback']);
const PUBLIC_ROUTE_PREFIXES = ['/auth/session-role'];
const AUTH_VALIDATED_AT_COOKIE_NAME = 'g_events_auth_validated_at';
const AUTH_VALIDATION_TTL_SECONDS = 300;
const LEGACY_ADMIN_ROUTE_REDIRECTS: Record<string, string> = {
  '/admin/dashboard': '/dashboard',
  '/admin/management': '/management',
  '/admin/profile': '/profile',
  '/admin/settings': '/settings',
  '/admin/analytics': '/analytics/all',
  '/admin/analytics/all': '/analytics/all',
};

function legacyAdminRouteRedirectTarget(pathname: string): string | null {
  const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return LEGACY_ADMIN_ROUTE_REDIRECTS[normalized] ?? null;
}

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTES.has(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => {
    if (!name.startsWith('sb-')) {
      return false;
    }

    return name.includes('auth-token') || name.includes('access-token');
  });
}

function hasFreshAuthValidation(request: NextRequest): boolean {
  const raw = request.cookies.get(AUTH_VALIDATED_AT_COOKIE_NAME)?.value;
  const parsed = Number(raw ?? '');
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return false;
  }

  return Date.now() - parsed <= AUTH_VALIDATION_TTL_SECONDS * 1000;
}

function isAdminRoute(pathname: string) {
  if (pathname === '/dashboard') return true;
  if (pathname === ADMIN_EVENTS_ROOT || pathname.startsWith(`${ADMIN_EVENTS_ROOT}/`)) {
    return true;
  }

  if (pathname.startsWith('/management') || pathname.startsWith('/profile') || pathname.startsWith('/settings')) {
    return true;
  }

  return false;
}

function clearAuthCookies(request: NextRequest, response: NextResponse) {
  response.cookies.delete(AUTH_VALIDATED_AT_COOKIE_NAME);
  response.cookies.delete(SESSION_ROLE_COOKIE_NAME);

  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-')) {
      response.cookies.delete(name);
    }
  });
}

/**
 * Routes that require a logged-in user with the ATTENDEE session role.
 * Organizers attempting to access these are redirected to /dashboard.
 */
function isAttendeeRoute(pathname: string) {
  if (pathname === '/home' || pathname.startsWith('/home/') || pathname === '/tickets') return true;

  if (pathname.startsWith('/events/')) {
    const parts = pathname.split('/').filter(Boolean);
    const third = parts[2];
    if (parts.length === 3 && third && ['register', 'review', 'my-breakouts', 'breakout-sessions'].includes(third)) {
      return true;
    }
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const pathParts = pathname.split('/').filter(Boolean);
  const isWaitlistInviteRegistrationRoute =
    pathParts.length === 3 &&
    pathParts[0] === 'events' &&
    pathParts[2] === 'register' &&
    !!request.nextUrl.searchParams.get('waitlistInvite')?.trim();

  if (isWaitlistInviteRegistrationRoute) {
    return NextResponse.next();
  }

  // Skip static assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  const legacyTarget = legacyAdminEventsRedirectTarget(pathname, search);
  if (legacyTarget) {
    const url = request.nextUrl.clone();
    const q = legacyTarget.indexOf('?');
    if (q >= 0) {
      url.pathname = legacyTarget.slice(0, q);
      url.search = legacyTarget.slice(q);
    } else {
      url.pathname = legacyTarget;
      url.search = '';
    }
    return NextResponse.redirect(url, 308);
  }

  const legacyAdminTarget = legacyAdminRouteRedirectTarget(pathname);
  if (legacyAdminTarget) {
    const url = request.nextUrl.clone();
    url.pathname = legacyAdminTarget;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  // API routes enforce auth at the route-handler level (requireUser), so avoid
  // duplicate Supabase auth round-trips here.
  const adminRoute = isAdminRoute(pathname);
  const attendeeRoute = isAttendeeRoute(pathname);

  // Neither an admin nor an attendee restricted route — allow through freely
  if ((!adminRoute && !attendeeRoute) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Fast fail when there is clearly no auth session cookie.
  if (!hasSupabaseSessionCookie(request)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next({ request });
  if (!hasFreshAuthValidation(request)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (pathname.startsWith('/api/')) {
        const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        clearAuthCookies(request, unauthorizedResponse);
        return unauthorizedResponse;
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname + search);
      const redirectResponse = NextResponse.redirect(loginUrl);
      clearAuthCookies(request, redirectResponse);
      return redirectResponse;
    }

    response.cookies.set(AUTH_VALIDATED_AT_COOKIE_NAME, String(Date.now()), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: AUTH_VALIDATION_TTL_SECONDS,
    });

    // ── Session Tracking Validation for "Remember Me" ───────────────────────
    // Check if user has a valid tracked session in our database
    const { data: trackedSessions, error: sessionError } = await supabase
      .from('UserSession')
      .select('id, is_persistent, expires_at')
      .eq('user_id', user.id)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('Session tracking validation error:', sessionError);
    }

    // No valid tracked session found - this means the session is invalid
    // Either expired or "Remember Me" was unchecked and browser was closed
    if (!trackedSessions || trackedSessions.length === 0) {
      console.log(`No valid tracked session for user ${user.id}, signing out`);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear cookies
      clearAuthCookies(request, response);
      
      // Redirect to login
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  const sessionRole = request.cookies.get(SESSION_ROLE_COOKIE_NAME)?.value;

  // ── Attendee-only routes ──────────────────────────────────────────────────
  if (attendeeRoute) {
    // Organizers are not allowed — send them to the admin dashboard
    if (sessionRole === SESSION_ROLE.ORGANIZER) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      dashboardUrl.search = '';
      return NextResponse.redirect(dashboardUrl);
    }

    // No role selected yet → pick a role first
    if (!sessionRole) {
      const selectRoleUrl = request.nextUrl.clone();
      selectRoleUrl.pathname = '/auth/session-role';
      selectRoleUrl.searchParams.set('next', pathname + search);
      return NextResponse.redirect(selectRoleUrl);
    }

    // ATTENDEE role confirmed — allow through
    return response;
  }

  // ── Admin-only routes ─────────────────────────────────────────────────────
  // Attendees trying to access admin pages → send to /home
  if (sessionRole === SESSION_ROLE.ATTENDEE) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/home';
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  if (sessionRole !== SESSION_ROLE.ORGANIZER) {
    const selectRoleUrl = request.nextUrl.clone();
    selectRoleUrl.pathname = '/auth/session-role';
    selectRoleUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(selectRoleUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
