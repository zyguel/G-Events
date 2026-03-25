import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = new Set(['/login', '/register', '/forgot-password', '/auth/callback']);

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname);
}

function isAdminRoute(pathname: string) {
  // Protect admin-only pages
  if (pathname === '/dashboard' || pathname === '/events' || pathname === '/events/new') {
    return true;
  }

  // Protect nested admin sections under /events/[eventId]/...
  if (pathname.startsWith('/events/')) {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length > 2; // e.g., /events/<slug>/overview
  }

  if (pathname.startsWith('/management') || pathname.startsWith('/profile') || pathname.startsWith('/settings')) {
    return true;
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
  const needsAuth = isAdminRoute(pathname);
  if (!needsAuth || isPublicRoute(pathname)) {
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
