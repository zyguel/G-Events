import { redirect } from 'next/navigation';
import { getCurrentUserOrganizationMemberships } from '@/lib/auth/sessionRole';

interface OrganizationSelectionPageProps {
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

  if (value === 'invalid-organization') {
    return 'Choose a valid organization to continue in organizer mode.';
  }

  return null;
}

export default async function OrganizationSelectionPage({
  searchParams,
}: OrganizationSelectionPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const errorMessage = getErrorMessage(params.error);

  const context = await getCurrentUserOrganizationMemberships();

  if (!context.isAuthenticated) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (context.memberships.length === 0) {
    redirect(`/auth/session-role?next=${encodeURIComponent(nextPath)}&error=no-organization`);
  }

  if (context.memberships.length === 1) {
    redirect(`/auth/session-role?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
          <p className="text-sm uppercase tracking-[0.22em] text-indigo-300">Organizer Access</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Choose your organization</h1>
          <p className="mt-3 text-sm text-slate-300">
            You belong to more than one organization. Select which one to use for this session.
          </p>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {context.memberships.map((membership) => (
            <form key={membership.organizationId} action="/auth/session-role/choose" method="post">
              <input type="hidden" name="role" value="organizer" />
              <input type="hidden" name="next" value={nextPath} />
              <input type="hidden" name="organizationId" value={membership.organizationId} />
              <button
                type="submit"
                className="group flex w-full items-center justify-between rounded-3xl border border-indigo-700/40 bg-linear-to-r from-indigo-600/20 to-indigo-950/40 px-6 py-5 text-left transition hover:border-indigo-400/70 hover:from-indigo-500/35 hover:to-indigo-900/40"
              >
                <div>
                  <p className="text-base font-semibold text-white">{membership.organizationName}</p>
                  <p className="mt-1 text-sm text-indigo-100/90">
                    {membership.organizationRoleName
                      ? `Role: ${membership.organizationRoleName}`
                      : 'Organization member'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-indigo-200 transition group-hover:text-indigo-100">
                  Continue
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
