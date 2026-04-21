import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emailProvider";

export interface EmailAudienceFilters {
  ticketTypes?: {
    selectAll?: boolean;
    selectedTicketIds?: number[];
    generalAdmission?: boolean;
    premiumAdmission?: boolean;
  };
  statuses?: {
    selectAll?: boolean;
    pending?: boolean;
    confirmed?: boolean;
    attended?: boolean;
    notAttended?: boolean;
    waitlisted?: boolean;
  };
  attendanceTypes?: {
    selectAll?: boolean;
    mainEvent?: boolean;
    breakoutSession?: boolean;
  };
}

export interface CampaignRecipient {
  email: string;
  registrationId: number | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string | null | undefined): value is string =>
  !!value && EMAIL_REGEX.test(value.trim());

const isPremiumTicket = (ticketName: string) =>
  ticketName.toLowerCase().includes("premium");

function normalizeFilters(filters: EmailAudienceFilters | null | undefined): Required<EmailAudienceFilters> {
  return {
    ticketTypes: {
      selectAll: !!filters?.ticketTypes?.selectAll,
      selectedTicketIds: Array.isArray(filters?.ticketTypes?.selectedTicketIds)
        ? filters!.ticketTypes!.selectedTicketIds!
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
        : [],
      generalAdmission: !!filters?.ticketTypes?.generalAdmission,
      premiumAdmission: !!filters?.ticketTypes?.premiumAdmission,
    },
    statuses: {
      selectAll: !!filters?.statuses?.selectAll,
      pending: !!filters?.statuses?.pending,
      confirmed: !!filters?.statuses?.confirmed,
      attended: !!filters?.statuses?.attended,
      notAttended: !!filters?.statuses?.notAttended,
      waitlisted: !!filters?.statuses?.waitlisted,
    },
    attendanceTypes: {
      selectAll: !!filters?.attendanceTypes?.selectAll,
      mainEvent: !!filters?.attendanceTypes?.mainEvent,
      breakoutSession: !!filters?.attendanceTypes?.breakoutSession,
    },
  };
}

async function getBreakoutRegistrationIds(
  supabase: SupabaseClient,
  eventId: number
): Promise<Set<number>> {
  const { data, error } = await supabase
    .from("BreakoutSession")
    .select("id, BreakoutSessionRegistration(registration_id)")
    .eq("event_id", eventId);

  if (error || !data) {
    return new Set<number>();
  }

  const ids = new Set<number>();
  for (const session of data as any[]) {
    const regs: any[] = session.BreakoutSessionRegistration || [];
    for (const reg of regs) {
      const id = Number(reg.registration_id);
      if (!Number.isNaN(id)) ids.add(id);
    }
  }
  return ids;
}

export async function resolveEventRecipients(
  supabase: SupabaseClient,
  eventId: number,
  rawFilters: EmailAudienceFilters
): Promise<CampaignRecipient[]> {
  const filters = normalizeFilters(rawFilters);
  const selectedTicketIds = filters.ticketTypes.selectedTicketIds ?? [];

  const shouldFilterTicket =
    !filters.ticketTypes.selectAll &&
    (
      selectedTicketIds.length > 0 ||
      filters.ticketTypes.generalAdmission ||
      filters.ticketTypes.premiumAdmission
    );

  const shouldFilterStatus =
    !filters.statuses.selectAll &&
    (filters.statuses.pending ||
      filters.statuses.confirmed ||
      filters.statuses.attended ||
      filters.statuses.notAttended ||
      filters.statuses.waitlisted);

  const breakoutOnly =
    !filters.attendanceTypes.selectAll &&
    filters.attendanceTypes.breakoutSession &&
    !filters.attendanceTypes.mainEvent;

  const breakoutRegistrationIds = breakoutOnly
    ? await getBreakoutRegistrationIds(supabase, eventId)
    : null;

  const { data: regRows, error: regError } = await supabase
    .from("Registration")
    .select("id, status, has_checked_in, is_waitlisted, ticket_id, User(email), Ticket(name)")
    .eq("event_id", eventId);

  if (regError) {
    throw new Error(regError.message);
  }

  const recipients: CampaignRecipient[] = [];
  const seenEmails = new Set<string>();

  for (const row of (regRows || []) as any[]) {
    const email = row.User?.email || null;
    if (!isValidEmail(email)) continue;

    const registrationId = Number(row.id);
    if (Number.isNaN(registrationId)) continue;

    if (breakoutRegistrationIds && !breakoutRegistrationIds.has(registrationId)) {
      continue;
    }

    const ticketName = String(row.Ticket?.name || "General Admission");
    if (shouldFilterTicket) {
      if (selectedTicketIds.length > 0) {
        const ticketId = Number(row.ticket_id);
        if (!Number.isFinite(ticketId) || !selectedTicketIds.includes(ticketId)) {
          continue;
        }
      } else {
        const premium = isPremiumTicket(ticketName);
        if (filters.ticketTypes.generalAdmission && !filters.ticketTypes.premiumAdmission && premium) continue;
        if (filters.ticketTypes.premiumAdmission && !filters.ticketTypes.generalAdmission && !premium) continue;
      }
    }

    if (shouldFilterStatus) {
      const status = String(row.status || "").toLowerCase();
      const checkedIn = !!row.has_checked_in;
      const waitlisted = !!row.is_waitlisted || status === "waitlisted";

      const matches =
        (filters.statuses.pending && status === "pending") ||
        (filters.statuses.confirmed && status === "confirmed") ||
        (filters.statuses.attended && checkedIn) ||
        (filters.statuses.notAttended && !checkedIn) ||
        (filters.statuses.waitlisted && waitlisted);

      if (!matches) continue;
    }

    const normalized = email.toLowerCase().trim();
    if (seenEmails.has(normalized)) continue;

    seenEmails.add(normalized);
    recipients.push({ email: normalized, registrationId });
  }

  // Include standalone waitlist entries if explicitly targeting waitlisted users.
  if (filters.statuses.waitlisted) {
    const { data: waitlistRows } = await supabase
      .from("WaitlistEntry")
      .select("email")
      .eq("event_id", eventId);

    for (const row of (waitlistRows || []) as any[]) {
      const email = row.email || null;
      if (!isValidEmail(email)) continue;
      const normalized = email.toLowerCase().trim();
      if (seenEmails.has(normalized)) continue;
      seenEmails.add(normalized);
      recipients.push({ email: normalized, registrationId: null });
    }
  }

  return recipients;
}

