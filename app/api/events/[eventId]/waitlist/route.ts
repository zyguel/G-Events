import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { sendEmail } from "@/lib/emailProvider";
import { getPublicAppBaseUrl } from '@/lib/appBaseUrl';
import { buildEventSlug } from '@/lib/slug';
import { generateWaitlistInviteToken } from '@/lib/waitlistInviteToken';

type UiStatus = "Invited" | "Waiting" | "Rejected";

const mapStatusToUi = (s: string | null): UiStatus => {
    if (!s) return "Waiting";
    const normalized = s.toLowerCase();
    if (normalized === "invited") return "Invited";
    if (normalized === "rejected") return "Rejected";
    return "Waiting";
};

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getOrganizationName = (eventRow: any): string => {
    return String(eventRow?.Organization?.name || "G-Events Organization");
};

const toSafeNonNegativeInt = (value: unknown): number => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.trunc(n));
};

async function adjustTicketReservation(
    supabase: any,
    ticketId: number,
    delta: { reserved: number; available: number },
    maxRetries = 3
): Promise<{ success: boolean; error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { data: ticketRow, error: ticketError } = await supabase
            .from("Ticket")
            .select("id, available_quantity, waitlist_reserved_quantity, updated_at")
            .eq("id", ticketId)
            .single();

        if (ticketError || !ticketRow) {
            return { success: false, error: ticketError?.message || "Ticket not found" };
        }

        const nextReserved = Math.max(
            0,
            toSafeNonNegativeInt(ticketRow.waitlist_reserved_quantity) + delta.reserved
        );
        const nextAvailable = Math.max(
            0,
            toSafeNonNegativeInt(ticketRow.available_quantity) + delta.available
        );

        // Use updated_at as an optimistic lock - if it changed, another process updated the row
        const { error: updateError } = await supabase
            .from("Ticket")
            .update({
                waitlist_reserved_quantity: nextReserved,
                available_quantity: nextAvailable,
            })
            .eq("id", ticketId)
            .eq("updated_at", ticketRow.updated_at);

        if (!updateError) {
            return { success: true };
        }

        // If it's the last attempt, return the error
        if (attempt === maxRetries - 1) {
            return { success: false, error: updateError.message };
        }

        // Exponential backoff before retry: 100ms, 200ms, 400ms
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }

    return { success: false, error: "Max retries exceeded for ticket reservation" };
}

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

        const { data: userRow, error: userLookupError } = await supabase
            .from("User")
            .select("id")
            .ilike("email", email)
            .maybeSingle();

        if (userLookupError) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Waitlist POST: User lookup failed", userLookupError);
            }
            return NextResponse.json(
                { success: false, error: "Failed to verify user. Please try again." },
                { status: 500 }
            );
        }

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

        const { data: activeRegistration, error: activeRegError } = await supabase
            .from("Registration")
            .select("id")
            .eq("event_id", id)
            .eq("user_id", Number(userRow.id))
            .not("status", "in", "(cancelled,rejected)")
            .limit(1)
            .maybeSingle();

        if (activeRegError) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Waitlist POST: Failed to check existing registration", activeRegError);
            }
            return NextResponse.json(
                { success: false, error: "Failed to verify registration status. Please try again." },
                { status: 500 }
            );
        }

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

        let emailWarning = false;
        try {
            const organizationName = getOrganizationName(eventRow);
            await sendEmail({
                to: email,
                subject: `Waitlist confirmation - ${eventRow.title}`,
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
            if (process.env.NODE_ENV === 'development') {
                console.error("Waitlist POST: email send failed", mailError);
            }
            emailWarning = true;
        }

        return NextResponse.json({
            success: true,
            warning: emailWarning ? "Confirmation email could not be sent, but you are on the waitlist." : undefined,
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

        return NextResponse.json({ success: true, data: entries });
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



        if (action !== "invite" && action !== "resend_invite" && action !== "reject" && action !== "delete") {
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

        if (action === "reject" && currentStatus === "rejected") {
            return NextResponse.json(
                { success: true, message: "Entry already rejected" }
            );
        }

        if (action === "delete") {
            if (currentStatus !== "rejected") {
                return NextResponse.json(
                    { success: false, error: "Only rejected entries can be deleted" },
                    { status: 400 }
                );
            }

            const { error: deleteError } = await supabase
                .from("WaitlistEntry")
                .delete()
                .eq("id", entryId)
                .eq("event_id", id);

            if (deleteError) {
                return NextResponse.json(
                    { success: false, error: deleteError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "Rejected entry deleted",
            });
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

        const organizationName = getOrganizationName(eventMeta);
        const recipientEmail = String(existing.email || "").trim();

        if (!isValidEmail(recipientEmail)) {
            return NextResponse.json(
                { success: false, error: "Waitlist entry does not have a valid email" },
                { status: 400 }
            );
        }

        if (action === "reject") {
            const reason = String(body?.reason || "").trim();
            if (!reason) {
                return NextResponse.json(
                    { success: false, error: "Rejection reason is required" },
                    { status: 400 }
                );
            }

            const ticketIdForReservation = existing.ticket_id === null ? null : Number(existing.ticket_id);
            const shouldReleaseReservedSlot = currentStatus === "invited" && !!ticketIdForReservation && !Number.isNaN(ticketIdForReservation);

            if (shouldReleaseReservedSlot && ticketIdForReservation) {
                const releaseResult = await adjustTicketReservation(supabase, ticketIdForReservation, {
                    reserved: -1,
                    available: -1,
                });

                if (!releaseResult.success) {
                    return NextResponse.json(
                        { success: false, error: releaseResult.error || "Failed to release reserved waitlist slot" },
                        { status: 500 }
                    );
                }
            }

            const { error: rejectError } = await supabase
                .from("WaitlistEntry")
                .update({
                    status: "rejected",
                    invite_sent_at: null,
                    invite_expires_at: null,
                })
                .eq("id", entryId)
                .eq("event_id", id);

            if (rejectError) {
                if (shouldReleaseReservedSlot && ticketIdForReservation) {
                    await adjustTicketReservation(supabase, ticketIdForReservation, {
                        reserved: 1,
                        available: 1,
                    });
                }

                return NextResponse.json(
                    { success: false, error: rejectError.message },
                    { status: 500 }
                );
            }

            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: `Waitlist update - ${eventMeta.title}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                        <p>Hi,</p>
                        <p>Your waitlist request for <strong>${eventMeta.title}</strong> was not approved.</p>
                        <p><strong>Reason:</strong> ${reason}</p>
                        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">This message is from <strong>${organizationName}</strong>.</p>
                      </div>
                    `,
                });
            } catch (emailError: any) {
                console.error("ManageWaitlist PATCH: rejection email failed", emailError);
            }

            return NextResponse.json({
                success: true,
                message: "Entry rejected",
            });
        }

        const expiryDays = 3;
        const inviteSentAt = new Date();
        const inviteExpiresAt = new Date(inviteSentAt.getTime() + expiryDays * 24 * 60 * 60 * 1000);
        const baseUrl = getPublicAppBaseUrl(request);
        const eventSlug = buildEventSlug(String(eventMeta.title || 'event'), id);
        const inviteToken = generateWaitlistInviteToken({
            eventId: id,
            waitlistEntryId: entryId,
            email: recipientEmail,
            ticketId: existing.ticket_id ?? null,
            expiresAt: inviteExpiresAt,
        });
        const orderFormInviteUrl = `${baseUrl}/events/${eventSlug}/register?waitlistInvite=${encodeURIComponent(inviteToken)}`;

        try {
            await sendEmail({
                to: recipientEmail,
                subject: `${action === "resend_invite" ? "Waitlist invitation reminder" : "Waitlist invitation"} - ${eventMeta.title}`,
                html: `
                  <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                    <p>Hi,</p>
                    <p>A slot may now be available for <strong>${eventMeta.title}</strong>.</p>
                                        <p>Please complete your registration before <strong>${inviteExpiresAt.toLocaleString()}</strong>.</p>
                                        <p>
                                            <a href="${orderFormInviteUrl}" style="display:inline-block; margin-top: 8px; padding: 10px 14px; border-radius: 8px; text-decoration: none; background: #3D518C; color: #ffffff; font-weight: 600;">
                                                Complete Registration (Exclusive Link)
                                            </a>
                                        </p>
                                        <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, use this link: <a href="${orderFormInviteUrl}">${orderFormInviteUrl}</a></p>
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

        const shouldReserveSlot = action === "invite" && currentStatus !== "invited";
        const ticketIdForReservation = existing.ticket_id === null ? null : Number(existing.ticket_id);

        if (shouldReserveSlot && ticketIdForReservation && !Number.isNaN(ticketIdForReservation)) {
            const reserveResult = await adjustTicketReservation(supabase, ticketIdForReservation, {
                reserved: 1,
                available: 1,
            });

            if (!reserveResult.success) {
                return NextResponse.json(
                    { success: false, error: reserveResult.error || "Failed to reserve waitlist slot" },
                    { status: 500 }
                );
            }
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
            if (shouldReserveSlot && ticketIdForReservation && !Number.isNaN(ticketIdForReservation)) {
                await adjustTicketReservation(supabase, ticketIdForReservation, {
                    reserved: -1,
                    available: -1,
                });
            }

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

