import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { getAdminSupabaseForEventOr404 } from "@/lib/apiEventAccess";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import {
  EmailAudienceFilters,
  enqueueCampaignRecipients,
  processCampaignQueue,
  resolveEventRecipients,
} from "@/lib/emailCampaigns";
import { sendEmail } from "@/lib/emailProvider";
import { escapeHtml } from "@/lib/security";

type CampaignAction = "draft" | "send" | "estimate";
type SendOption = "preview" | "attendees";
type ScheduleOption = "immediately" | "later";

const INLINE_IMAGE_REGEX = /<img\b[^>]*\bsrc=("|')(data:image\/[a-zA-Z0-9.+-]+;base64,[^"']+)\1/gi;

function decodeInlineImage(dataUrl: string): { bytes: Buffer; extension: string; contentType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid inline image format");
  }

  const contentType = match[1].toLowerCase();
  const base64 = match[2];
  const bytes = Buffer.from(base64, "base64");

  if (bytes.length === 0) {
    throw new Error("Inline image is empty");
  }

  if (bytes.length > 8 * 1024 * 1024) {
    throw new Error("Inline image must be 8MB or smaller");
  }

  const extension = contentType === "image/png"
    ? "png"
    : contentType === "image/webp"
      ? "webp"
      : contentType === "image/gif"
        ? "gif"
        : contentType === "image/svg+xml"
          ? "svg"
          : "jpg";

  return { bytes, extension, contentType };
}

async function normalizeInlineImages(htmlBody: string, eventId: number): Promise<string> {
  const matches = [...htmlBody.matchAll(INLINE_IMAGE_REGEX)];
  if (matches.length === 0) {
    return htmlBody;
  }

  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await createAdminClient()
    : await createClient();

  let normalized = htmlBody;

  for (const match of matches) {
    const inlineSrc = match[2];
    const { bytes, extension, contentType } = decodeInlineImage(inlineSrc);
    const objectPath = `email-campaigns/${eventId}/inline-${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("events")
      .upload(objectPath, bytes, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      });

    if (uploadError) {
      throw new Error(`Failed to upload inline image: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("events").getPublicUrl(objectPath);

    normalized = normalized.replace(inlineSrc, publicUrl);
  }

  return normalized;
}

