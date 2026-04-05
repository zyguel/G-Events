import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';

interface ManualRegistrationAttendee {
    name: string;
    email: string;
}

type UiStatus = "Confirmed" | "Pending" | "Rejected";

const mapStatusToUi = (s: string): UiStatus => {
    if (s === "confirmed") return "Confirmed";
    if (s === "rejected" || s === "cancelled") return "Rejected";
    return "Pending";
};

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

        const supabase = await createAdminClient();

        // 1. Fetch registrations for the event with joined User and Ticket
        const { data: regRows, error: regErr } = await supabase
            .from("Registration")
            .select(
                "id, status, created_at, registration_group_id, ticket_id, User(name, email), Ticket(name)"
            )
            .eq("event_id", id)
            .order("created_at", { ascending: false });

        if (regErr) {
            console.error("ManageOrders GET: registration query failed", regErr);
            return NextResponse.json(
                { success: false, error: regErr.message },
                { status: 500 }
            );
        }

        const registrations = regRows || [];
        const registrationIds = registrations.map((r: any) => r.id);

        if (registrationIds.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 2. Fetch add-on claims for these registrations
        const { data: addOnRows, error: addOnErr } = await supabase
            .from("AddOnClaim")
            .select("registration_id, is_claimed")
            .in("registration_id", registrationIds);

        if (addOnErr) {
            console.error("ManageOrders GET: add-on query failed", addOnErr);
        }

        const addOnByRegId = new Map<number, boolean>();
        (addOnRows || []).forEach((row: any) => {
            if (!row.registration_id) return;
            if (!addOnByRegId.has(row.registration_id)) {
                addOnByRegId.set(row.registration_id, !!row.is_claimed);
            } else if (row.is_claimed) {
                addOnByRegId.set(row.registration_id, true);
            }
        });

        // 3. Fetch payment proofs for these registrations
        const { data: paymentRows, error: paymentErr } = await supabase
            .from("PaymentProof")
            .select("registration_id, file_path")
            .in("registration_id", registrationIds);

        if (paymentErr) {
            console.error("ManageOrders GET: payment proof query failed", paymentErr);
        }

        const paymentByRegId = new Map<number, string>();
        (paymentRows || []).forEach((row: any) => {
            if (!row.registration_id || !row.file_path) return;
            if (!paymentByRegId.has(row.registration_id)) {
                paymentByRegId.set(row.registration_id, row.file_path);
            }
        });

        const groupIdToEmails = new Map<number, string[]>();
        for (const r of registrations) {
            const groupId = r.registration_group_id;
            if (groupId) {
                if (!groupIdToEmails.has(groupId)) {
                    groupIdToEmails.set(groupId, []);
                }
                const memberEmail = (r as any).User?.email;
                if (memberEmail) {
                    groupIdToEmails.get(groupId)!.push(memberEmail);
                }
            }
        }

        const formatterDate = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
        const formatterTime = new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });

        const orders = registrations.map((r: any) => {
            const createdAt = r.created_at ? new Date(r.created_at) : null;
            const isGroup = !!r.registration_group_id;
            const groupMemberEmails = isGroup
                ? groupIdToEmails.get(r.registration_group_id) || []
                : [];

            return {
                id: r.id.toString(),
                name: r.User?.name || "Unknown",
                email: r.User?.email || "",
                ticketId: r.ticket_id?.toString() || "",
                ticketType: r.Ticket?.name || "General Admission",
                registrationType: isGroup ? "Group" : "Individual",
                status: mapStatusToUi(r.status || ""),
                date: createdAt ? formatterDate.format(createdAt) : "",
                time: createdAt ? formatterTime.format(createdAt) : "",
                addOnStatus: addOnByRegId.get(r.id) ? "Claimed" : "Unclaimed",
                proofOfPayment: paymentByRegId.get(r.id) || null,
                groupMemberEmails,
            };
        });

        return NextResponse.json({ success: true, data: orders });
    } catch (e: any) {
        const authError = getAuthErrorResponse(e);
        if (authError) return authError;

        console.error("ManageOrders GET error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const numericEventId = parseInt(eventId, 10);
        
        const body = await request.json();
        const { registrationType, ticketId, attendees } = body as {
            registrationType: "Individual" | "Group";
            ticketId: string;
            attendees: ManualRegistrationAttendee[];
        };

        if (!registrationType || !ticketId || !attendees || attendees.length === 0) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // 1. Fetch Ticket details
        const { data: ticket, error: ticketErr } = await supabase
            .from("Ticket")
            .select("id, name, price")
            .eq("id", parseInt(ticketId, 10))
            .single();

        if (ticketErr || !ticket) {
            return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
        }

        // 2. Resolve Users and Validate they exist
        const emails = attendees.map(a => a.email.toLowerCase().trim());
        const { data: userRows, error: userErr } = await supabase
            .from("User")
            .select("id, email")
            .in("email", emails);

        if (userErr) {
            return NextResponse.json({ success: false, error: "Database error during user lookup" }, { status: 500 });
        }

        const foundEmails = new Set((userRows || []).map(u => u.email.toLowerCase()));
        const missingEmails = emails.filter(e => !foundEmails.has(e));

        if (missingEmails.length > 0) {
            return NextResponse.json({
                success: false,
                error: `The following email(s) are not registered: ${missingEmails.join(", ")}`
            }, { status: 400 });
        }

        const emailToUserId = new Map((userRows || []).map(u => [u.email.toLowerCase(), u.id]));

        // 3. Check for existing registrations for this event
        const userIds = Array.from(emailToUserId.values());
        const { data: existingRegs, error: checkErr } = await supabase
            .from("Registration")
            .select("user_id, User(email)")
            .eq("event_id", numericEventId)
            .in("user_id", userIds);

        if (checkErr) {
            return NextResponse.json({ success: false, error: "Database error during duplicate check" }, { status: 500 });
        }

        if (existingRegs && existingRegs.length > 0) {
            const duplicateEmails = existingRegs.map((r: any) => r.User?.email).filter(Boolean);
            return NextResponse.json({
                success: false,
                error: `User(s) already registered for this event: ${duplicateEmails.join(", ")}`
            }, { status: 400 });
        }

        // 3. Create RegistrationGroup if it's a group
        let groupId: number | null = null;
        if (registrationType === "Group") {
            const { data: group, error: groupErr } = await supabase
                .from("RegistrationGroup")
                .insert([{
                    event_id: numericEventId,
                    ticket_id: ticket.id
                }])
                .select("id")
                .single();

            if (groupErr) {
                return NextResponse.json({ success: false, error: "Failed to create registration group" }, { status: 500 });
            }
            groupId = group.id;
        }

        // 4. Create Registrations
        const now = new Date();
        const registrationsToInsert = attendees.map(a => ({
            event_id: numericEventId,
            user_id: emailToUserId.get(a.email.toLowerCase()),
            ticket_id: ticket.id,
            status: "pending",
            final_price_paid: ticket.price,
            registration_group_id: groupId,
            created_at: now.toISOString()
        }));

        const { data: newRegs, error: regErr } = await supabase
            .from("Registration")
            .insert(registrationsToInsert)
            .select("id, created_at, user_id, registration_group_id, User(name, email)");

        if (regErr) {
            console.error("Manual Registration Error:", regErr);
            return NextResponse.json({ success: false, error: "Failed to create registrations" }, { status: 500 });
        }

        // 5. Build response objects (similar to GET)
        const formatterDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
        const formatterTime = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

        const mappedNewOrders = (newRegs || []).map((r: any) => {
            const createdAt = new Date(r.created_at);
            return {
                id: r.id.toString(),
                name: r.User?.name || attendees.find(a => a.email.toLowerCase() === r.User?.email.toLowerCase())?.name || "Attendee",
                email: r.User?.email || "",
                ticketId: ticket.id.toString(),
                ticketType: ticket.name,
                registrationType,
                status: "Pending",
                date: formatterDate.format(createdAt),
                time: formatterTime.format(createdAt),
                addOnStatus: "Unclaimed",
                proofOfPayment: null,
                groupMemberEmails: emails
            };
        });

        return NextResponse.json({ success: true, data: mappedNewOrders });
    } catch (e: any) {
        console.error("POST Manual Orders Error:", e);
        return NextResponse.json({ success: false, error: e?.message || "Internal server error" }, { status: 500 });
    }
}
