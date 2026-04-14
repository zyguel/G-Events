import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/apiAuth";
import { revalidatePath } from "next/cache";

function parseDescription(raw: any) {
    if (!raw) return {};
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}



export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
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

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Get user ID
        const { data: userRow } = await supabase.from('User').select('id').ilike('email', user.email).limit(1).single();
        if (!userRow) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Get Event Registration ID
        const { data: reg } = await supabase.from('Registration')
            .select('id')
            .eq('event_id', eventNumericId)
            .eq('user_id', userRow.id)
            .not('status', 'in', '("cancelled","rejected")')
            .limit(1)
            .single();

        if (!reg) {
            return NextResponse.json({ success: false, error: "You are not registered for this event." }, { status: 403 });
        }

        const registrationId = reg.id;

        if (body.action === 'join') {
            // Check Capacity and Overlaps
            
            // 1. Get Target Session
            const { data: targetSession, error: targetError } = await supabase
                .from('BreakoutSession')
                .select('id, description, room_capacity, BreakoutSessionRegistration(id)')
                .eq('id', breakoutId)
                .single();
                
            if (targetError || !targetSession) {
                return NextResponse.json({ success: false, error: "Breakout session not found" }, { status: 404 });
            }

            const currentAttendees = Array.isArray(targetSession.BreakoutSessionRegistration) 
                                     ? targetSession.BreakoutSessionRegistration.length : 0;
            if (targetSession.room_capacity > 0 && currentAttendees >= targetSession.room_capacity) {
                return NextResponse.json({ success: false, error: "This breakout session is full." }, { status: 409 });
            }

            const targetMeta = parseDescription(targetSession.description);
            if (targetMeta.status === "Completed" || targetMeta.status === "Cancelled") {
                return NextResponse.json({ success: false, error: "This session is not available." }, { status: 409 });
            }

            // 2. Enforce 1 Session Maximum
            const { data: userRegistrations } = await supabase
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
            
            // Insert
            const { error: insertError } = await supabase.from('BreakoutSessionRegistration').insert({
                breakout_session_id: breakoutId,
                registration_id: registrationId
            });

            if (insertError) {
                // Supabase error format check for unique constraint violations
                if (insertError.code === '23505') {
                    return NextResponse.json({ success: false, error: "Already joined this session." }, { status: 409 });
                }
                throw insertError;
            }

        } else if (body.action === 'leave') {
            const { error: deleteError } = await supabase.from('BreakoutSessionRegistration')
                .delete()
                .eq('registration_id', registrationId)
                .eq('breakout_session_id', breakoutId);
            
            if (deleteError) throw deleteError;
        } else {
            return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }

        revalidatePath(`/events/${eventId}/my-breakouts`);
        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("MyBreakouts API error:", e);
        return NextResponse.json({ success: false, error: e?.message || "Unexpected error" }, { status: 500 });
    }
}
