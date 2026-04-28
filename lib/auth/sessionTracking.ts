import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export interface SessionInfo {
  id: number;
  userId: string;
  isPersistent: boolean;
  expiresAt: Date;
  lastActivityAt: Date;
}

/**
 * Create a new tracked session for the user
 */
export async function createTrackedSession(
  userId: string, 
  isPersistent: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<SessionInfo> {
  const supabase = await createClient();
  
  // Calculate expiry: 1 week for persistent, 8 hours for session-only
  const expiresAt = isPersistent 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 1 week
    : new Date(Date.now() + 8 * 60 * 60 * 1000);    // 8 hours (or until browser close)

  const { data, error } = await supabase
    .from('UserSession')
    .insert({
      user_id: userId,
      is_persistent: isPersistent,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    })
    .select('id, user_id, is_persistent, expires_at, last_activity_at')
    .single();

  if (error) {
    console.error('Failed to create tracked session:', error);
    throw new Error('Failed to create session');
  }

  return {
    id: data.id,
    userId: data.user_id,
    isPersistent: data.is_persistent,
    expiresAt: new Date(data.expires_at),
    lastActivityAt: new Date(data.last_activity_at),
  };
}

/**
 * Validate if the current session is still active
 * Returns null if session is invalid/expired
 */
export async function validateCurrentSession(): Promise<SessionInfo | null> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  // Get the most recent valid session for this user
  const { data: sessions, error } = await supabase
    .from('UserSession')
    .select('id, user_id, is_persistent, expires_at, last_activity_at')
    .eq('user_id', user.id)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !sessions || sessions.length === 0) {
    return null;
  }

  const session = sessions[0];

  // Update last activity
  await supabase
    .from('UserSession')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', session.id);

  return {
    id: session.id,
    userId: session.user_id,
    isPersistent: session.is_persistent,
    expiresAt: new Date(session.expires_at),
    lastActivityAt: new Date(session.last_activity_at),
  };
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: number): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('UserSession')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to revoke session:', error);
    throw new Error('Failed to revoke session');
  }
}

/**
 * Revoke all sessions for a user (e.g., on password change)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('UserSession')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_revoked', false);

  if (error) {
    console.error('Failed to revoke user sessions:', error);
    throw new Error('Failed to revoke sessions');
  }
}

/**
 * Check if user has any valid persistent sessions
 */
export async function hasValidPersistentSession(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('UserSession')
    .select('id')
    .eq('user_id', userId)
    .eq('is_persistent', true)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .limit(1);

  if (error || !data) {
    return false;
  }

  return data.length > 0;
}
