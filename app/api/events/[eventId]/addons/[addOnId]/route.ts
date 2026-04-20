import { NextRequest, NextResponse } from 'next/server';
import { getAddOn, updateAddOn, deleteAddOn } from '@/lib/db';
import { createClient } from '@/lib/supabase-server';
import { requireUser } from '@/lib/apiAuth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
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

function validateAddOnImage(file: File): string | null {
    if (file.size <= 0) {
        return 'Image file is empty.';
    }

    if (!ALLOWED_ADD_ON_IMAGE_TYPES.has(file.type)) {
        return `Unsupported image format. Allowed formats: ${ALLOWED_ADD_ON_IMAGE_LABEL}.`;
    }

    if (file.size > ADD_ON_MAX_IMAGE_SIZE_BYTES) {
        return 'Image file is too large. Maximum allowed size is 20MB.';
    }

    return null;
}

// GET /api/events/[eventId]/addons/[addOnId] - Get a single add-on
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; addOnId: string }> }
) {
    try {
        await requireUser();
        const { addOnId } = await params;
        const id = parseInt(addOnId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid add-on ID' },
                { status: 400 }
            );
        }

        const addOn = await getAddOn(id);
        return NextResponse.json({ success: true, data: addOn });
    } catch (error: unknown) {
        console.error('Error fetching add-on:', error);
        if (typeof error === 'object' && error !== null && (error as { code?: string }).code === 'PGRST116') {
            return NextResponse.json(
                { success: false, error: 'Add-on not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to fetch add-on') },
            { status: 500 }
        );
    }
}

// PATCH /api/events/[eventId]/addons/[addOnId] - Update an add-on (accepts FormData with optional image)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; addOnId: string }> }
) {
    try {
        await requireUser();
        const { eventId, addOnId } = await params;
        const id = parseInt(addOnId);
        const numericEventId = parseInt(eventId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid add-on ID' },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const name = formData.get('name') as string | null;
        const description = formData.get('description') as string | null;
        const has_variants_raw = formData.get('has_variants') as string | null;
        const has_variants = has_variants_raw !== null ? has_variants_raw === 'true' : undefined;
        const variantsJson = formData.get('variants') as string | null;
        const imageFile = formData.get('image') as File | null;

        let image_path: string | undefined;
        if (imageFile && imageFile.size > 0) {
            const imageError = validateAddOnImage(imageFile);
            if (imageError) {
                return NextResponse.json(
                    { success: false, error: imageError },
                    { status: 400 }
                );
            }

            image_path = await uploadAddOnImage(imageFile, numericEventId);
        }

        const variants = variantsJson ? JSON.parse(variantsJson) : undefined;

        const addOn = await updateAddOn(
            id,
            {
                name: name ?? undefined,
                description: description ?? undefined,
                image_path,
                has_variants,
            },
            variants
        );

        return NextResponse.json({ success: true, data: addOn });
    } catch (error: unknown) {
        console.error('Error updating add-on:', error);
        const status = getErrorStatus(error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to update add-on') },
            { status }
        );
    }
}

// DELETE /api/events/[eventId]/addons/[addOnId] - Delete an add-on
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; addOnId: string }> }
) {
    try {
        await requireUser();
        const { addOnId } = await params;
        const id = parseInt(addOnId);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid add-on ID' },
                { status: 400 }
            );
        }

        await deleteAddOn(id);
        return NextResponse.json({ success: true, message: 'Add-on deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting add-on:', error);
        const status = getErrorStatus(error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error, 'Failed to delete add-on') },
            { status }
        );
    }
}
