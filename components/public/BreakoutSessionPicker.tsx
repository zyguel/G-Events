'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Presentation, CheckCircle2, AlertCircle } from 'lucide-react';

type PublicSession = {
  id: number;
  title: string;
  location: string;
  date: string;
  time: string;
  maxCapacity: number;
  spotsLeft: number | null;
  isFull: boolean;
};

type MeResponse = {
  success: boolean;
  signedIn?: boolean;
  eligible?: boolean;
  registeredForEvent?: boolean;
  profileComplete?: boolean;
  sessions?: PublicSession[];
  selectedSessionId?: number | null;
  reason?: string;
  error?: string;
};

export function BreakoutSessionPicker({
  eventId,
  eventSlug,
}: {
  eventId: number;
  eventSlug: string;
}) {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState<number | 'none' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loginNext = `/login?next=${encodeURIComponent(`/events/${eventSlug}`)}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/breakouts/attendee`, { credentials: 'include' });
      const json = (await res.json()) as MeResponse;
      setData(json);
      if (json.success && json.signedIn && json.profileComplete && json.eligible) {
        setChoice(json.selectedSessionId ?? 'none');
      } else {
        setChoice(null);
      }
    } catch {
      setError('Could not load breakout sessions');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (choice === null) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const breakoutSessionId = choice === 'none' ? null : choice;
      const res = await fetch(`/api/events/${eventId}/breakouts/attendee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ breakoutSessionId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Could not save your choice');
        return;
      }
      setSuccessMsg(json.message || 'Saved.');
      await load();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center justify-center gap-3 min-h-[120px]">
        <Loader2 className="animate-spin text-indigo-500" size={24} />
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading breakout options…</span>
      </section>
    );
  }

  if (!data.success) {
    return null;
  }

  if (data.signedIn === false) {
    return (
      <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Presentation className="text-indigo-500 shrink-0" size={22} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Breakout sessions</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Sign in to choose an optional in-person breakout (or stay on the main program only).
        </p>
        <Link
          href={loginNext}
          className="inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
        >
          Sign in
        </Link>
      </section>
    );
  }

  if (data.reason === 'no_in_person_sessions') {
    return (
      <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Presentation className="text-indigo-500 shrink-0" size={22} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Breakout sessions</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          There are no in-person breakout sessions open for selection yet. Check back later, or attend the main program only.
        </p>
      </section>
    );
  }

  if (data.reason === 'breakouts_disabled' || !data.eligible) {
    if (data.reason === 'not_registered' || data.reason === 'complete_profile' || data.reason === 'pending_approval') {
      return (
        <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Presentation className="text-indigo-500 shrink-0" size={22} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Breakout sessions</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {data.reason === 'pending_approval'
              ? 'Your registration is currently pending organizer review. Breakout selection becomes available after approval.'
              : data.reason === 'complete_profile'
              ? 'Finish your registration (including group member details if applicable) before choosing a breakout.'
              : 'Register for this event first, then you can pick one optional in-person breakout or stay on the main session only.'}
          </p>
          {data.reason === 'not_registered' && (
            <Link
              href={`/events/${eventSlug}/register`}
              className="inline-flex mt-4 min-h-[44px] items-center justify-center px-6 py-2.5 rounded-xl bg-[#3D518C] text-white text-sm font-bold"
            >
              Register
            </Link>
          )}
        </section>
      );
    }
    return null;
  }

  const sessions = data.sessions || [];

  return (
    <section className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <Presentation className="text-indigo-500 shrink-0" size={22} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Breakout sessions</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        In-person breakouts only. Pick <strong>one</strong> session, or choose main program only. You can change your mind until the organizer locks sessions.
      </p>

      {error && (
        <div className="mb-4 flex gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 size={18} className="shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <label
          className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-all ${
            choice === 'none'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
              : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
          }`}
        >
          <input
            type="radio"
            name="breakout"
            className="mt-1"
            checked={choice === 'none'}
            onChange={() => setChoice('none')}
          />
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Main session only</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No breakout — you will not receive a breakout QR.</p>
          </div>
        </label>

        {sessions.map((s) => (
          <label
            key={s.id}
            className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-all ${
              choice === s.id
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
            } ${s.isFull && choice !== s.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="breakout"
              className="mt-1"
              disabled={s.isFull && choice !== s.id}
              checked={choice === s.id}
              onChange={() => setChoice(s.id)}
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="font-bold text-gray-900 dark:text-white">{s.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {[s.date, s.time].filter(Boolean).join(' · ')}
                {s.location ? ` · ${s.location}` : ''}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide mt-2 text-indigo-600 dark:text-indigo-400">
                {s.isFull
                  ? 'Full'
                  : s.spotsLeft === null
                    ? 'Open'
                    : `${s.spotsLeft} spot${s.spotsLeft === 1 ? '' : 's'} left`}
              </p>
            </div>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={saving || choice === null}
        onClick={handleSave}
        className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving…' : 'Save choice'}
      </button>
    </section>
  );
}
