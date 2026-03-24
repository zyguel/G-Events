import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import {
  EmailAudienceFilters,
  enqueueCampaignRecipients,
  processCampaignQueue,
  resolveEventRecipients,
} from "@/lib/emailCampaigns";
import { sendEmail } from "@/lib/emailProvider";

type CampaignAction = "draft" | "send";
type SendOption = "preview" | "attendees";
type ScheduleOption = "immediately" | "later";

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

    const supabase = await createClient();
    const { data, error } = await supabase
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

    const action: CampaignAction = body?.action === "draft" ? "draft" : "send";
    const sendOption: SendOption = body?.sendOption === "preview" ? "preview" : "attendees";
    const scheduleOption: ScheduleOption =
      body?.scheduleOption === "later" ? "later" : "immediately";
    const subject = String(body?.subject || "").trim();
    const htmlBody = String(body?.body || "").trim();
    const filters: EmailAudienceFilters = body?.filters || {};

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

    const supabase = await createClient();

    if (action === "draft") {
      const { data, error } = await supabase
        .from("EventEmailCampaign")
        .insert([
          {
            event_id: id,
            subject,
            body_html: htmlBody,
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

      await sendEmail({ to, subject, html: htmlBody });

      const { data, error } = await supabase
        .from("EventEmailCampaign")
        .insert([
          {
            event_id: id,
            subject,
            body_html: htmlBody,
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
          body_html: htmlBody,
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
