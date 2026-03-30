import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_ROLE, SESSION_ROLE_COOKIE_NAME } from '@/lib/constants';

const PUBLIC_ROUTES = new Set(['/login', '/register', '/forgot-password', '/auth/callback']);
const PUBLIC_ROUTE_PREFIXES = ['/auth/session-role'];

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTES.has(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

function isAdminRoute(pathname: string) {
  // Protect admin-only pages
  if (pathname === '/dashboard' || pathname === '/events' || pathname === '/events/new') {
    return true;
  }

  // Protect nested admin sections under /events/[eventId]/...
  // Exclude the client-facing event detail page and attendee registration page
  if (pathname.startsWith('/events/')) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 2) return false; // /events or /events/<slug> — public detail page
    if (parts.length === 3 && parts[2] === 'register') return false; // /events/<slug>/register — attendee route
    return parts.length > 2; // e.g., /events/<slug>/overview — admin only
  }

  if (pathname.startsWith('/management') || pathname.startsWith('/profile') || pathname.startsWith('/settings')) {
    return true;
  }

  return false;
}

/**
 * Routes that require a logged-in user with the ATTENDEE session role.
 * Organizers attempting to access these are redirected to /dashboard.
 */
function isAttendeeRoute(pathname: string) {
  if (pathname === '/home') return true;

  // /events/<slug>/register — attendee-only registration
  if (pathname.startsWith('/events/')) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 3 && parts[2] === 'register') return true;
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip static assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // API routes enforce auth at the route-handler level (requireUser), so avoid
  // duplicate Supabase auth round-trips here.
  const adminRoute = isAdminRoute(pathname);
  const attendeeRoute = isAttendeeRoute(pathname);

  // Neither an admin nor an attendee restricted route — allow through freely
  if ((!adminRoute && !attendeeRoute) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
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
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
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
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
