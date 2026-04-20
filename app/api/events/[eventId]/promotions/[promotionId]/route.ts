import { NextRequest, NextResponse } from 'next/server';
import { getPromotion, updatePromotion, deletePromotion } from '@/lib/db';
import { getAuthErrorResponse, requireUser } from '@/lib/apiAuth';

type PromotionUpdateBody = {
    name?: unknown;
    code?: unknown;
    discount_type?: unknown;
    discount_value?: unknown;
    max_uses?: unknown;
    current_uses?: unknown;
    start_at?: unknown;
    end_at?: unknown;
    is_automatic?: unknown;
    ticket_ids?: unknown;
};

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function getErrorStatus(error: unknown): number {
    if (typeof error === 'object' && error !== null) {
        const maybeStatus = (error as { statusCode?: unknown }).statusCode;
        if (typeof maybeStatus === 'number') {
            return maybeStatus;
        }
    }

    return 500;
}

function normalizeTicketIds(value: unknown): number[] | undefined {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) return undefined;

    return value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0);
}

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
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error fetching promotion:', error);
        if (typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'PGRST116') {
            return NextResponse.json(
                { success: false, error: 'Promotion not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to fetch promotion') },
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
        const body = (await request.json()) as PromotionUpdateBody;

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
        const normalizedPromoFields: Partial<{
            name: string;
            code: string;
            discount_type: string;
            discount_value: number;
            max_uses: number;
            current_uses: number;
            start_at: string | null;
            end_at: string | null;
            is_automatic: boolean;
        }> = {};

        if (promoFields.name !== undefined) normalizedPromoFields.name = String(promoFields.name);
        if (promoFields.code !== undefined) normalizedPromoFields.code = String(promoFields.code);
        if (promoFields.discount_type !== undefined) normalizedPromoFields.discount_type = String(promoFields.discount_type);
        if (promoFields.discount_value !== undefined) normalizedPromoFields.discount_value = Number(promoFields.discount_value);
        if (promoFields.max_uses !== undefined) normalizedPromoFields.max_uses = Number(promoFields.max_uses);
        if (promoFields.current_uses !== undefined) normalizedPromoFields.current_uses = Number(promoFields.current_uses);
        if (promoFields.start_at !== undefined) normalizedPromoFields.start_at = promoFields.start_at === null ? null : String(promoFields.start_at);
        if (promoFields.end_at !== undefined) normalizedPromoFields.end_at = promoFields.end_at === null ? null : String(promoFields.end_at);
        if (promoFields.is_automatic !== undefined) normalizedPromoFields.is_automatic = Boolean(promoFields.is_automatic);

        const existing = await getPromotion(id);
        if (existing.event_id !== parsedEventId) {
            return NextResponse.json(
                { success: false, error: 'Promotion not found' },
                { status: 404 }
            );
        }

        const promotion = await updatePromotion(id, normalizedPromoFields, normalizeTicketIds(ticket_ids));
        return NextResponse.json({ success: true, data: promotion });
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error updating promotion:', error);
        const status = getErrorStatus(error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to update promotion') },
            { status }
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
    } catch (error: unknown) {
        const authError = getAuthErrorResponse(error);
        if (authError) return authError;

        console.error('Error deleting promotion:', error);
        const status = getErrorStatus(error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to delete promotion') },
            { status }
        );
    }
}
