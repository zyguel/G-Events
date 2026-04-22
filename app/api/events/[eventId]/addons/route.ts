import { NextRequest, NextResponse } from 'next/server';
import { getAddOns, createAddOn } from '@/lib/db';
import { createClient } from '@/lib/supabase-server';
import { requireUser } from '@/lib/apiAuth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { validateUploadedImageFile } from '@/lib/uploadedImageValidation';

const ADD_ON_MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_ADD_ON_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
]);
const ALLOWED_ADD_ON_IMAGE_LABEL = 'JPEG, PNG, WebP, GIF, AVIF, SVG';
const ADD_ON_NAME_MAX_LENGTH = 23;
const ADD_ON_DESCRIPTION_MAX_LENGTH = 256;

type AddOnVariantPayload = {
    code: string;
    label: string;
    stock_total: number;
};

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null) {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
            return maybeMessage;
        }

        const maybeDetails = (error as { details?: unknown }).details;
        if (typeof maybeDetails === 'string' && maybeDetails.trim()) {
            return maybeDetails;
        }
    }

    return fallback;
}

function getErrorStatus(error: unknown): number {
    if (typeof error === 'object' && error !== null) {
        const maybeStatus = (error as { statusCode?: number }).statusCode;
        if (typeof maybeStatus === 'number') {
            return maybeStatus;
        }

        const maybeCode = (error as { code?: string }).code;
        if (maybeCode === '23505') {
            return 409;
        }
    }

    return 500;
}

async function getStorageClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }

    return await createClient();
}

async function uploadAddOnImage(file: File, eventId: number): Promise<string> {
    const fileName = `addons/${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    const supabase = await getStorageClient();

    const { error } = await supabase.storage
        .from('events')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(fileName);

    return publicUrl;
}

async function validateAddOnImage(file: File): Promise<string | null> {
    return validateUploadedImageFile(file, {
        allowedMimeTypes: ALLOWED_ADD_ON_IMAGE_TYPES,
        allowedFormatsLabel: ALLOWED_ADD_ON_IMAGE_LABEL,
        maxBytes: ADD_ON_MAX_IMAGE_SIZE_BYTES,
    });
}

function parseVariantsPayload(variantsJson: string): AddOnVariantPayload[] {
    const parsed = JSON.parse(variantsJson) as unknown;
    if (!Array.isArray(parsed)) {
        throw new Error('Variants payload must be an array.');
    }

    return parsed.map((variant) => {
        if (typeof variant !== 'object' || variant === null) {
            throw new Error('Each variant must be an object.');
        }

        const stockTotal = Number((variant as { stock_total?: unknown }).stock_total);
        const label = typeof (variant as { label?: unknown }).label === 'string'
            ? (variant as { label: string }).label.trim()
            : '';
        const code = typeof (variant as { code?: unknown }).code === 'string'
            ? (variant as { code: string }).code.trim()
            : label;

        return {
            code,
            label,
            stock_total: stockTotal,
        };
    });
}

function parseTicketIdsPayload(ticketIdsJson: FormDataEntryValue | null): number[] | undefined {
    if (ticketIdsJson === null) {
        return undefined;
    }

    if (typeof ticketIdsJson !== 'string') {
        throw new Error('Ticket selection payload must be a JSON array.');
    }

    const parsed = JSON.parse(ticketIdsJson) as unknown;
    if (!Array.isArray(parsed)) {
        throw new Error('Ticket selection payload must be an array.');
    }

    const normalized = parsed.map((id) => Number(id));
    const hasInvalid = normalized.some((id) => !Number.isInteger(id) || id <= 0);
    if (hasInvalid) {
        throw new Error('Ticket selection payload contains invalid IDs.');
    }

    return Array.from(new Set(normalized));
}

function validateVariantsPayload(variants: AddOnVariantPayload[] | undefined, hasVariants: boolean): string | null {
    if (!variants || variants.length === 0) {
        return 'Quantity is required and must be greater than 0.';
    }

    const hasInvalidStock = variants.some((variant) => !Number.isFinite(variant.stock_total) || variant.stock_total <= 0);
    if (hasInvalidStock) {
        return 'Quantity must be greater than 0.';
    }

    if (hasVariants) {
        const hasInvalidLabel = variants.some((variant) => !variant.label || !variant.label.trim());
        if (hasInvalidLabel) {
            return 'Variant label is required when variants are enabled.';
        }
    }

    return null;
}

// GET /api/events/[eventId]/addons - List all add-ons for an event
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

        const addOns = await getAddOns(id);
        return NextResponse.json({ success: true, data: addOns });
    } catch (error: unknown) {
        console.error('Error fetching add-ons:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to fetch add-ons') },
            { status: 500 }
        );
    }
}

// POST /api/events/[eventId]/addons - Create a new add-on (accepts FormData with optional image)
export async function POST(
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

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const description = formData.get('description') as string | null;
        const has_variants = formData.get('has_variants') === 'true';
        const variantsJson = formData.get('variants') as string | null;
        const imageFile = formData.get('image') as File | null;

        const normalizedName = typeof name === 'string' ? name.trim() : '';
        if (!normalizedName) {
            return NextResponse.json(
                { success: false, error: 'Add-on name is required' },
                { status: 400 }
            );
        }

        if (normalizedName.length > ADD_ON_NAME_MAX_LENGTH) {
            return NextResponse.json(
                { success: false, error: `Add-on name must be at most ${ADD_ON_NAME_MAX_LENGTH} characters.` },
                { status: 400 }
            );
        }

        const normalizedDescription = typeof description === 'string' ? description.trim() : '';
        if (!normalizedDescription) {
            return NextResponse.json(
                { success: false, error: 'Add-on description is required.' },
                { status: 400 }
            );
        }

        if (normalizedDescription.length > ADD_ON_DESCRIPTION_MAX_LENGTH) {
            return NextResponse.json(
                { success: false, error: `Add-on description must be at most ${ADD_ON_DESCRIPTION_MAX_LENGTH} characters.` },
                { status: 400 }
            );
        }

        let image_path: string | undefined;
        if (imageFile && imageFile.size > 0) {
            const imageError = await validateAddOnImage(imageFile);
            if (imageError) {
                return NextResponse.json(
                    { success: false, error: imageError },
                    { status: 400 }
                );
            }

            image_path = await uploadAddOnImage(imageFile, id);
        }

        let variants: AddOnVariantPayload[] | undefined;
        if (variantsJson) {
            try {
                variants = parseVariantsPayload(variantsJson);
            } catch {
                return NextResponse.json(
                    { success: false, error: 'Invalid variants payload.' },
                    { status: 400 }
                );
            }
        }

        let ticketIds: number[] | undefined;
        try {
            ticketIds = parseTicketIdsPayload(formData.get('ticket_ids'));
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid ticket_ids payload.' },
                { status: 400 }
            );
        }

        const variantsError = validateVariantsPayload(variants, has_variants);
        if (variantsError) {
            return NextResponse.json(
                { success: false, error: variantsError },
                { status: 400 }
            );
        }

        const addOn = await createAddOn(
            id,
            {
                name: normalizedName,
                description: normalizedDescription,
                image_path,
                has_variants,
            },
            variants,
            ticketIds
        );

        return NextResponse.json({ success: true, data: addOn }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating add-on:', error);
        const status = getErrorStatus(error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to create add-on') },
            { status }
        );
    }
}
