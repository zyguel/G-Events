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
