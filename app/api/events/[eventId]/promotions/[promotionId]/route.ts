import { NextRequest, NextResponse } from 'next/server';
import { getPromotion, updatePromotion, deletePromotion } from '@/lib/db';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';

// GET /api/events/[eventId]/promotions/[promotionId] - Get a single promotion
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; promotionId: string }> }
) {
    try {
        await requireUser();
        const { promotionId, eventId } = await params;
        const id = parseInt(promotionId);
        const parsedEventId = parseInt(eventId, 10);

        if (isNaN(id) || isNaN(parsedEventId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID or promotion ID' },
                { status: 400 }
            );
        }

        const promotion = await getPromotion(id);
        if (promotion.event_id !== parsedEventId) {
            return NextResponse.json(
                { success: false, error: 'Promotion not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: promotion });
    } catch (error: any) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error fetching promotion:', error);
        if (error.code === 'PGRST116') {
            return NextResponse.json(
                { success: false, error: 'Promotion not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch promotion' },
            { status: 500 }
        );
    }
}

// PATCH /api/events/[eventId]/promotions/[promotionId] - Update a promotion
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; promotionId: string }> }
) {
    try {
        await requireUser();
        const { promotionId, eventId } = await params;
        const id = parseInt(promotionId);
        const parsedEventId = parseInt(eventId, 10);
        const body = await request.json();

        if (isNaN(id) || isNaN(parsedEventId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID or promotion ID' },
                { status: 400 }
            );
        }

        if (Object.keys(body).length === 0) {
            return NextResponse.json(
                { success: false, error: 'No fields provided to update' },
                { status: 400 }
            );
        }

        // Separate ticket_ids from promo fields
        const { ticket_ids, ...promoFields } = body;

        const existing = await getPromotion(id);
        if (existing.event_id !== parsedEventId) {
            return NextResponse.json(
                { success: false, error: 'Promotion not found' },
                { status: 404 }
            );
        }

        const promotion = await updatePromotion(id, promoFields, ticket_ids);
        return NextResponse.json({ success: true, data: promotion });
    } catch (error: any) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error updating promotion:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update promotion' },
            { status: 500 }
        );
    }
}

// DELETE /api/events/[eventId]/promotions/[promotionId] - Delete a promotion
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; promotionId: string }> }
) {
    try {
        await requireUser();
        const { promotionId, eventId } = await params;
        const id = parseInt(promotionId);
        const parsedEventId = parseInt(eventId, 10);

        if (isNaN(id) || isNaN(parsedEventId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID or promotion ID' },
                { status: 400 }
            );
        }

        const existing = await getPromotion(id);
        if (existing.event_id !== parsedEventId) {
            return NextResponse.json(
                { success: false, error: 'Promotion not found' },
                { status: 404 }
            );
        }

        await deletePromotion(id);
        return NextResponse.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error: any) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error deleting promotion:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete promotion' },
            { status: 500 }
        );
    }
}
