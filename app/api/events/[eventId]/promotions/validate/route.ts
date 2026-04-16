import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// POST /api/events/[eventId]/promotions/validate
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const { code } = body;

        const numericEventId = parseInt(eventId, 10);
        if (isNaN(numericEventId)) {
            return NextResponse.json({ success: false, error: 'Invalid event ID' }, { status: 400 });
        }

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ success: false, error: 'Promotion code is required' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        const { data: promotion, error } = await supabase
            .from('Promotion')
            .select(`
                *,
                PromotionTicket ( ticket_id )
            `)
            .eq('event_id', numericEventId)
            .ilike('code', code.trim())
            .single();

        if (error || !promotion) {
            return NextResponse.json({ success: false, error: 'Invalid promotion code' }, { status: 404 });
        }

        // Validate times
        const now = new Date();
        if (promotion.start_at && new Date(promotion.start_at) > now) {
            return NextResponse.json({ success: false, error: 'Promotion code is not yet active' }, { status: 400 });
        }
        if (promotion.end_at && new Date(promotion.end_at) < now) {
            return NextResponse.json({ success: false, error: 'Promotion code has expired' }, { status: 400 });
        }

        // Validate usage limits
        const maxUses = Number(promotion.max_uses ?? 0);
        const currentUses = Number(promotion.current_uses ?? 0);
        if (maxUses > 0 && currentUses >= maxUses) {
            return NextResponse.json({ success: false, error: 'Promotion code usage limit reached' }, { status: 400 });
        }

        const ticketIds = promotion.PromotionTicket?.map((pt: any) => pt.ticket_id) || [];

        return NextResponse.json({
            success: true,
            data: {
                id: promotion.id,
                code: promotion.code,
                discount_type: promotion.discount_type,
                discount_value: promotion.discount_value,
                ticket_ids: ticketIds,
            }
        });

    } catch (error: any) {
        console.error('Error validating promotion:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to validate promotion' },
            { status: 500 }
        );
    }
}
