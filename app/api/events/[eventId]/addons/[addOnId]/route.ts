import { NextRequest, NextResponse } from 'next/server';
import { getAddOn, updateAddOn, deleteAddOn } from '@/lib/db';
import { createClient } from '@/lib/supabase-server';

async function uploadAddOnImage(file: File, eventId: number): Promise<string> {
    const fileName = `addons/${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    const supabase = await createClient();

    const { error } = await supabase.storage
        .from('events')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(fileName);

    return publicUrl;
}

// GET /api/events/[eventId]/addons/[addOnId] - Get a single add-on
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; addOnId: string }> }
) {
    try {
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
    } catch (error: any) {
        console.error('Error fetching add-on:', error);
        if (error.code === 'PGRST116') {
            return NextResponse.json(
                { success: false, error: 'Add-on not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch add-on' },
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
    } catch (error: any) {
        console.error('Error updating add-on:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update add-on' },
            { status: 500 }
        );
    }
}

// DELETE /api/events/[eventId]/addons/[addOnId] - Delete an add-on
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string; addOnId: string }> }
) {
    try {
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
    } catch (error: any) {
        console.error('Error deleting add-on:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete add-on' },
            { status: 500 }
        );
    }
}
