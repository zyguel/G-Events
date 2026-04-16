import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { sendEmail } from "@/lib/emailProvider";

type UiStatus = "Invited" | "Waiting";

const mapStatusToUi = (s: string | null): UiStatus => {
    if (!s) return "Waiting";
    const normalized = s.toLowerCase();
    if (normalized === "invited") return "Invited";
    return "Waiting";
};

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getOrganizationName = (eventRow: any): string => {
    return String(eventRow?.Organization?.name || "G-Events Organization");
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const id = parseInt(eventId, 10);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId" },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const email = String(body?.email || "").trim().toLowerCase();
        const rawTicketId = body?.ticketId;
        const ticketId = rawTicketId === undefined || rawTicketId === null || rawTicketId === ""
            ? null
            : parseInt(String(rawTicketId), 10);

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: "A valid email is required" },
                { status: 400 }
            );
        }

        const supabase = await createAdminClient();

        const { data: eventRow, error: eventError } = await supabase
            .from("Event")
            .select("id, title, is_published, allow_waitlist, Organization(name)")
            .eq("id", id)
            .single();

        if (eventError || !eventRow) {
            return NextResponse.json(
                { success: false, error: "Event not found" },
                { status: 404 }
            );
        }

        if (!eventRow.is_published) {
            return NextResponse.json(
                { success: false, error: "Waitlist is unavailable for unpublished events" },
                { status: 400 }
            );
        }

        if (!eventRow.allow_waitlist) {
            return NextResponse.json(
                { success: false, error: "Waitlist is disabled for this event" },
                { status: 409 }
            );
        }

        const { data: userRow } = await supabase
            .from("User")
            .select("id")
            .ilike("email", email)
            .maybeSingle();

        if (!userRow?.id) {
            return NextResponse.json(
                { success: false, error: "This email is not registered in the system" },
                { status: 400 }
            );
        }

        if (ticketId !== null && Number.isNaN(ticketId)) {
            return NextResponse.json(
                { success: false, error: "Invalid ticketId" },
                { status: 400 }
            );
        }

        if (ticketId !== null) {
            const { data: ticketRow, error: ticketError } = await supabase
                .from("Ticket")
                .select("id")
                .eq("id", ticketId)
                .eq("event_id", id)
                .single();

            if (ticketError || !ticketRow) {
                return NextResponse.json(
                    { success: false, error: "Selected ticket is invalid for this event" },
                    { status: 400 }
                );
            }
        }

        const { data: activeRegistration } = await supabase
            .from("Registration")
            .select("id")
            .eq("event_id", id)
            .eq("user_id", Number(userRow.id))
            .not("status", "in", "(cancelled,rejected)")
            .limit(1)
            .maybeSingle();

        if (activeRegistration?.id) {
            return NextResponse.json(
                { success: false, error: "You already have an active registration for this event" },
                { status: 409 }
            );
        }

        let duplicateQuery = supabase
            .from("WaitlistEntry")
            .select("id")
            .eq("event_id", id)
            .eq("email", email)
            .limit(1);

        if (ticketId === null) {
            duplicateQuery = duplicateQuery.is("ticket_id", null);
        } else {
            duplicateQuery = duplicateQuery.eq("ticket_id", ticketId);
        }

        const { data: existingWaitlist } = await duplicateQuery.maybeSingle();

        if (existingWaitlist?.id) {
            return NextResponse.json(
                { success: false, error: "You are already in the waitlist queue" },
                { status: 409 }
            );
        }

        const { data: insertedEntry, error: insertError } = await supabase
            .from("WaitlistEntry")
            .insert([
                {
                    event_id: id,
                    email,
                    status: "pending",
                    ticket_id: ticketId,
                },
            ])
            .select("id")
            .single();

        if (insertError || !insertedEntry) {
            return NextResponse.json(
                { success: false, error: insertError?.message || "Failed to join waitlist" },
                { status: 500 }
            );
        }

        try {
                        const organizationName = getOrganizationName(eventRow);
            await sendEmail({
                to: email,
                subject: `Waitlist confirmation — ${eventRow.title}`,
                                html: `
                                    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                                        <p>Hi,</p>
                                        <p>You were added to the waitlist for <strong>${eventRow.title}</strong>.</p>
                                        <p>When a slot becomes available, we will notify you by email.</p>
                                        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">This message is from <strong>${organizationName}</strong>.</p>
                                    </div>
                                `,
            });
        } catch (mailError) {
            console.error("Waitlist POST: email send failed", mailError);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: insertedEntry.id,
                email,
                ticketId,
            },
        });
    } catch (e: any) {
        console.error("Waitlist POST error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
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

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("WaitlistEntry")
            .select("id, email, status, created_at, invite_sent_at, invite_expires_at, ticket_id, Ticket(name)")
            .eq("event_id", id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("ManageWaitlist GET: query failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const rows = data || [];

        // Compute queue per ticket type
        const counters = new Map<string, number>();

        const entries = rows.map((row: any) => {
            const ticketType: string = row.Ticket?.name || "General Admission";
            const current = counters.get(ticketType) ?? 0;
            const queue = current + 1;
            counters.set(ticketType, queue);

            const email: string = row.email || "";

            return {
                id: row.id?.toString() || "",
                fullName: email || "Unknown",
                email,
                ticketType,
                queue,
                status: mapStatusToUi(row.status || null),
                inviteSentAt: row.invite_sent_at || null,
            };
        });

        const { data: settingsRow, error: settingsError } = await supabase
            .from("EventWaitlistSettings")
            .select("expiry_days, invite_type, show_position")
            .eq("event_id", id)
            .single();

        if (settingsError && settingsError.code !== "PGRST116") {
            console.error("ManageWaitlist GET: settings query failed", settingsError);
            return NextResponse.json(
                { success: false, error: settingsError.message },
                { status: 500 }
            );
        }

        const settings = settingsRow
            ? {
                  expiryDays: String(settingsRow.expiry_days ?? 7),
                  inviteType: settingsRow.invite_type === "manual" ? "manual" : "auto",
                  showPosition: !!settingsRow.show_position,
              }
            : {
                  expiryDays: "7",
                  inviteType: "auto",
                  showPosition: false,
              };

        return NextResponse.json({ success: true, data: entries, settings });
    } catch (e: any) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageWaitlist GET error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
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

        const body = await request.json().catch(() => ({}));
        const action = body?.action as string | undefined;
        const entryId = parseInt(String(body?.entryId ?? ""), 10);
        const supabase = await createClient();

        if (action === "save_settings") {
            const expiryDays = parseInt(String(body?.expiryDays ?? ""), 10);
            const inviteType = body?.inviteType === "manual" ? "manual" : "auto";
            const showPosition = !!body?.showPosition;

            if (isNaN(expiryDays) || expiryDays < 1 || expiryDays > 30) {
                return NextResponse.json(
                    { success: false, error: "expiryDays must be between 1 and 30" },
                    { status: 400 }
                );
            }

            const { error: settingsError } = await supabase
                .from("EventWaitlistSettings")
                .upsert(
                    {
                        event_id: id,
                        expiry_days: expiryDays,
                        invite_type: inviteType,
                        show_position: showPosition,
                    },
                    { onConflict: "event_id" }
                );

            if (settingsError) {
                return NextResponse.json(
                    { success: false, error: settingsError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, message: "Waitlist settings saved" });
        }

        if (action !== "invite" && action !== "resend_invite") {
            return NextResponse.json(
                { success: false, error: "Unsupported action" },
                { status: 400 }
            );
        }

        if (isNaN(entryId)) {
            return NextResponse.json(
                { success: false, error: "Invalid waitlist entry ID" },
                { status: 400 }
            );
        }

        // Ensure entry belongs to event before mutation.
        const { data: existing, error: existingError } = await supabase
            .from("WaitlistEntry")
            .select("id, event_id, status, email, ticket_id")
            .eq("id", entryId)
            .eq("event_id", id)
            .single();

        if (existingError || !existing) {
            return NextResponse.json(
                { success: false, error: "Waitlist entry not found" },
                { status: 404 }
            );
        }

        const currentStatus = (existing.status || "").toLowerCase();

        if (action === "invite" && currentStatus === "invited") {
            return NextResponse.json(
                { success: true, message: "Entry already invited" }
            );
        }

        if (action === "resend_invite" && currentStatus !== "invited") {
            return NextResponse.json(
                { success: false, error: "Only invited entries can be resent" },
                { status: 400 }
            );
        }

        const { data: eventMeta, error: eventMetaError } = await supabase
            .from("Event")
            .select("id, title, Organization(name)")
            .eq("id", id)
            .single();

        if (eventMetaError || !eventMeta) {
            return NextResponse.json(
                { success: false, error: "Failed to load event details" },
                { status: 500 }
            );
        }

        const { data: settingsRow } = await supabase
            .from("EventWaitlistSettings")
            .select("expiry_days")
            .eq("event_id", id)
            .maybeSingle();

        const expiryDays = Number(settingsRow?.expiry_days || 7);
        const inviteSentAt = new Date();
        const inviteExpiresAt = new Date(inviteSentAt.getTime() + expiryDays * 24 * 60 * 60 * 1000);
        const organizationName = getOrganizationName(eventMeta);
        const recipientEmail = String(existing.email || "").trim();

        if (!isValidEmail(recipientEmail)) {
            return NextResponse.json(
                { success: false, error: "Waitlist entry does not have a valid email" },
                { status: 400 }
            );
        }

        try {
            await sendEmail({
                to: recipientEmail,
                subject: `${action === "resend_invite" ? "Waitlist invitation reminder" : "Waitlist invitation"} — ${eventMeta.title}`,
                html: `
                  <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                    <p>Hi,</p>
                    <p>A slot may now be available for <strong>${eventMeta.title}</strong>.</p>
                    <p>Please complete your registration before <strong>${inviteExpiresAt.toLocaleString()}</strong>.</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">This invitation is from <strong>${organizationName}</strong>.</p>
                  </div>
                `,
            });
        } catch (emailError: any) {
            console.error("ManageWaitlist PATCH: invite email failed", emailError);
            return NextResponse.json(
                { success: false, error: emailError?.message || "Failed to send invite email" },
                { status: 500 }
            );
        }

        const { error } = await supabase
            .from("WaitlistEntry")
            .update({
                status: "invited",
                invite_sent_at: inviteSentAt.toISOString(),
                invite_expires_at: inviteExpiresAt.toISOString(),
            })
            .eq("id", entryId)
            .eq("event_id", id);

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: action === "resend_invite" ? "Invite resent" : "Invite sent",
            data: {
                inviteSentAt: inviteSentAt.toISOString(),
            },
        });
    } catch (e: any) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageWaitlist PATCH error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

