import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import { revalidatePath } from "next/cache";
import { getPublicAppBaseUrl } from "@/lib/appBaseUrl";
import { buildEventSlug } from "@/lib/slug";
import { newTicketToken } from "@/lib/ticketToken";
import { buildAndStoreTicketQrImage } from "@/lib/ticketQrStorage";
import { buildBreakoutEticketUrl, buildBreakoutTicketEmailHtml } from "@/lib/ticketEmail";
import { sendEmail } from "@/lib/emailProvider";

function parseDescription(raw: unknown): Record<string, unknown> {
    if (!raw) return {};
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
        return {};
    }
}



export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const user = await requireUser();
        const { eventId } = await params;
        const eventNumericId = parseInt(eventId, 10);

        if (isNaN(eventNumericId)) {
            return NextResponse.json({ success: false, error: "Invalid eventId" }, { status: 400 });
        }

        const body = await request.json().catch(() => null);
        if (!body || !body.action || !body.sessionId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const breakoutId = parseInt(body.sessionId, 10);
        if (isNaN(breakoutId)) {
            return NextResponse.json({ success: false, error: "Invalid sessionId" }, { status: 400 });
        }

        if (!user.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const admin = await createAdminClient();

        const { data: eventRow, error: eventError } = await admin
            .from("Event")
            .select("id, title, allow_breakout_sessions, is_published, is_visible")
            .eq("id", eventNumericId)
            .maybeSingle();

        if (eventError || !eventRow?.is_published || !eventRow?.is_visible) {
            return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
        }

        if (!eventRow.allow_breakout_sessions) {
            return NextResponse.json({ success: false, error: "Breakouts are not enabled for this event" }, { status: 403 });
        }

        // Get user ID
        const { data: userRow } = await admin
            .from("User")
            .select("id, name, email")
            .ilike("email", user.email)
            .limit(1)
            .maybeSingle();
        if (!userRow) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Get Event Registration ID
        const { data: reg } = await admin
            .from("Registration")
            .select("id, status, profile_pending")
            .eq("event_id", eventNumericId)
            .eq("user_id", userRow.id)
            .maybeSingle();

        if (!reg) {
            return NextResponse.json({ success: false, error: "You are not registered for this event." }, { status: 403 });
        }

        const registrationStatus = String(reg.status || "").toLowerCase();
        if (registrationStatus === "cancelled" || registrationStatus === "rejected") {
            return NextResponse.json({ success: false, error: "Registration is not active" }, { status: 403 });
        }

        if (registrationStatus !== "confirmed") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Your registration is pending organizer approval. You can join breakout sessions once approved.",
                },
                { status: 403 }
            );
        }

        if (reg.profile_pending === true) {
            return NextResponse.json(
                { success: false, error: "Finish your registration details before choosing a breakout" },
                { status: 403 }
            );
        }

        const registrationId = reg.id;

        if (body.action === 'join') {
            // Check Capacity and Overlaps
            
            // 1. Get Target Session
            const { data: targetSession, error: targetError } = await admin
                .from('BreakoutSession')
                .select('id, name, description, room_name, room_capacity, BreakoutSessionRegistration(registration_id)')
                .eq('id', breakoutId)
                .eq('event_id', eventNumericId)
                .maybeSingle();
                
            if (targetError || !targetSession) {
                return NextResponse.json({ success: false, error: "Breakout session not found" }, { status: 404 });
            }

            const currentAttendees = Array.isArray(targetSession.BreakoutSessionRegistration) 
                                     ? targetSession.BreakoutSessionRegistration.length : 0;
            const alreadyJoinedThisSession = Array.isArray(targetSession.BreakoutSessionRegistration)
                ? targetSession.BreakoutSessionRegistration.some((r: { registration_id: number }) => r.registration_id === registrationId)
                : false;

            if (targetSession.room_capacity > 0 && currentAttendees >= targetSession.room_capacity && !alreadyJoinedThisSession) {
                return NextResponse.json({ success: false, error: "This breakout session is full." }, { status: 409 });
            }

            const targetMeta = parseDescription(targetSession.description);
            const breakoutStatus = String(targetMeta.status || "").toLowerCase();
            if (breakoutStatus === "completed" || breakoutStatus === "cancelled") {
                return NextResponse.json({ success: false, error: "This session is not available." }, { status: 409 });
            }

            // 2. Enforce 1 Session Maximum
            const { data: userRegistrations } = await admin
                .from('BreakoutSessionRegistration')
                .select(`
                    breakout_session_id,
                    BreakoutSession (
                        id,
                        description
                    )
                `)
                .eq('registration_id', registrationId);

            if (userRegistrations && userRegistrations.length > 0) {
                const alreadyJoined = userRegistrations.some(r => r.breakout_session_id !== breakoutId);
                if (alreadyJoined) {
                    return NextResponse.json({ success: false, error: "You can only join 1 breakout session for this event." }, { status: 409 });
                }
            }

            const breakoutTicketToken = newTicketToken();
            const payload = {
                breakout_session_id: breakoutId,
                registration_id: registrationId,
                ticket_token: breakoutTicketToken,
            };

            const { error: upsertError } = await admin
                .from("BreakoutSessionRegistration")
                .upsert(payload, { onConflict: "registration_id" });

            if (upsertError) {
                await admin.from("BreakoutSessionRegistration").delete().eq("registration_id", registrationId);
                const { error: insertError } = await admin.from("BreakoutSessionRegistration").insert(payload);
                if (insertError) {
                    throw insertError;
                }
            }

            // Sync Registration table
            await admin.from('Registration')
                .update({ has_breakout_session_registration: true })
                .eq('id', registrationId);

            const attendeeName =
                [userRow.name, userRow.email].find((value) => typeof value === "string" && value.trim().length > 0) || "Attendee";

            try {
                const baseUrl = getPublicAppBaseUrl(request);
                const slug = buildEventSlug(eventRow.title, eventNumericId);
                const breakoutUrl = buildBreakoutEticketUrl(baseUrl, slug, breakoutTicketToken);
                let breakoutQrImageUrl = "";

                try {
                    breakoutQrImageUrl = await buildAndStoreTicketQrImage({
                        supabase: admin,
                        ticketUrl: breakoutUrl,
                        folder: `event-${eventNumericId}/breakouts`,
                    });
                } catch (breakoutQrError) {
                    console.warn("Breakout QR image generation failed; sending link-only breakout ticket email.", breakoutQrError);
                }

                await sendEmail({
                    to: user.email,
                    subject: `Breakout ticket - ${targetSession.name || eventRow.title}`,
                    html: buildBreakoutTicketEmailHtml({
                        attendeeName: String(attendeeName),
                        eventTitle: eventRow.title,
                        sessionTitle: targetSession.name || "Breakout session",
                        sessionLocation: targetSession.room_name || undefined,
                        qrImageUrl: breakoutQrImageUrl || undefined,
                        ticketUrl: breakoutUrl,
                    }),
                });
            } catch (mailError) {
                console.warn("MyBreakouts: breakout ticket email failed", mailError);
            }

        } else if (body.action === 'leave') {
            const { error: deleteError } = await admin.from('BreakoutSessionRegistration')
                .delete()
                .eq('registration_id', registrationId)
                .eq('breakout_session_id', breakoutId);
            
            if (deleteError) throw deleteError;

            // Sync Registration table
            await admin.from('Registration')
                .update({ has_breakout_session_registration: false })
                .eq('id', registrationId);
        } else {
            return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }

        revalidatePath(`/events/${eventId}/my-breakouts`);
        return NextResponse.json({ success: true });

    } catch (e: unknown) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;
        console.error("MyBreakouts API error:", e);
        const errorMessage = e instanceof Error ? e.message : "Unexpected error";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
