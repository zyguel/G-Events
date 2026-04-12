import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ShieldAlert, Clock, CheckCircle2 } from "lucide-react";
import ClientHeader from "@/components/client/ClientHeader";
import FeedbackFormClient from "@/components/client/FeedbackFormClient";
import { getPublishedEventById } from "@/lib/actions/events";
import { buildEventSlug } from "@/lib/slug";
import { createClient, createAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface GateBlockProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  backHref: string;
  backLabel?: string;
}

function GateBlock({ icon, title, message, backHref, backLabel = "Back to Event" }: GateBlockProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] font-sans">
      <ClientHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-5">{icon}</div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <ChevronLeft size={15} />
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  if (!eventId || eventId === "undefined") return notFound();

  const numericEventId = parseInt(eventId.split("-").pop() ?? "", 10);
  if (isNaN(numericEventId)) return notFound();

  // ── 1. Load event ──────────────────────────────────────────────────────────
  const event = await getPublishedEventById(numericEventId);
  if (!event) return notFound();

  const eventSlug = buildEventSlug(event.title, event.id);
  const backHref = `/events/${eventSlug}`;

  // ── 2. Check authentication ────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(`/login?redirectTo=/events/${eventId}/review`);
  }

  const currentUserEmail = user.email;

  // ── 3. Check event has ended ───────────────────────────────────────────────
  const now = new Date();
  const eventEnd = event.event_end_at ? new Date(event.event_end_at) : null;
  const hasEventEnded = eventEnd ? now > eventEnd : false;

  if (!hasEventEnded) {
    return (
      <GateBlock
        icon={<Clock size={44} className="text-amber-400" />}
        title="Feedback Not Yet Available"
        message="The feedback form will be available once the event has ended. Check back after the event concludes."
        backHref={backHref}
      />
    );
  }

  // ── 4. Check user has checked in ──────────────────────────────────────────
  const adminClient = await createAdminClient();
  const { data: userRow } = await adminClient
    .from("User")
    .select("id")
    .ilike("email", currentUserEmail)
    .limit(1)
    .maybeSingle();

  const userId = Number(userRow?.id);
  let registration: { id: number } | null = null;

  if (!isNaN(userId) && userId > 0) {
    const { data: regRow } = await adminClient
      .from("Registration")
      .select("id, has_checked_in, status")
      .eq("event_id", numericEventId)
      .eq("user_id", userId)
      .eq("has_checked_in", true)
      .not("status", "in", "(cancelled,rejected)")
      .limit(1)
      .maybeSingle();

    if (regRow) {
      registration = { id: Number(regRow.id) };
    }
  }

  if (!registration) {
    return (
      <GateBlock
        icon={<ShieldAlert size={44} className="text-rose-400" />}
        title="Attendance Required"
        message="The feedback form is only available to verified attendees who checked in to this event."
        backHref={backHref}
      />
    );
  }

  // ── 5. Load feedback form ──────────────────────────────────────────────────
  const { data: rawForm } = await adminClient
    .from("FeedbackForm")
    .select(`
      id,
      event_id,
      title,
      description,
      is_active,
      created_at,
      FeedbackQuestion (
        id,
        question_text,
        input_format,
        options,
        is_required,
        display_order,
        order
      )
    `)
    .eq("event_id", numericEventId)
    .eq("is_active", true)
    .maybeSingle();

  const feedbackForm = rawForm
    ? {
        ...rawForm,
        FeedbackQuestion: [...((rawForm as any).FeedbackQuestion || [])].sort(
          (a: any, b: any) =>
            (a.display_order ?? a.order ?? 0) - (b.display_order ?? b.order ?? 0)
        ),
      }
    : null;

  if (!feedbackForm) {
    return (
      <GateBlock
        icon={<CheckCircle2 size={44} className="text-gray-300" />}
        title="No Feedback Form Available"
        message="The organizer hasn't published a feedback form for this event yet."
        backHref={backHref}
      />
    );
  }

  // ── 6. Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 font-sans">
      <ClientHeader />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#3D518C] dark:hover:text-blue-400 transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          Back to event
        </Link>
      </div>

      <FeedbackFormClient
        eventId={numericEventId}
        eventTitle={event.title}
        registrationId={registration.id}
        form={feedbackForm}
      />
    </div>
  );
}
