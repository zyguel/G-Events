import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';
import { sendEmail } from "@/lib/emailProvider";

type Action = "confirm" | "reject" | "update" | "refund_reassign";

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
        let updateData: any = {};

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

            const attendeeEmail = (registration as any).User?.email;
            if (attendeeEmail) {
                const attendeeName = (registration as any).User?.name || "Attendee";
                const oldTicketName = (registration as any).Ticket?.name || "Previous Ticket";
                const eventTitle = (eventData as any)?.title || "Event";
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

            return NextResponse.json({
                success: true,
                data: {
                    returnableAmount,
                    additionalAmountDue,
                    newTicketName: newTicket.name,
                },
            });
        } else {
            updateData.status = action === "confirm" ? "confirmed" : "rejected";
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

        // Revalidate relevant caches
        revalidatePath(`/admin/events/${id}/orders`);
        revalidatePath(`/admin/events/${id}/reports`);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageOrders PATCH error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
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

        return NextResponse.json({ success: true });
    } catch (e: any) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageOrders DELETE error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

