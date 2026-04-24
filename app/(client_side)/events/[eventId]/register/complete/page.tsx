import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ClientHeader from '@/components/client/ClientHeader';
import { GroupMemberCompleteClient } from '@/components/public/GroupMemberCompleteClient';
import { getPublishedEventById } from '@/lib/actions/events';
import { buildEventSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export default async function GroupMemberCompletePage({
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

  const event = await getPublishedEventById(numericEventId);
  if (!event) {
    return notFound();
  }

  const eventSlug = buildEventSlug(event.title, event.id);

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
      <ClientHeader />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Link
          href={`/events/${eventSlug}`}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#3D518C] dark:hover:text-blue-400 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to event
        </Link>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
            Registration invite
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight px-1">
            Complete your details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
            {event.title}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-4 sm:p-10">
          <GroupMemberCompleteClient
            token={token.trim()}
            eventId={numericEventId}
            eventSlug={eventSlug}
          />
        </div>
      </div>
    </div>
  );
}
