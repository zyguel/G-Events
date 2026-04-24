import { NextRequest, NextResponse } from 'next/server';
import { getPromotions, createPromotion } from '@/lib/db';
import { requireUser } from '@/lib/apiAuth';

type PromotionRequestBody = {
    name?: unknown;
    code?: unknown;
    discount_type?: unknown;
    discount_value?: unknown;
    max_uses?: unknown;
    current_uses?: unknown;
    start_at?: unknown;
    end_at?: unknown;
    is_automatic?: unknown;
    status?: unknown;
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
    } catch (error: unknown) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to fetch promotions') },
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
        const body = (await request.json()) as PromotionRequestBody;

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        const code = typeof body.code === 'string' ? body.code : '';
        if (!code.trim()) {
            return NextResponse.json(
                { success: false, error: 'Promotion code is required' },
                { status: 400 }
            );
        }

        const ticketIds = normalizeTicketIds(body.ticket_ids);

        const promotion = await createPromotion(
            id,
            {
                name: typeof body.name === 'string' ? body.name : code,
                code,
                discount_type: typeof body.discount_type === 'string' ? body.discount_type : '',
                discount_value: Number(body.discount_value),
                max_uses: body.max_uses !== undefined ? Number(body.max_uses) : undefined,
                current_uses: body.current_uses !== undefined ? Number(body.current_uses) : 0,
                start_at: typeof body.start_at === 'string' || body.start_at === null ? body.start_at : undefined,
                end_at: typeof body.end_at === 'string' || body.end_at === null ? body.end_at : undefined,
                is_automatic: Boolean(body.is_automatic),
                status: body.status === 'active' || body.status === 'inactive' ? body.status : undefined,
            },
            ticketIds
        );

        return NextResponse.json({ success: true, data: promotion }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating promotion:', error);
        const status = getErrorStatus(error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to create promotion') },
            { status }
        );
    }
}
