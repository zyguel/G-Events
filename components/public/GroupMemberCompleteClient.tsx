'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import type { OrderFormData } from '@/lib/types';
import { PublicOrderForm, type PublicFormAnswers } from '@/components/public/PublicOrderForm';

type LoadState = 'idle' | 'loading' | 'ready' | 'error' | 'done';

export function GroupMemberCompleteClient({
  token,
  eventId,
  eventSlug,
  loginNextPath,
}: {
  token: string;
  eventId: number;
  eventSlug: string;
  loginNextPath: string;
}) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderFormData | null>(null);
  const [orderFormId, setOrderFormId] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState('');

  const [answers, setAnswers] = useState<PublicFormAnswers>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasPendingUploads, setHasPendingUploads] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState('loading');
      setLoadError(null);
      try {
        const res = await fetch(
          `/api/registration/group-invite?token=${encodeURIComponent(token)}&eventId=${eventId}`,
          { credentials: 'include' }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 401) {
          setLoadState('error');
          setLoadError('sign_in_required');
          return;
        }
        if (!res.ok) {
          setLoadState('error');
          setLoadError(data?.error || 'Could not load invitation');
          return;
        }
        setFormData(data.formData);
        setOrderFormId(data.orderFormId);
        setEventTitle(data.eventTitle || '');
        setLoadState('ready');
      } catch {
        if (!cancelled) {
          setLoadState('error');
          setLoadError('Network error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, eventId]);

  const handleAnswerChange = useCallback((inputId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [inputId]: value }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[inputId];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData || orderFormId == null) return;

      const allIds = new Set<string>();
      formData.sections.forEach((s) => s.inputs.forEach((i) => allIds.add(i.id)));
      setTouched(allIds);

      const newErrors: Record<string, string> = {};
      formData.sections.forEach((s) => {
        s.inputs
          .filter((i) => i.required)
          .forEach((i) => {
            const val = answers[i.id];
            const empty = !val || (Array.isArray(val) && val.length === 0);
            if (empty) newErrors[i.id] = 'This field is required';
          });
      });
      setValidationErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      if (hasPendingUploads) {
        setSubmitError('Please wait for file uploads to finish before submitting.');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      const enrichedFormData: OrderFormData = {
        sections: formData.sections.map((section) => ({
          ...section,
          inputs: section.inputs.map((input) => ({
            ...input,
            answer: answers[input.id] ?? null,
          })),
        })),
      };

      try {
        const res = await fetch('/api/registration/group-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            token,
            eventId,
            formData: enrichedFormData,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setSubmitError(data?.error || 'Submission failed');
          return;
        }
        setLoadState('done');
      } catch {
        setSubmitError('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, orderFormId, answers, token, eventId, hasPendingUploads]
  );

  if (loadState === 'error' && loadError === 'sign_in_required') {
    return (
      <div className="text-center py-10 animate-fade-in px-1">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={30} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Sign in to continue</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
          This link is tied to your account. Please sign in, then return here to complete your registration details.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(loginNextPath)}`}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white font-bold rounded-2xl shadow-lg"
        >
          Sign in
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="text-center py-10 px-1">
        <AlertCircle className="mx-auto text-red-500 mb-3" size={32} />
        <p className="text-sm text-red-600 dark:text-red-400">{loadError || 'Something went wrong'}</p>
        <button
          type="button"
          onClick={() => router.push(`/events/${eventSlug}`)}
          className="mt-6 text-sm font-semibold text-[#3D518C] dark:text-blue-400 underline"
        >
          Back to event
        </button>
      </div>
    );
  }

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader className="animate-spin text-[#3D518C]" size={28} />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading your form…</p>
      </div>
    );
  }

  if (loadState === 'done') {
    return (
      <div className="text-center py-10 animate-fade-in px-1">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200 dark:shadow-green-900/30">
          <CheckCircle size={38} className="text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">You&apos;re all set</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-6">
          Thanks for completing your details for {eventTitle}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch max-w-sm mx-auto">
          <Link
            href={`/events/${eventSlug}/e-ticket?token=${encodeURIComponent(token)}`}
            className="inline-flex min-h-[48px] items-center justify-center px-6 py-3 border-2 border-[#3D518C] dark:border-blue-500 text-[#3D518C] dark:text-blue-400 font-bold rounded-2xl"
          >
            View e-ticket (QR)
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/events/${eventSlug}`)}
            className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white font-bold rounded-2xl shadow-lg"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 bg-indigo-50/80 dark:bg-indigo-900/20 px-4 py-3">
        <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">
          You&apos;re completing the attendee form as a <strong>group member</strong>. Proof of payment and payment reference are not required here.
        </p>
      </div>

      {submitError && (
        <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
        </div>
      )}

      {Object.keys(validationErrors).length > 0 && touched.size > 0 && (
        <div className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">Please fill in all required fields.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PublicOrderForm
          formData={formData}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          touched={touched}
          validationErrors={validationErrors}
          eventId={eventId}
          orderFormId={orderFormId ?? undefined}
          onUploadingChange={(uploading) => {
            setHasPendingUploads(uploading);
            if (!uploading) {
              setSubmitError((prev) =>
                prev === 'Please wait for file uploads to finish before submitting.' ? null : prev
              );
            }
          }}
        />
        <button
          type="submit"
          disabled={isSubmitting || hasPendingUploads}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white font-bold rounded-2xl shadow-lg disabled:opacity-60"
        >
          {isSubmitting || hasPendingUploads ? (
            <>
              <Loader size={16} className="animate-spin" />
              {isSubmitting ? 'Submitting…' : 'Uploading files…'}
            </>
          ) : (
            <>
              Submit details
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
