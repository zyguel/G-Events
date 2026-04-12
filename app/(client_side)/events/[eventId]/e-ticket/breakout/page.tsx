import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ClientHeader from '@/components/client/ClientHeader';
import { getPublishedEventById } from '@/lib/actions/events';
import { buildEventSlug } from '@/lib/slug';
import { createAdminClient } from '@/lib/supabase-server';
import { buildBreakoutEticketUrl, buildTicketQrDataUrl } from '@/lib/ticketEmail';
import { getPublicAppBaseUrl } from '@/lib/appBaseUrl';

export const dynamic = 'force-dynamic';

export default async function PublicBreakoutETicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { eventId } = await params;
  const { token } = await searchParams;

  if (!eventId || eventId === 'undefined' || !token?.trim()) {
    return notFound();
  }

  const numericEventId = parseInt(eventId.split('-').pop() ?? '', 10);
  if (Number.isNaN(numericEventId)) {
    return notFound();
  }

  const admin = await createAdminClient();
  const { data: bsr, error: bsrErr } = await admin
    .from('BreakoutSessionRegistration')
    .select('id, ticket_token, breakout_session_id, registration_id')
    .eq('ticket_token', token.trim())
    .maybeSingle();

  if (bsrErr || !bsr?.registration_id || !bsr.breakout_session_id) {
    return notFound();
  }

  const { data: reg } = await admin
    .from('Registration')
    .select('event_id')
    .eq('id', bsr.registration_id)
    .maybeSingle();

  if (!reg || Number(reg.event_id) !== numericEventId) {
    return notFound();
  }

  const event = await getPublishedEventById(numericEventId);
  if (!event) {
    return notFound();
  }

  const { data: sessionRow } = await admin
    .from('BreakoutSession')
    .select('name, room_name')
    .eq('id', bsr.breakout_session_id)
    .maybeSingle();

  const eventSlug = buildEventSlug(event.title, event.id);
  let qrSrc = '';
  try {
    const baseUrl = getPublicAppBaseUrl();
    const ticketUrl = buildBreakoutEticketUrl(baseUrl, eventSlug, token.trim());
    qrSrc = await buildTicketQrDataUrl(ticketUrl);
  } catch {
    qrSrc = '';
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
      <ClientHeader variant="guest" />

      <div className="max-w-lg mx-auto px-4 pt-6 pb-12">
        <Link
          href={`/events/${eventSlug}`}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#3D518C] dark:hover:text-blue-400"
        >
          <ChevronLeft size={16} />
          Back to event
        </Link>

        <div className="mt-8 bg-white dark:bg-gray-900/90 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-6 sm:p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">
            Breakout e-ticket
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-1">{event.title}</h1>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-300 mt-4">{sessionRow?.name || 'Breakout session'}</p>
          {sessionRow?.room_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{sessionRow.room_name}</p>
          )}

          {qrSrc ? (
            <div className="flex justify-center my-8">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL from QR generator */}
              <img
                src={qrSrc}
                alt="Breakout QR code"
                width={280}
                height={280}
                className="rounded-2xl border border-gray-100 dark:border-gray-800"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500 my-8">QR unavailable (app URL not configured).</p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Separate from your main event ticket. Registration #{bsr.registration_id}.
          </p>
        </div>
      </div>
    </div>
  );
}
