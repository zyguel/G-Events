"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

/**
 * SessionEnforcer - Enforces "Remember Me" behavior for session-only logins
 * 
 * When a user logs in with "Remember Me" unchecked:
 * 1. We store 'sessionOnly=true' in sessionStorage (cleared when browser closes)
 * 2. We store 'sessionOnlySet=true' in localStorage (persists across sessions)
 * 
 * On app load, if sessionOnlySet exists in localStorage but sessionOnly doesn't exist
 * in sessionStorage, it means the browser was closed and reopened. In this case,
 * we sign the user out to enforce the session-only policy.
 */
export default function SessionEnforcer() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const enforceSessionPolicy = async () => {
      try {
        // Check if this was a session-only login
        const sessionOnly = sessionStorage.getItem('sessionOnly');
        const sessionOnlySet = localStorage.getItem('sessionOnlySet');

        if (sessionOnlySet === 'true' && !sessionOnly) {
          // This means:
          // 1. User logged in with "Remember Me" unchecked (sessionOnlySet exists in localStorage)
          // 2. Browser was closed (sessionStorage was cleared, so sessionOnly is gone)
          // 3. Browser was reopened and session was restored from cookie
          // We need to sign out to enforce session-only behavior
          
          const supabase = createClient();
          await supabase.auth.signOut();
          
          // Clean up the flag
          localStorage.removeItem('sessionOnlySet');
          
          // Redirect to login
          router.replace('/login?error=session_expired');
          return;
        }

        // If sessionOnly exists in sessionStorage, make sure sessionOnlySet is in localStorage
        // This handles the case where the user is actively using the app
        if (sessionOnly === 'true' && !sessionOnlySet) {
          localStorage.setItem('sessionOnlySet', 'true');
        }

        // If no session-only flag, clean up any stale sessionOnlySet
        if (!sessionOnly && sessionOnlySet) {
          localStorage.removeItem('sessionOnlySet');
        }
      } catch (error) {
        console.error('Session enforcement error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    enforceSessionPolicy();
  }, [router]);

  // This component doesn't render anything visible
  return null;
}