export async function enqueueCampaignRecipients(
  supabase: SupabaseClient,
  campaignId: number,
  eventId: number,
  recipients: CampaignRecipient[]
): Promise<void> {
  if (recipients.length === 0) return;

  const rows = recipients.map((recipient) => ({
    campaign_id: campaignId,
    event_id: eventId,
    registration_id: recipient.registrationId,
    email: recipient.email,
    status: "queued",
  }));

  const { error } = await supabase.from("EventEmailRecipient").insert(rows);
  if (error) throw new Error(error.message);
}

export async function processCampaignQueue(
  supabase: SupabaseClient,
  campaignId: number
): Promise<{ total: number; sent: number; failed: number }> {
  const { data: campaign, error: campaignError } = await supabase
    .from("EventEmailCampaign")
    .select("id, subject, body_html")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message || "Campaign not found");
  }

  await supabase
    .from("EventEmailCampaign")
    .update({ status: "sending", error_message: null })
    .eq("id", campaignId);

  const { data: queuedRows, error: queueError } = await supabase
    .from("EventEmailRecipient")
    .select("id, email")
    .eq("campaign_id", campaignId)
    .eq("status", "queued");

  if (queueError) {
    throw new Error(queueError.message);
  }

  const rows = (queuedRows || []) as Array<{ id: number; email: string }>;
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await sendEmail({
        to: row.email,
        subject: campaign.subject,
        html: campaign.body_html,
      });

      sent += 1;
      await supabase
        .from("EventEmailRecipient")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", row.id);
    } catch (e) {
      failed += 1;
      await supabase
        .from("EventEmailRecipient")
        .update({
          status: "failed",
          error_message: e instanceof Error ? e.message : "Unknown email sending error",
        })
        .eq("id", row.id);
    }
  }

  const doneStatus = failed > 0 ? "failed" : "sent";
  await supabase
    .from("EventEmailCampaign")
    .update({
      status: doneStatus,
      sent_at: new Date().toISOString(),
      error_message: failed > 0 ? `${failed} recipients failed` : null,
    })
    .eq("id", campaignId);

  return { total: rows.length, sent, failed };
}

export async function processDueCampaigns(
  supabase: SupabaseClient,
  options?: { eventId?: number; limit?: number }
): Promise<{ processed: number; totals: { total: number; sent: number; failed: number } }> {
  const nowIso = new Date().toISOString();
  const limit = options?.limit ?? 10;

  let query = supabase
    .from("EventEmailCampaign")
    .select("id")
    .eq("status", "scheduled")
    .lte("schedule_at", nowIso)
    .order("schedule_at", { ascending: true })
    .limit(limit);

  if (options?.eventId) {
    query = query.eq("event_id", options.eventId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const campaigns = (data || []) as Array<{ id: number }>;
  let total = 0;
  let sent = 0;
  let failed = 0;

  for (const campaign of campaigns) {
    const result = await processCampaignQueue(supabase, campaign.id);
    total += result.total;
    sent += result.sent;
    failed += result.failed;
  }

  return { processed: campaigns.length, totals: { total, sent, failed } };
}
