import { redirect } from "next/navigation";
import ClientHeader from "@/components/client/ClientHeader";
import TicketsPageClient, { type TicketPassItem } from "@/components/client/TicketsPageClient";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { generateCheckInPass } from "@/lib/checkinQr";

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
  } | null;
  Ticket?: {
    id?: number;
    name?: string;
    price?: number | null;
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

  const adminClient = await createAdminClient();
  const { data: userRow } = await adminClient
    .from("User")
    .select("id")
    .ilike("email", user.email)
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

    passes = ((registrationRows || []) as RegistrationRow[])
      .filter((row) => Number.isFinite(Number(row.id)) && Number.isFinite(Number(row.event_id)))
      .map((row) => {
        const checkInPass = generateCheckInPass({
          eventId: Number(row.event_id),
          registrationId: Number(row.id),
          email: user.email,
        });

        return {
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
          passEmail: user.email,
          token: checkInPass.token,
          qrPayload: checkInPass.qrPayload,
          expiresAt: checkInPass.expiresAt,
        };
      });
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
      <ClientHeader />
      <TicketsPageClient passes={passes} />
    </div>
  );
}
