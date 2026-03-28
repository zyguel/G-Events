import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { SESSION_ROLE } from '@/lib/constants';

interface SessionRolePageProps {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
}

function getSafeNextPath(nextParam: string | string[] | undefined) {
  const value = Array.isArray(nextParam) ? nextParam[0] : nextParam;
  if (!value || !value.startsWith('/')) {
    return '/dashboard';
  }

  return value;
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  const value = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  if (value === 'no-organization') {
    return 'You are not assigned to any organization yet. Ask an administrator to add you to an organization before switching to organizer mode.';
  }

  return null;
}

export default async function SessionRolePage({ searchParams }: SessionRolePageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const errorMessage = getErrorMessage(params.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
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
