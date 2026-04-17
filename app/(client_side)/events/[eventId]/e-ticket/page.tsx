import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ClientHeader from '@/components/client/ClientHeader';
import { getPublishedEventById } from '@/lib/actions/events';
import { buildEventSlug } from '@/lib/slug';
import { createAdminClient } from '@/lib/supabase-server';
import { buildBreakoutEticketUrl, buildEticketUrl, buildTicketQrDataUrl } from '@/lib/ticketEmail';
import { getPublicAppBaseUrl } from '@/lib/appBaseUrl';

export const dynamic = 'force-dynamic';

export default async function PublicETicketPage({
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
  const { data: reg, error: regErr } = await admin
    .from('Registration')
    .select('id, event_id, status, ticket_token, user_id, ticket_id')
    .eq('ticket_token', token.trim())
    .maybeSingle();

  if (regErr || !reg || Number(reg.event_id) !== numericEventId) {
    return notFound();
  }

  if (String(reg.status || '').toLowerCase() !== 'confirmed') {
    return notFound();
  }

  const event = await getPublishedEventById(numericEventId);
  if (!event) {
    return notFound();
  }

  const { data: userRow } = await admin.from('User').select('email').eq('id', reg.user_id).maybeSingle();

  const tid = reg.ticket_id != null ? Number(reg.ticket_id) : 0;
  const { data: ticketRow } =
    tid > 0
      ? await admin.from('Ticket').select('name').eq('id', tid).maybeSingle()
      : { data: null as { name: string } | null };

  const eventSlug = buildEventSlug(event.title, event.id);

  const { data: bsr } = await admin
    .from('BreakoutSessionRegistration')
    .select('ticket_token, breakout_session_id')
    .eq('registration_id', reg.id)
    .maybeSingle();

  let mainQrSrc = '';
  let breakoutQrSrc = '';
  let breakoutSessionTitle = '';
  let breakoutSessionLocation = '';

  try {
    const baseUrl = getPublicAppBaseUrl();
    const mainUrl = buildEticketUrl(baseUrl, eventSlug, token.trim());
    mainQrSrc = await buildTicketQrDataUrl(mainUrl);

    if (bsr?.ticket_token && bsr.breakout_session_id) {
      const { data: bsRow } = await admin
        .from('BreakoutSession')
        .select('name, room_name')
        .eq('id', bsr.breakout_session_id)
        .maybeSingle();
      breakoutSessionTitle = bsRow?.name || 'Breakout session';
      breakoutSessionLocation = bsRow?.room_name || '';
      const breakoutUrl = buildBreakoutEticketUrl(baseUrl, eventSlug, String(bsr.ticket_token));
      breakoutQrSrc = await buildTicketQrDataUrl(breakoutUrl);
    }
  } catch {
    mainQrSrc = '';
    breakoutQrSrc = '';
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
      <ClientHeader variant="guest" />

      <div className="max-w-lg mx-auto px-4 pt-6 pb-12 space-y-8">
        <Link
          href={`/events/${eventSlug}`}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#3D518C] dark:hover:text-blue-400"
        >
          <ChevronLeft size={16} />
          Back to event
        </Link>

        <div className="bg-white dark:bg-gray-900/90 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-6 sm:p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#3D518C] dark:text-blue-400 mb-2">
            Main event e-ticket
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-1">{event.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {ticketRow?.name ? <span>{ticketRow.name}</span> : <span>Registration</span>}
          </p>
          {userRow?.email && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-8 break-all">{userRow.email}</p>
          )}

          {mainQrSrc ? (
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL from QR generator */}
              <img
                src={mainQrSrc}
                alt="Main event ticket QR code"
                width={280}
                height={280}
                className="rounded-2xl border border-gray-100 dark:border-gray-800"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-6">QR unavailable (app URL not configured).</p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Registration ID #{reg.id}. Use this QR for main event check-in.
          </p>
        </div>

        {breakoutQrSrc ? (
          <div className="bg-white dark:bg-gray-900/90 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 shadow-xl p-6 sm:p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">
              Breakout session e-ticket
            </p>
            <p className={`text-lg font-bold text-gray-900 dark:text-white ${breakoutSessionLocation ? '' : 'mb-6'}`}>
              {breakoutSessionTitle}
            </p>
            {breakoutSessionLocation ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">{breakoutSessionLocation}</p>
            ) : null}
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={breakoutQrSrc}
                alt="Breakout session ticket QR code"
                width={280}
                height={280}
                className="rounded-2xl border border-gray-100 dark:border-gray-800"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Separate QR for your breakout — show at breakout check-in.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
