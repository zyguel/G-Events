import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { sendEmail } from "@/lib/emailProvider";
import { getPublicAppBaseUrl } from "@/lib/appBaseUrl";
import { buildEventSlug } from "@/lib/slug";
import { buildAndStoreTicketQrImage } from "@/lib/ticketQrStorage";
import { buildBreakoutEticketUrl, buildBreakoutTicketEmailHtml, buildEticketUrl } from "@/lib/ticketEmail";
import {
    buildTicketQrBlock,
    ensureQrBlockInBody,
    loadOrderConfirmationSettings,
    renderOrderConfirmationTemplate,
    wrapEmailBody,
} from "@/lib/orderConfirmationSettings";
import { newTicketToken } from "@/lib/ticketToken";
import { invalidateEventOrdersCache } from "@/lib/eventOrdersCache";

type Action = "confirm" | "reject" | "update" | "refund_reassign";

type UserContact = {
    name?: string | null;
    email?: string | null;
};

type TicketSummary = {
    name?: string | null;
};

type MaybeRelation<T> = T | T[] | null | undefined;

type RegistrationWithUserTicket = {
    id: number;
    event_id?: number;
    ticket_id?: number | null;
    final_price_paid?: number | null;
    status?: string | null;
    ticket_token?: string | null;
    User?: MaybeRelation<UserContact>;
    Ticket?: MaybeRelation<TicketSummary>;
};

type EventTitleRow = {
    title?: string | null;
};

type RegistrationUpdateData = {
    ticket_id?: number;
    final_price_paid?: number;
    status?: "confirmed" | "rejected";
    ticket_token?: string;
};

