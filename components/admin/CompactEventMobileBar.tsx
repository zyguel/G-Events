"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAdminCompactMode } from "@/contexts/AdminCompactModeContext";
import { buildEventSlug } from "@/lib/slug";

export default function CompactEventMobileBar({
  eventTitle,
  eventId,
}: {
  eventTitle: string;
  eventId: string;
}) {
  const { isCompactAdmin } = useAdminCompactMode();
  const pathname = usePathname();

  if (!isCompactAdmin) return null;

  const slug = buildEventSlug(eventTitle, eventId);
  const onCheckIn = pathname.includes("/checkin");

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white/95 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900/95 lg:hidden">
      <Link
        href="/admin/events"
        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 touch-manipulation"
        aria-label="All events"
      >
        <ChevronLeft size={20} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{eventTitle}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3D518C] dark:text-blue-400">
          {onCheckIn ? "Check-in & attendees" : "Open check-in"}
        </p>
      </div>
      {!onCheckIn ? (
        <Link
          href={`/admin/events/${slug}/checkin`}
          className="shrink-0 rounded-lg bg-[#3D518C] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#324373] touch-manipulation"
        >
          Check-in
        </Link>
      ) : null}
    </div>
  );
}
