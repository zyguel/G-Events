import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from "@/lib/apiAuth";
import {
    ACTIVE_ORGANIZATION_COOKIE_NAME,
    SESSION_ROLE,
    SESSION_ROLE_COOKIE_NAME,
} from "@/lib/constants";
import { getCurrentUserActiveOrganization, parseOrganizationId } from "@/lib/auth/sessionRole";
import { newTicketToken } from "@/lib/ticketToken";
import { getPublicAppBaseUrl } from "@/lib/appBaseUrl";
import { buildEventSlug } from "@/lib/slug";
import { buildAndStoreTicketQrImage } from "@/lib/ticketQrStorage";
import { buildBreakoutEticketUrl, buildBreakoutTicketEmailHtml } from "@/lib/ticketEmail";
import { sendEmail } from "@/lib/emailProvider";

type BackfillBody = {
    dryRun?: boolean;
    resendEmails?: boolean;
    limit?: number;
};

function hasMissingToken(ticketToken: unknown): boolean {
    return typeof ticketToken !== "string" || ticketToken.trim().length === 0;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();

        const sessionRole = request.cookies.get(SESSION_ROLE_COOKIE_NAME)?.value;
        if (sessionRole !== SESSION_ROLE.ORGANIZER) {
            return NextResponse.json({ success: false, error: "Organizer access required" }, { status: 403 });
        }

        const preferredOrganizationId = parseOrganizationId(
            request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
        );
        const orgContext = await getCurrentUserActiveOrganization(preferredOrganizationId);
        if (!orgContext.activeOrganizationId) {
            return NextResponse.json({ success: false, error: "No active organization context" }, { status: 403 });
        }

        const { eventId } = await params;
        const numericEventId = Number.parseInt(eventId, 10);
        if (Number.isNaN(numericEventId)) {
            return NextResponse.json({ success: false, error: "Invalid eventId" }, { status: 400 });
        }

        const body = (await request.json().catch(() => ({}))) as BackfillBody;
        const dryRun = body?.dryRun === true;
        const resendEmails = body?.resendEmails === true;
        const requestedLimit = Number.isFinite(Number(body?.limit)) ? Number(body?.limit) : 200;
        const limit = Math.min(Math.max(1, requestedLimit), 1000);

        const admin = await createAdminClient();

        const { data: eventRow, error: eventError } = await admin
            .from("Event")
            .select("id, title, allow_breakout_sessions, organization_id")
            .eq("id", numericEventId)
            .eq("organization_id", orgContext.activeOrganizationId)
            .maybeSingle();

        if (eventError || !eventRow) {
            return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
        }

        if (!eventRow.allow_breakout_sessions) {
            return NextResponse.json(
                { success: false, error: "Breakouts are not enabled for this event" },
                { status: 409 }
            );
        }

        const { data: sessionRows, error: sessionError } = await admin
            .from("BreakoutSession")
            .select("id, name, room_name")
            .eq("event_id", numericEventId);

        if (sessionError) {
            return NextResponse.json({ success: false, error: sessionError.message }, { status: 500 });
        }

        const sessions = sessionRows || [];
        const sessionIds = sessions.map((row: any) => Number(row.id)).filter((id: number) => Number.isFinite(id));

        if (sessionIds.length === 0) {
            return NextResponse.json({
                success: true,
                eventId: numericEventId,
                dryRun,
                resendEmails,
                totalCandidates: 0,
                processed: 0,
                updated: 0,
                emailed: 0,
                skipped: 0,
                failures: [],
                message: "No breakout sessions found for event",
            });
        }

        const { data: breakoutRegRows, error: breakoutRegError } = await admin
            .from("BreakoutSessionRegistration")
            .select("id, registration_id, breakout_session_id, ticket_token")
            .in("breakout_session_id", sessionIds)
            .limit(limit);

        if (breakoutRegError) {
            return NextResponse.json({ success: false, error: breakoutRegError.message }, { status: 500 });
        }

        const candidates = (breakoutRegRows || []).filter((row: any) => hasMissingToken(row.ticket_token));
        const registrationIds = candidates
            .map((row: any) => Number(row.registration_id))
            .filter((id: number) => Number.isFinite(id));

        if (registrationIds.length === 0) {
            return NextResponse.json({
                success: true,
                eventId: numericEventId,
                dryRun,
                resendEmails,
                totalCandidates: 0,
                processed: 0,
                updated: 0,
                emailed: 0,
                skipped: 0,
                failures: [],
                message: "No missing breakout ticket tokens found",
            });
        }

        const { data: registrationRows, error: registrationError } = await admin
            .from("Registration")
            .select("id, user_id, status, profile_pending")
            .in("id", registrationIds);

        if (registrationError) {
            return NextResponse.json({ success: false, error: registrationError.message }, { status: 500 });
        }

        const registrations = registrationRows || [];
        const registrationById = new Map<number, any>(
            registrations.map((row: any) => [Number(row.id), row])
        );

        const userIds = Array.from(
            new Set(
                registrations
                    .map((row: any) => Number(row.user_id))
                    .filter((id: number) => Number.isFinite(id))
            )
        );

        let userById = new Map<number, any>();
        if (userIds.length > 0) {
            const { data: userRows, error: userError } = await admin
                .from("User")
                .select("id, name, email")
                .in("id", userIds);

            if (userError) {
                return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
            }

            userById = new Map<number, any>((userRows || []).map((row: any) => [Number(row.id), row]));
        }

        const sessionById = new Map<number, any>(sessions.map((row: any) => [Number(row.id), row]));

        const failures: Array<{ breakoutSessionRegistrationId: number; reason: string }> = [];
        let updated = 0;
        let emailed = 0;
        let skipped = 0;

        const baseUrl = resendEmails ? getPublicAppBaseUrl(request) : "";
        const eventSlug = resendEmails ? buildEventSlug(eventRow.title, numericEventId) : "";

        for (const row of candidates) {
            const breakoutSessionRegistrationId = Number((row as any).id);
            const registrationId = Number((row as any).registration_id);
            const breakoutSessionId = Number((row as any).breakout_session_id);

            const registration = registrationById.get(registrationId);
            const status = String(registration?.status || "").toLowerCase();
            if (!registration || status === "cancelled" || status === "rejected") {
                skipped += 1;
                failures.push({
                    breakoutSessionRegistrationId,
                    reason: "Skipped inactive or missing registration",
                });
                continue;
            }

            const token = newTicketToken();

            if (!dryRun) {
                const { error: updateError } = await admin
                    .from("BreakoutSessionRegistration")
                    .update({ ticket_token: token })
                    .eq("id", breakoutSessionRegistrationId);

                if (updateError) {
                    failures.push({
                        breakoutSessionRegistrationId,
                        reason: updateError.message,
                    });
                    continue;
                }

                await admin
                    .from("Registration")
                    .update({ has_breakout_session_registration: true })
                    .eq("id", registrationId);
            }

            updated += 1;

            if (resendEmails && !dryRun) {
                const userRow = userById.get(Number(registration.user_id));
                const sessionRow = sessionById.get(breakoutSessionId);
                const recipientEmail = String(userRow?.email || "").trim();
                if (!recipientEmail) {
                    skipped += 1;
                    failures.push({
                        breakoutSessionRegistrationId,
                        reason: "Token updated but user email missing; email not sent",
                    });
                    continue;
                }

                const attendeeName =
                    [userRow?.name, recipientEmail].find(
                        (value) => typeof value === "string" && value.trim().length > 0
                    ) || "Attendee";

                const breakoutUrl = buildBreakoutEticketUrl(baseUrl, eventSlug, token);
                let breakoutQrImageUrl = "";

                try {
                    breakoutQrImageUrl = await buildAndStoreTicketQrImage({
                        supabase: admin,
                        ticketUrl: breakoutUrl,
                        folder: `event-${numericEventId}/breakouts`,
                    });
                } catch (qrError) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(
                            "Breakout backfill: QR image generation failed; sending link-only breakout email.",
                            qrError
                        );
                    }
                }

                try {
                    await sendEmail({
                        to: recipientEmail,
                        subject: `Breakout ticket - ${sessionRow?.name || eventRow.title}`,
                        html: buildBreakoutTicketEmailHtml({
                            attendeeName: String(attendeeName),
                            eventTitle: eventRow.title,
                            sessionTitle: String(sessionRow?.name || "Breakout session"),
                            sessionLocation: sessionRow?.room_name || undefined,
                            qrImageUrl: breakoutQrImageUrl || undefined,
                            ticketUrl: breakoutUrl,
                        }),
                    });

                    emailed += 1;
                } catch (emailError: any) {
                    failures.push({
                        breakoutSessionRegistrationId,
                        reason: `Token updated but email failed: ${emailError?.message || "unknown error"}`,
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            eventId: numericEventId,
            dryRun,
            resendEmails,
            totalCandidates: candidates.length,
            processed: candidates.length,
            updated,
            emailed,
            skipped,
            failures,
        });
    } catch (error: any) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        if (process.env.NODE_ENV === 'development') {
            console.error("Breakout ticket token backfill failed", error);
        }
        return NextResponse.json(
            { success: false, error: error?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}