const pickSingle = <T>(value: MaybeRelation<T>): T | null => {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return "Unexpected error";
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; registrationId: string }> }
) {
    try {
        await requireUser();
        const { eventId, registrationId } = await params;
        const id = parseInt(eventId, 10);
        const regId = parseInt(registrationId, 10);

        if (isNaN(id) || isNaN(regId)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId or registrationId" },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const action: Action | undefined = body?.action;

        if (!action || !["confirm", "reject", "update", "refund_reassign"].includes(action)) {
            return NextResponse.json(
                { success: false, error: "Invalid or missing action" },
                { status: 400 }
            );
        }

        const supabase = await createAdminClient();
        const updateData: RegistrationUpdateData = {};
        let registrationForNotification: RegistrationWithUserTicket | null = null;
        let eventTitle = "Event";

        if (action === "update") {
            const { ticketId } = body;
            if (ticketId) {
                const parsedTicketId = parseInt(ticketId, 10);
                const { data: targetTicket, error: targetTicketError } = await supabase
                    .from("Ticket")
                    .select("id, is_deleted")
                    .eq("id", parsedTicketId)
                    .single();

                if (targetTicketError || !targetTicket || targetTicket.is_deleted) {
                    return NextResponse.json(
                        { success: false, error: "Cannot assign a deleted ticket" },
                        { status: 400 }
                    );
                }

                updateData.ticket_id = parsedTicketId;
            }
            
            if (Object.keys(updateData).length === 0) {
                return NextResponse.json(
                    { success: false, error: "No update data provided" },
                    { status: 400 }
                );
            }
        } else if (action === "refund_reassign") {
            const { ticketId } = body;
            const newTicketId = parseInt(ticketId, 10);

            if (isNaN(newTicketId)) {
                return NextResponse.json(
                    { success: false, error: "Valid new ticket is required" },
                    { status: 400 }
                );
            }

            const { data: registration, error: registrationError } = await supabase
                .from("Registration")
                .select("id, event_id, ticket_id, final_price_paid, User(name, email), Ticket(name)")
                .eq("id", regId)
                .eq("event_id", id)
                .single();

            if (registrationError || !registration) {
                return NextResponse.json(
                    { success: false, error: "Registration not found" },
                    { status: 404 }
                );
            }

            const typedRegistration = registration as RegistrationWithUserTicket;

            const { data: eventData } = await supabase
                .from("Event")
                .select("title")
                .eq("id", id)
                .single();

            const { data: newTicket, error: newTicketError } = await supabase
                .from("Ticket")
                .select("id, name, price, is_deleted")
                .eq("id", newTicketId)
                .single();

            if (newTicketError || !newTicket || newTicket.is_deleted) {
                return NextResponse.json(
                    { success: false, error: "Selected replacement ticket is unavailable" },
                    { status: 400 }
                );
            }

            const previousAmountPaid = Number(registration.final_price_paid || 0);
            const newTicketPrice = Number(newTicket.price || 0);
            const returnableAmount = Math.max(previousAmountPaid - newTicketPrice, 0);
            const additionalAmountDue = Math.max(newTicketPrice - previousAmountPaid, 0);

            const { error: refundUpdateError } = await supabase
                .from("Registration")
                .update({
                    ticket_id: newTicketId,
                    final_price_paid: newTicketPrice,
                })
                .eq("id", regId)
                .eq("event_id", id);

            if (refundUpdateError) {
                return NextResponse.json(
                    { success: false, error: refundUpdateError.message },
                    { status: 500 }
                );
            }

                        const registrationUser = pickSingle(typedRegistration.User);
                        const registrationTicket = pickSingle(typedRegistration.Ticket);
                        const attendeeEmail = registrationUser?.email || null;
            if (attendeeEmail) {
                                const attendeeName = registrationUser?.name || "Attendee";
                                const oldTicketName = registrationTicket?.name || "Previous Ticket";
                                const eventTitle = ((eventData as EventTitleRow | null)?.title || "Event");
                const html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
                    <h2 style="margin: 0 0 12px;">Ticket Update Notice</h2>
                    <p>Hello ${attendeeName},</p>
                    <p>Your ticket for <strong>${eventTitle}</strong> has been updated by the organizer.</p>
                    <ul>
                      <li>Previous Ticket: <strong>${oldTicketName}</strong></li>
                      <li>New Ticket: <strong>${newTicket.name}</strong></li>
                      <li>Previous Paid Amount: <strong>PHP ${previousAmountPaid.toFixed(2)}</strong></li>
                      <li>New Ticket Cost: <strong>PHP ${newTicketPrice.toFixed(2)}</strong></li>
                      <li>Returnable Amount: <strong>PHP ${returnableAmount.toFixed(2)}</strong></li>
                      <li>Additional Amount Due: <strong>PHP ${additionalAmountDue.toFixed(2)}</strong></li>
                    </ul>
                    <p>Please contact the organizer if you have questions about the adjustment.</p>
                  </div>
                `;

                await sendEmail({
                    to: attendeeEmail,
                    subject: `Ticket updated for ${eventTitle}`,
                    html,
                });
            }

            revalidatePath(`/admin/events/${id}/orders`);
            revalidatePath(`/admin/events/${id}/reports`);
            invalidateEventOrdersCache(id);

            return NextResponse.json({
                success: true,
                data: {
                    returnableAmount,
                    additionalAmountDue,
                    newTicketName: newTicket.name,
                },
            });
        } else {
            const { data: registration, error: registrationError } = await supabase
                .from("Registration")
                .select("id, status, ticket_token, User(name, email), Ticket(name)")
                .eq("id", regId)
                .eq("event_id", id)
                .single();

            if (registrationError || !registration) {
                return NextResponse.json(
                    { success: false, error: "Registration not found" },
                    { status: 404 }
                );
            }

            registrationForNotification = registration as RegistrationWithUserTicket;

            const { data: eventData } = await supabase
                .from("Event")
                .select("title")
                .eq("id", id)
                .single();

            eventTitle = ((eventData as EventTitleRow | null)?.title || "Event");
            updateData.status = action === "confirm" ? "confirmed" : "rejected";

            if (action === "confirm" && !registrationForNotification.ticket_token) {
                updateData.ticket_token = newTicketToken();
            }
        }

        const { error } = await supabase
            .from("Registration")
            .update(updateData)
            .eq("id", regId)
            .eq("event_id", id);

        if (error) {
            console.error("ManageOrders PATCH: update failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        if ((action === "confirm" || action === "reject") && registrationForNotification) {
            try {
                const notificationUser = pickSingle(registrationForNotification.User);
                const notificationTicket = pickSingle(registrationForNotification.Ticket);
                const attendeeEmail = notificationUser?.email;
                if (attendeeEmail) {
                    const attendeeName = notificationUser?.name || "Attendee";
                    const ticketName = notificationTicket?.name || "General Admission";
                    const ticketToken = updateData.ticket_token || registrationForNotification.ticket_token || "";
                    const settings = await loadOrderConfirmationSettings(supabase, id);

                    if (action === "confirm") {
                        const baseUrl = getPublicAppBaseUrl(request);
                        const slug = buildEventSlug(eventTitle, id);

                        let ticketUrl = "";
                        let qrImageUrl = "";
                        if (ticketToken) {
                            ticketUrl = buildEticketUrl(baseUrl, slug, ticketToken);
                            qrImageUrl = await buildAndStoreTicketQrImage({
                                supabase,
                                ticketUrl,
                                folder: `event-${id}`,
                            });
                        }

                        const qrBlock =
                            qrImageUrl && ticketUrl
                                ? buildTicketQrBlock({ qrImageUrl, ticketUrl })
                                : "";

                        const confirmationTemplate = renderOrderConfirmationTemplate({
                            template: settings.confirmationEmail,
                            fallback: {
                                subject: `Registration confirmed - ${eventTitle}`,
                                body: `<p>Hi ${attendeeName}, your registration for <strong>${eventTitle}</strong> is now confirmed.</p>`,
                            },
                            context: {
                                attendeeName,
                                attendee_name: attendeeName,
                                eventTitle,
                                event_title: eventTitle,
                                ticketName,
                                ticket_name: ticketName,
                                registrationId: regId,
                                registration_id: regId,
                                ticketUrl,
                                ticket_url: ticketUrl,
                                qrImageUrl,
                                qr_image_url: qrImageUrl,
                                qrBlock,
                                qr_block: qrBlock,
                            },
                        });

                        const confirmationBody = qrBlock
                            ? ensureQrBlockInBody(confirmationTemplate.body, qrBlock)
                            : confirmationTemplate.body;

                        await sendEmail({
                            to: attendeeEmail,
                            subject: confirmationTemplate.subject,
                            html: wrapEmailBody(confirmationBody),
                        });

                        const { data: breakoutRegistration } = await supabase
                            .from("BreakoutSessionRegistration")
                            .select("ticket_token, breakout_session_id")
                            .eq("registration_id", regId)
                            .limit(1)
                            .maybeSingle();

                        if (breakoutRegistration?.ticket_token) {
                            const breakoutUrl = buildBreakoutEticketUrl(
                                baseUrl,
                                slug,
                                breakoutRegistration.ticket_token
                            );

                            let breakoutQrImageUrl = "";
                            try {
                                breakoutQrImageUrl = await buildAndStoreTicketQrImage({
                                    supabase,
                                    ticketUrl: breakoutUrl,
                                    folder: `event-${id}/breakouts`,
                                });
                            } catch (breakoutQrError) {
                                console.warn("ManageOrders PATCH: breakout QR image generation failed", breakoutQrError);
                            }

                            let breakoutSessionTitle = "Breakout session";
                            let breakoutSessionLocation: string | undefined;
                            if (breakoutRegistration.breakout_session_id) {
                                const { data: breakoutSession } = await supabase
                                    .from("BreakoutSession")
                                    .select("name, room_name")
                                    .eq("id", breakoutRegistration.breakout_session_id)
                                    .eq("event_id", id)
                                    .maybeSingle();

                                if (breakoutSession?.name) {
                                    breakoutSessionTitle = breakoutSession.name;
                                }
                                if (breakoutSession?.room_name) {
                                    breakoutSessionLocation = breakoutSession.room_name;
                                }
                            }

                            await sendEmail({
                                to: attendeeEmail,
                                subject: `Breakout ticket - ${breakoutSessionTitle}`,
                                html: buildBreakoutTicketEmailHtml({
                                    attendeeName,
                                    eventTitle,
                                    sessionTitle: breakoutSessionTitle,
                                    sessionLocation: breakoutSessionLocation,
                                    qrImageUrl: breakoutQrImageUrl || undefined,
                                    ticketUrl: breakoutUrl,
                                }),
                            });
                        }
                    } else {
                        const rejectionTemplate = renderOrderConfirmationTemplate({
                            template: settings.rejectionEmail,
                            fallback: {
                                subject: `Registration update - ${eventTitle}`,
                                body: `<p>Hi ${attendeeName}, your registration for <strong>${eventTitle}</strong> was not approved.</p>`,
                            },
                            context: {
                                attendeeName,
                                attendee_name: attendeeName,
                                eventTitle,
                                event_title: eventTitle,
                                ticketName,
                                ticket_name: ticketName,
                                registrationId: regId,
                                registration_id: regId,
                            },
                        });

                        await sendEmail({
                            to: attendeeEmail,
                            subject: rejectionTemplate.subject,
                            html: wrapEmailBody(rejectionTemplate.body),
                        });
                    }
                }
            } catch (notificationError) {
                console.warn("ManageOrders PATCH: notification email failed", notificationError);
            }
        }

        // Revalidate relevant caches
        revalidatePath(`/admin/events/${id}/orders`);
        revalidatePath(`/admin/events/${id}/reports`);
        invalidateEventOrdersCache(id);

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageOrders PATCH error:", e);
        return NextResponse.json(
            { success: false, error: getErrorMessage(e) },
            { status: 500 }
        );
    }
}


export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string; registrationId: string }> }
) {
    try {
        await requireUser();
        const { eventId, registrationId } = await params;
        const id = parseInt(eventId, 10);
        const regId = parseInt(registrationId, 10);

        if (isNaN(id) || isNaN(regId)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId or registrationId" },
                { status: 400 }
            );
        }

        const supabase = await createAdminClient();

        // Remove breakout selections first to satisfy FK constraints on Registration delete.
        const { error: breakoutDeleteError } = await supabase
            .from("BreakoutSessionRegistration")
            .delete()
            .eq("registration_id", regId);

        if (breakoutDeleteError) {
            console.error("ManageOrders DELETE: breakout registration cleanup failed", breakoutDeleteError);
            return NextResponse.json(
                { success: false, error: breakoutDeleteError.message },
                { status: 500 }
            );
        }
        
        // Delete registration
        const { error } = await supabase
            .from("Registration")
            .delete()
            .eq("id", regId)
            .eq("event_id", id);

        if (error) {
            console.error("ManageOrders DELETE: deletion failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Revalidate relevant paths
        revalidatePath(`/admin/events/${id}/orders`);
        revalidatePath(`/admin/events/${id}/reports`);
        invalidateEventOrdersCache(id);

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageOrders DELETE error:", e);
        return NextResponse.json(
            { success: false, error: getErrorMessage(e) },
            { status: 500 }
        );
    }
}

