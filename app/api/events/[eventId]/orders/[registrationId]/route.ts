import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireUser } from '@/lib/apiAuth';

type Action = "confirm" | "reject";

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

        if (!action || !["confirm", "reject"].includes(action)) {
            return NextResponse.json(
                { success: false, error: "Invalid or missing action" },
                { status: 400 }
            );
        }

        const newStatus = action === "confirm" ? "confirmed" : "rejected";

        const supabase = await createClient();
        const { error } = await supabase
            .from("Registration")
            .update({ status: newStatus })
            .eq("id", regId)
            .eq("event_id", id);

        if (error) {
            console.error("ManageOrders PATCH: update failed", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Revalidate orders + reports that depend on registration status
        revalidatePath(`/events/${id}/orders`);
        revalidatePath(`/events/${id}/reports`);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("ManageOrders PATCH error:", e);
        return NextResponse.json(
            { success: false, error: e?.message || "Unexpected error" },
            { status: 500 }
        );
    }
}

