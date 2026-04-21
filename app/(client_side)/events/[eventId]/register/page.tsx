import { notFound } from "next/navigation";
import ClientHeader from "@/components/client/ClientHeader";
import RegistrationFlow from "@/components/public/RegistrationFlow";
import { getPublicBreakoutSessions, getPublishedEventById } from "@/lib/actions/events";
import { getOrderFormsByEventPublic } from "@/lib/actions/orderForm";
import { buildEventSlug } from "@/lib/slug";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { generateCheckInPass } from "@/lib/checkinQr";
import Link from "next/link";
import { ChevronLeft, ClipboardX } from "lucide-react";
import { verifyWaitlistInviteToken } from '@/lib/waitlistInviteToken';

export const dynamic = "force-dynamic";

type EventTicketRow = {
  id: number;
  name: string;
  price: number | null;
  available_quantity: number | null;
  waitlist_reserved_quantity: number | null;
};

type RegistrationUsageRow = {
  ticket_id: number | null;
  status: string | null;
};

export default async function PublicEventRegistrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const query = await searchParams;
  if (!eventId || eventId === "undefined") return notFound();

  const numericEventId = parseInt(eventId.split("-").pop() ?? "", 10);
  if (isNaN(numericEventId)) return notFound();

  const event = await getPublishedEventById(numericEventId);
  if (!event) return notFound();

  const waitlistInviteRaw = query?.waitlistInvite;
  const waitlistInviteToken = Array.isArray(waitlistInviteRaw)
    ? String(waitlistInviteRaw[0] || '')
    : String(waitlistInviteRaw || '');

  const waitlistInviteVerification = waitlistInviteToken
    ? verifyWaitlistInviteToken(waitlistInviteToken)
    : { valid: false as const };

  const validWaitlistInviteClaims =
    waitlistInviteVerification.valid && waitlistInviteVerification.claims?.eid === numericEventId
      ? waitlistInviteVerification.claims
      : null;

  let waitlistInviteName: string | undefined;

  const formsResult = await getOrderFormsByEventPublic(numericEventId);
  const form = formsResult?.data?.[0];
  const eventSlug = buildEventSlug(event.title, event.id);
  const breakoutSessions = event.allow_breakout_sessions
    ? await getPublicBreakoutSessions(numericEventId)
    : [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = validWaitlistInviteClaims?.email || user?.email || undefined;

  const adminClient = await createAdminClient();
  if (validWaitlistInviteClaims?.email) {
    const { data: invitedUserRow } = await adminClient
      .from("User")
      .select("name")
      .ilike("email", validWaitlistInviteClaims.email)
      .limit(1)
      .maybeSingle();

    waitlistInviteName = typeof invitedUserRow?.name === 'string' ? invitedUserRow.name : undefined;
  }

  const { data: ticketRows } = await adminClient
      .from("Ticket")
      .select("id, name, price, available_quantity, waitlist_reserved_quantity")
      .eq("event_id", numericEventId)
      .eq("is_deleted", false)
      .eq("is_hidden", false)
      .order("price", { ascending: true })
      .order("id", { ascending: true });

  const eventTicketsRaw = (ticketRows || []) as EventTicketRow[];
  const eventTicketsById = new Map<number, EventTicketRow>();
  for (const row of eventTicketsRaw) {
    if (!eventTicketsById.has(row.id)) eventTicketsById.set(row.id, row);
  }
  const eventTickets = Array.from(eventTicketsById.values());
  const ticketIds = eventTickets.map((t) => t.id);
  const usageByTicket = new Map<number, number>();

  if (ticketIds.length > 0) {
      const { data: regUsageRows } = await adminClient
          .from("Registration")
          .select("ticket_id, status")
          .eq("event_id", numericEventId)
          .in("ticket_id", ticketIds);

        for (const row of ((regUsageRows || []) as RegistrationUsageRow[])) {
          const status = String(row.status || "").toLowerCase();
          if (status === "rejected" || status === "cancelled") continue;
          const tid = Number(row.ticket_id);
          if (Number.isNaN(tid)) continue;
          usageByTicket.set(tid, (usageByTicket.get(tid) || 0) + 1);
      }
  }

  const { count: promoCount } = await adminClient
      .from("Promotion")
      .select("*", { count: "exact", head: true })
      .eq("event_id", numericEventId);
  const hasPromotions = (promoCount || 0) > 0;

  const enrichedTickets = eventTickets.map((t) => {
      const total = Number(t.available_quantity ?? 0);
      const reservedForWaitlist = Number(t.waitlist_reserved_quantity ?? 0);
      const publicTotal = Math.max(0, total - Math.max(0, reservedForWaitlist));
      const used = usageByTicket.get(Number(t.id)) || 0;
      return {
          id: t.id,
          name: t.name,
          price: Number(t.price ?? 0),
        available_quantity: publicTotal,
          used_quantity: used,
          is_sold_out: publicTotal <= 0 ? true : used >= publicTotal,
      };
  });

  let existingCheckInPasses: Array<{
    email: string;
    registrationId: number;
    token: string;
    qrPayload: string;
    expiresAt: string;
  }> = [];

  let existingTicketNames: string[] = [];
  let hasExistingRegistration = false;

  if (userEmail) {
    const { data: userRow } = await adminClient
      .from("User")
      .select("id")
      .ilike("email", userEmail)
      .limit(1)
      .maybeSingle();

    const userId = Number(userRow?.id);
    if (!Number.isNaN(userId) && userId > 0) {
      const { data: existingRegistrations } = await adminClient
        .from("Registration")
        .select("id, status, Ticket(name)")
        .eq("event_id", numericEventId)
        .eq("user_id", userId)
        .not("status", "in", "(cancelled,rejected)")
        .order("created_at", { ascending: true });

      const safeRegistrations = (existingRegistrations || []) as Array<{ id: number; status?: string; Ticket?: { name?: string } }>;
      hasExistingRegistration = safeRegistrations.length > 0;
      const confirmedRegistrations = safeRegistrations.filter(
        (registration) => String(registration.status || '').toLowerCase() === 'confirmed'
      );

      existingCheckInPasses = confirmedRegistrations
        .map((registration) => ({
          email: userEmail.toLowerCase(),
          registrationId: Number(registration.id),
          ...generateCheckInPass({
            eventId: numericEventId,
            registrationId: Number(registration.id),
            email: userEmail,
            eventStartAt: event.event_start_at || null,
            eventEndAt: event.event_end_at || null,
          }),
        }))
        .filter((pass) => Number.isFinite(pass.registrationId));

      existingTicketNames = Array.from(
        new Set(
          safeRegistrations
            .map((registration) => registration.Ticket?.name)
            .filter((name): name is string => !!name)
        )
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
      <ClientHeader />

      {/* Back link */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Link
          href={`/events/${eventSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#3D518C] dark:hover:text-blue-400 transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          Back to event
        </Link>
      </div>

      {!form ? (
        /* No form published yet */
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-gray-900/80 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-10">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ClipboardX size={28} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
              Registration Not Yet Open
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
              The organizer hasn&apos;t published a registration form for this event yet. Please check back later.
            </p>
            <Link
              href={`/events/${eventSlug}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <ChevronLeft size={15} />
              Back to Event
            </Link>
          </div>
        </div>
      ) : (
        <RegistrationFlow
          eventId={numericEventId}
          eventTitle={event.title}
          eventSlug={eventSlug}
          orderFormId={form.id}
          formData={form.form_data || { sections: [] }}
          userEmail={userEmail}
          tickets={enrichedTickets}
          breakoutSessions={breakoutSessions}
          existingCheckInPasses={existingCheckInPasses}
          existingTicketNames={existingTicketNames}
          hasExistingRegistration={hasExistingRegistration}
          hasPromotions={hasPromotions}
          allowGroupRegistration={event.allow_group_registration ?? true}
          allowWaitlist={event.allow_waitlist ?? false}
          waitlistInviteToken={waitlistInviteToken || undefined}
          waitlistInviteTicketId={validWaitlistInviteClaims?.tid ?? null}
          waitlistInviteEmail={validWaitlistInviteClaims?.email || undefined}
          waitlistInviteName={waitlistInviteName}
        />
      )}
    </div>
  );
}