function prependEventTitleHeading(htmlBody: string, eventTitle: string): string {
  const marker = 'data-g-events-title="true"';
  if (htmlBody.includes(marker)) {
    return htmlBody;
  }

  const safeTitle = escapeHtml(eventTitle.trim() || "Event Update");
  const titleHeading = `<h1 ${marker} style="margin:0 0 16px 0;">${safeTitle}</h1>`;
  return `${titleHeading}\n${htmlBody}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireUser();

    const { eventId } = await params;
    const id = parseInt(eventId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid eventId" },
        { status: 400 }
      );
    }

    const access = await getAdminSupabaseForEventOr404(id);
    if (!access.ok) return access.response;

    const { data, error } = await access.supabase
      .from("EventEmailCampaign")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;

    console.error("EmailAttendees GET error:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unexpected error while loading campaigns",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireUser();

    const { eventId } = await params;
    const id = parseInt(eventId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid eventId" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const requestedAction = String(body?.action || "send").toLowerCase();
    const action: CampaignAction = requestedAction === "draft"
      ? "draft"
      : requestedAction === "estimate"
        ? "estimate"
        : "send";
    const sendOption: SendOption = body?.sendOption === "preview" ? "preview" : "attendees";
    const scheduleOption: ScheduleOption =
      body?.scheduleOption === "later" ? "later" : "immediately";
    const filters: EmailAudienceFilters = body?.filters || {};

    if (action === "estimate") {
      const access = await getAdminSupabaseForEventOr404(id);
      if (!access.ok) return access.response;
      const recipients = await resolveEventRecipients(access.supabase, id, filters);

      return NextResponse.json(
        {
          success: true,
          data: {
            recipientCount: recipients.length,
          },
        },
        { status: 200 }
      );
    }

    const subject = String(body?.subject || "").trim();
    const htmlBody = String(body?.body || "").trim();

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Email subject is required" },
        { status: 400 }
      );
    }

    if (!htmlBody) {
      return NextResponse.json(
        { success: false, error: "Email body is required" },
        { status: 400 }
      );
    }

    const scheduleAt =
      scheduleOption === "later" && body?.scheduledFor
        ? new Date(String(body.scheduledFor)).toISOString()
        : null;

    if (scheduleOption === "later" && !scheduleAt) {
      return NextResponse.json(
        { success: false, error: "scheduledFor is required when scheduling for later" },
        { status: 400 }
      );
    }

    const access = await getAdminSupabaseForEventOr404(id);
    if (!access.ok) return access.response;
    const supabase = access.supabase;

    const { data: eventData, error: eventError } = await supabase
      .from("Event")
      .select("title")
      .eq("id", id)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { success: false, error: eventError?.message || "Event not found" },
        { status: 404 }
      );
    }

    const normalizedBody = await normalizeInlineImages(htmlBody, id);
    const campaignBody = prependEventTitleHeading(
      normalizedBody,
      String(eventData.title || "Event Update")
    );

    if (action === "draft") {
      const { data, error } = await supabase
        .from("EventEmailCampaign")
        .insert([
          {
            event_id: id,
            subject,
            body_html: campaignBody,
            status: "draft",
            send_mode: sendOption,
            filters,
            recipient_count: 0,
            schedule_at: null,
            created_by_email: user.email || null,
          },
        ])
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data, message: "Draft saved" }, { status: 201 });
    }

    // Send preview directly to current user email.
    if (sendOption === "preview") {
      const to = user.email;
      if (!to) {
        return NextResponse.json(
          { success: false, error: "Authenticated user email is missing" },
          { status: 400 }
        );
      }

      await sendEmail({ to, subject, html: campaignBody });

      const { data, error } = await supabase
        .from("EventEmailCampaign")
        .insert([
          {
            event_id: id,
            subject,
            body_html: campaignBody,
            status: "sent",
            send_mode: "preview",
            filters,
            recipient_count: 1,
            schedule_at: null,
            sent_at: new Date().toISOString(),
            created_by_email: user.email || null,
          },
        ])
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, data, message: "Preview email sent", delivery: { total: 1, sent: 1, failed: 0 } },
        { status: 201 }
      );
    }

    // Send to attendees
    const recipients = await resolveEventRecipients(supabase, id, filters);

    const initialStatus = scheduleOption === "later" ? "scheduled" : "sending";
    const { data: campaign, error: campaignError } = await supabase
      .from("EventEmailCampaign")
      .insert([
        {
          event_id: id,
          subject,
          body_html: campaignBody,
          status: initialStatus,
          send_mode: "attendees",
          filters,
          recipient_count: recipients.length,
          schedule_at: scheduleAt,
          created_by_email: user.email || null,
        },
      ])
      .select("*")
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: campaignError?.message || "Failed to create campaign" },
        { status: 500 }
      );
    }

    await enqueueCampaignRecipients(supabase, campaign.id, id, recipients);

    if (scheduleOption === "later") {
      return NextResponse.json(
        {
          success: true,
          data: campaign,
          message: "Campaign scheduled",
          delivery: { total: recipients.length, sent: 0, failed: 0 },
        },
        { status: 201 }
      );
    }

    const delivery = await processCampaignQueue(supabase, campaign.id);
    const { data: refreshed } = await supabase
      .from("EventEmailCampaign")
      .select("*")
      .eq("id", campaign.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: refreshed || campaign,
        message: "Campaign processed",
        delivery,
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    const authError = getAuthErrorResponse(e);
    if (authError) return authError;

    console.error("EmailAttendees POST error:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unexpected error while creating campaign",
      },
      { status: 500 }
    );
  }
}
