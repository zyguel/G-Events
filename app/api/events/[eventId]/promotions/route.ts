import { NextRequest, NextResponse } from 'next/server';
import { getPromotions, createPromotion } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';

// GET /api/events/[eventId]/promotions - List all promotions for an event
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const promotions = await getPromotions(id);
        return NextResponse.json({ success: true, data: promotions });
    } catch (error: any) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch promotions' },
            { status: 500 }
        );
    }
}

// POST /api/events/[eventId]/promotions - Create a new promotion
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        await requireUser();
        const { eventId } = await params;
        const id = parseInt(eventId);
        const body = await request.json();

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        if (!body.code) {
            return NextResponse.json(
                { success: false, error: 'Promotion code is required' },
                { status: 400 }
            );
        }

        const promotion = await createPromotion(
            id,
            {
                name: body.name || body.code,
                code: body.code,
                discount_type: body.discount_type,
                discount_value: body.discount_value,
                max_uses: body.max_uses,
                current_uses: body.current_uses ?? 0,
                start_at: body.start_at,
                end_at: body.end_at,
                is_automatic: body.is_automatic ?? false,
            },
            body.ticket_ids
        );

        return NextResponse.json({ success: true, data: promotion }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating promotion:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create promotion' },
            { status: 500 }
        );
    }
}
