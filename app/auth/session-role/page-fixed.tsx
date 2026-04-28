"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { SESSION_ROLE } from '@/lib/constants';
import SessionEnforcer from '@/components/auth/SessionEnforcer';

function getSafeNextPath(nextParam: string | string[] | null | undefined) {
  const value = Array.isArray(nextParam) ? nextParam[0] : nextParam;
  if (!value || !value.startsWith('/')) {
    return '/dashboard';
  }
  return value;
}

function getErrorMessage(errorParam: string | string[] | null | undefined) {
  const value = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  if (value === 'no-organization') {
    return 'You are not assigned to any organization yet. Ask an administrator to add you to an organization before switching to organizer mode.';
  }
  if (value === 'session_expired') {
    return 'Your session has expired. Please sign in again.';
  }
  return null;
}

function SessionRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [nextPath, setNextPath] = useState('/dashboard');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const next = searchParams.get('next') || '/dashboard';
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      setUser(user);
      setNextPath(getSafeNextPath(searchParams.get('next')));
      setErrorMessage(getErrorMessage(searchParams.get('error')));
      setIsLoading(false);
    };

    checkAuth();
  }, [router, searchParams]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <SessionEnforcer />
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Choose Access</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">How do you want to continue?</h1>
          <p className="mt-3 text-sm text-slate-300">
            Choose one mode for this session. Event attendees will use the public event portal, while organization members will continue to the admin dashboard.
          </p>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <form action="/auth/session-role/choose" method="post" className="h-full">
            <input type="hidden" name="next" value={nextPath} />
            <input type="hidden" name="role" value={SESSION_ROLE.ATTENDEE} />
            <button
              type="submit"
              className="group h-full w-full rounded-3xl border border-cyan-700/40 bg-linear-to-br from-cyan-600/20 to-cyan-950/40 p-7 text-left transition hover:border-cyan-400/70 hover:from-cyan-500/35 hover:to-cyan-900/40"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-cyan-300">Regular User</span>
              <h2 className="mt-2 text-2xl font-semibold text-white">Attend Events</h2>
              <p className="mt-3 text-sm leading-6 text-cyan-100/90">
                Go to the public home experience to browse events and register as an attendee.
              </p>
              <p className="mt-8 text-sm font-semibold text-cyan-200 transition group-hover:text-cyan-100">Continue as attendee</p>
            </button>
          </form>

          <form action="/auth/session-role/choose" method="post" className="h-full">
            <input type="hidden" name="next" value={nextPath} />
            <input type="hidden" name="role" value={SESSION_ROLE.ORGANIZER} />
            <button
              type="submit"
              className="group h-full w-full rounded-3xl border border-indigo-700/40 bg-linear-to-br from-indigo-600/20 to-indigo-950/40 p-7 text-left transition hover:border-indigo-400/70 hover:from-indigo-500/35 hover:to-indigo-900/40"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-indigo-300">Event Org Member</span>
              <h2 className="mt-2 text-2xl font-semibold text-white">Manage Events</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100/90">
                Continue to the admin workspace to create events, manage attendees, and view analytics.
              </p>
              <p className="mt-8 text-sm font-semibold text-indigo-200 transition group-hover:text-indigo-100">Continue as organizer</p>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function SessionRolePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <SessionRoleContent />
    </Suspense>
  );
}
