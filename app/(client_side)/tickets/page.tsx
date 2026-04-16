import { redirect } from "next/navigation";
import ClientHeader from "@/components/client/ClientHeader";
import ClientMobileNav from "@/components/client/ClientMobileNav";
import TicketsPageClient, { type TicketPassItem } from "@/components/client/TicketsPageClient";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { generateCheckInPass } from "@/lib/checkinQr";
import { getPublicAppBaseUrl } from "@/lib/appBaseUrl";
import { buildEventSlug } from "@/lib/slug";
import { buildBreakoutEticketUrl } from "@/lib/ticketEmail";

export const dynamic = "force-dynamic";

type RegistrationRow = {
  id: number;
  status?: string;
  has_checked_in?: boolean;
  checked_in_at?: string | null;
  created_at?: string;
  event_id: number;
  Event?: {
    id?: number;
    title?: string;
    event_start_at?: string | null;
    event_end_at?: string | null;
    location?: string | null;
    banner_image?: string | null;
  } | null;
  Ticket?: {
    id?: number;
    name?: string;
    price?: number | null;
  } | null;
};

type BreakoutRegistrationRow = {
  registration_id: number;
  ticket_token?: string | null;
  breakout_session_id?: number | null;
  BreakoutSession?: {
    name?: string | null;
    room_name?: string | null;
  } | null;
};

export default async function TicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const currentUserEmail: string = user.email;

  const adminClient = await createAdminClient();
  const { data: userRow } = await adminClient
    .from("User")
    .select("id")
    .ilike("email", currentUserEmail)
    .limit(1)
    .maybeSingle();

  const userId = Number(userRow?.id);
  let passes: TicketPassItem[] = [];

  if (!Number.isNaN(userId) && userId > 0) {
    const { data: registrationRows } = await adminClient
      .from("Registration")
      .select(
        "id, status, has_checked_in, checked_in_at, created_at, event_id, Event(id, title, event_start_at, event_end_at, location, banner_image), Ticket(id, name, price)"
      )
      .eq("user_id", userId)
      .not("status", "in", "(cancelled,rejected)")
      .order("created_at", { ascending: false });

    const mainPasses = ((registrationRows || []) as RegistrationRow[])
      .filter((row) => Number.isFinite(Number(row.id)) && Number.isFinite(Number(row.event_id)))
      .map((row) => {
        const checkInPass = generateCheckInPass({
          eventId: Number(row.event_id),
          registrationId: Number(row.id),
          email: currentUserEmail,
          eventStartAt: row.Event?.event_start_at || null,
          eventEndAt: row.Event?.event_end_at || null,
        });

        return {
          passKind: "event" as const,
          registrationId: Number(row.id),
          eventId: Number(row.event_id),
          eventTitle: row.Event?.title || `Event #${row.event_id}`,
          eventLocation: row.Event?.location || null,
          eventBannerImage: row.Event?.banner_image || null,
          eventStartAt: row.Event?.event_start_at || null,
          eventEndAt: row.Event?.event_end_at || null,
          ticketName: row.Ticket?.name || "General Admission",
          ticketPrice: row.Ticket?.price ?? null,
          status: String(row.status || "pending"),
          hasCheckedIn: !!row.has_checked_in,
          checkedInAt: row.checked_in_at || null,
          createdAt: row.created_at || null,
          passEmail: currentUserEmail,
          token: checkInPass.token,
          qrPayload: checkInPass.qrPayload,
          expiresAt: checkInPass.expiresAt,
        };
      });

    const registrationIds = mainPasses.map((pass) => pass.registrationId);
    let breakoutPasses: TicketPassItem[] = [];

    if (registrationIds.length > 0) {
      const { data: breakoutRows } = await adminClient
        .from("BreakoutSessionRegistration")
        .select("registration_id, ticket_token, breakout_session_id, BreakoutSession(name, room_name)")
        .in("registration_id", registrationIds);

      const baseUrl = getPublicAppBaseUrl();
      const byRegistration = new Map<number, TicketPassItem>();

      for (const row of (breakoutRows || []) as BreakoutRegistrationRow[]) {
        const regId = Number(row.registration_id);
        const token = String(row.ticket_token || "").trim();
        if (!Number.isFinite(regId) || !token) continue;

        const sourceMainPass = mainPasses.find((pass) => pass.registrationId === regId);
        if (!sourceMainPass) continue;

        const slug = buildEventSlug(sourceMainPass.eventTitle, sourceMainPass.eventId);
        const breakoutUrl = buildBreakoutEticketUrl(baseUrl, slug, token);
        const sessionName = row.BreakoutSession?.name || "Breakout session";

        byRegistration.set(regId, {
          passKind: "breakout",
          registrationId: sourceMainPass.registrationId,
          eventId: sourceMainPass.eventId,
          eventTitle: sourceMainPass.eventTitle,
          eventLocation: sourceMainPass.eventLocation,
          eventBannerImage: sourceMainPass.eventBannerImage,
          eventStartAt: sourceMainPass.eventStartAt,
          eventEndAt: sourceMainPass.eventEndAt,
          ticketName: `Breakout: ${sessionName}`,
          ticketPrice: null,
          status: sourceMainPass.status,
          hasCheckedIn: false,
          checkedInAt: null,
          createdAt: sourceMainPass.createdAt,
          passEmail: sourceMainPass.passEmail,
          token,
          qrPayload: breakoutUrl,
          expiresAt: null,
          breakoutSessionTitle: sessionName,
          breakoutSessionLocation: row.BreakoutSession?.room_name || null,
        });
      }

      breakoutPasses = Array.from(byRegistration.values());
    }

    passes = [...mainPasses, ...breakoutPasses];
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
      <ClientHeader />
      <TicketsPageClient passes={passes} />
      <ClientMobileNav activePage="tickets" />
    </div>
  );
}
