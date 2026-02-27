import { NextRequest, NextResponse } from 'next/server';
import { getPromotion, updatePromotion, deletePromotion } from '@/lib/db';

// GET /api/events/[eventId]/promotions/[promotionId] - Get a single promotion
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; promotionId: string }> }
) {
    try {
        const { promotionId } = await params;
        const id = parseInt(promotionId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid promotion ID' },
                { status: 400 }
            );
        }

        const promotion = await getPromotion(id);
        return NextResponse.json({ success: true, data: promotion });
    } catch (error: any) {
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
        const { promotionId } = await params;
        const id = parseInt(promotionId);
        const body = await request.json();

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid promotion ID' },
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

        const promotion = await updatePromotion(id, promoFields, ticket_ids);
        return NextResponse.json({ success: true, data: promotion });
    } catch (error: any) {
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
        const { promotionId } = await params;
        const id = parseInt(promotionId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid promotion ID' },
                { status: 400 }
            );
        }

        await deletePromotion(id);
        return NextResponse.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting promotion:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete promotion' },
            { status: 500 }
        );
    }
}
