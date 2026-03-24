import { createClient } from './supabase-server';
import { NextResponse } from 'next/server';

/**
 * Ensure the request is authenticated via Supabase session.
 * Throws a NextResponse 401 if not authenticated.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return user;
}

/**
 * Convert thrown auth responses into route return values.
 * `requireUser()` throws a NextResponse on auth failure.
 */
export function getAuthErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof NextResponse) {
    return error;
  }

  if (error instanceof Response) {
    const message = error.statusText || 'Unauthorized';
    return NextResponse.json({ error: message }, { status: error.status || 401 });
  }

  return null;
}
