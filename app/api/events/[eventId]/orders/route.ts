import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
        const { eventId } = await params;
        const id = parseInt(eventId, 10);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid eventId" },
                { status: 400 }
            );
        }

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

        // 4. Map into UI-friendly orders
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
            return {
                id: r.id.toString(),
                name: r.User?.name || "Unknown",
                email: r.User?.email || "",
                ticketType: r.Ticket?.name || "General Admission",
                registrationType: r.registration_group_id ? "Group" : "Individual",
                status: mapStatusToUi(r.status || ""),
                date: createdAt ? formatterDate.format(createdAt) : "",
                time: createdAt ? formatterTime.format(createdAt) : "",
                addOnStatus: addOnByRegId.get(r.id) ? "Claimed" : "Unclaimed",
                proofOfPayment: paymentByRegId.get(r.id) || null,
            };
        });

        return NextResponse.json({ success: true, data: orders });
    } catch (e: any) {
        console.error("ManageOrders GET error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

